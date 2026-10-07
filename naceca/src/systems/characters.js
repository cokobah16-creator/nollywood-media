/* =========================================================================
   NACECA · systems/characters.js
   Jointed toon characters. Every limb hangs from a real pivot (shoulder,
   elbow, hip, knee, neck) so swings, raised hands and kneels read naturally.
   API-compatible with the old box-people: userData.armL/armR are shoulder
   pivots and legL/legR are hip pivots, so existing scene code keeps working.
   A secondary pass (animateRigs) adds knee and elbow bend, bob, breathing,
   blinking and idle head movement on top of whatever the scene animates.
   ========================================================================= */

const _matCache = {};
function rigMat(color){ return _matCache[color] || (_matCache[color] = toonMat(color)); }
function darken(hex, f){
  const c = new THREE.Color(hex); c.multiplyScalar(f); return '#' + c.getHexString();
}
function part(geo, color, x, y, z, parent, outl=1.06){
  const m = new THREE.Mesh(geo, rigMat(color));
  m.position.set(x, y, z); m.castShadow = true; parent.add(m);
  if(outl) outline(m, outl);
  return m;
}
function cyl(rt, rb, h, seg=10){ return new THREE.CylinderGeometry(rt, rb, h, seg); }
function sph(r, ws=14, hs=12){ return new THREE.SphereGeometry(r, ws, hs); }

/* opts: female, hair ('crop'|'bun'|'afro'|'braids'|'gele'|'cap'|'beret'|'bald'|'mask'),
         hairColor, capColor, beard, beardColor, robe (long garment colour), longSleeve,
         glasses, build ('slim'|'heavy'), scale */
function buildHumanoidLegacy(skin, shirt, pants, hairColor, opts={}){
  const g = new THREE.Group();
  const female = !!opts.female;
  const heavy = opts.build === 'heavy';
  const shoe = opts.shoe || '#14100c';
  const sleeve = opts.longSleeve ? shirt : skin;
  const hipW = female ? 0.105 : 0.11;

  // ---- legs: hip pivot → thigh → knee pivot → shin → shoe ----
  const legs = [];
  for(const sx of [-1,1]){
    const hip = new THREE.Group(); hip.position.set(sx*hipW, 0.92, 0); g.add(hip);
    part(cyl(0.085, 0.066, 0.44), pants, 0, -0.22, 0, hip);
    const knee = new THREE.Group(); knee.position.set(0, -0.44, 0); hip.add(knee);
    part(cyl(0.064, 0.05, 0.40), pants, 0, -0.20, 0, knee);
    const foot = part(new THREE.BoxGeometry(0.115, 0.08, 0.25), shoe, 0, -0.43, 0.045, knee, 1.05);
    legs.push({hip, knee, foot});
  }
  // pelvis
  const pelvis = part(cyl(heavy?0.2:0.165, heavy?0.2:0.17, 0.2, 12), pants, 0, 0.95, 0, g);
  pelvis.scale.z = 0.72;

  // ---- torso (spine pivot so it can breathe / lean) ----
  const spine = new THREE.Group(); spine.position.set(0, 1.0, 0); g.add(spine);
  const chestTopR = female ? 0.175 : 0.205, waistR = heavy ? 0.22 : (female ? 0.14 : 0.165);
  const chest = part(cyl(chestTopR, waistR, 0.48, 14), shirt, 0, 0.23, 0, spine);
  const shirtParts = [chest];
  chest.scale.z = heavy ? 0.85 : 0.66;
  if(heavy){ const belly = part(sph(0.2), shirt, 0, 0.1, 0.06, spine); belly.scale.set(1.05,0.9,0.8); }
  for(const sx of [-1,1]){ shirtParts.push(part(sph(0.075, 10, 8), opts.tank ? skin : shirt, sx*(chestTopR+0.02), 0.44, 0, spine, 1.05)); }
  part(cyl(0.05, 0.058, 0.1), skin, 0, 0.52, 0, spine, 0);

  // ---- head (neck pivot) ----
  const neck = new THREE.Group(); neck.position.set(0, 1.55, 0); g.add(neck);
  const head = part(sph(0.15, 18, 14), skin, 0, 0.1, 0, neck, 1.07);
  head.scale.set(0.93, 1.08, 0.98);
  for(const sx of [-1,1]) part(sph(0.03, 8, 6), skin, sx*0.142, 0.09, -0.005, neck, 0);       // ears
  const eyes = [];
  for(const sx of [-1,1]){
    const white = part(sph(0.022, 10, 8), '#f4eee4', sx*0.05, 0.12, 0.128, neck, 0); white.scale.z = 0.55;
    const pupil = part(sph(0.0125, 8, 6), '#140c08', sx*0.05, 0.12, 0.14, neck, 0);
    const brow = part(new THREE.BoxGeometry(0.05, 0.011, 0.01), darken(hairColor === '#f4ead0' ? '#c8c0b0' : hairColor, 1), sx*0.05, 0.155, 0.135, neck, 0);
    brow.rotation.z = sx * -0.12;
    eyes.push(white, pupil);
  }
  part(sph(0.024, 8, 6), darken(skin, 0.86), 0, 0.085, 0.15, neck, 0).scale.set(1.15, 0.85, 0.8);   // nose
  const mouth = part(new THREE.BoxGeometry(0.05, 0.009, 0.01), darken(skin, 0.55), 0, 0.035, 0.137, neck, 0);
  if(female){ mouth.scale.set(1, 1.6, 1); mouth.material = rigMat('#6a2a2a'); }
  if(opts.glasses){
    for(const sx of [-1,1]){ const r = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.005, 6, 16), rigMat('#141414')); r.position.set(sx*0.05, 0.12, 0.148); neck.add(r); }
    part(new THREE.BoxGeometry(0.035, 0.005, 0.005), '#141414', 0, 0.123, 0.15, neck, 0);
  }
  if(opts.goatee){
    const gc = opts.beardColor || hairColor;
    const gt = part(sph(0.05, 10, 8), gc, 0, -0.01, 0.1, neck, 1.04); gt.scale.set(0.9, 1.25, 0.8);
    part(new THREE.BoxGeometry(0.07, 0.014, 0.02), gc, 0, 0.058, 0.138, neck, 0);
  }
  if(opts.beard){
    const bc = opts.beardColor || hairColor;
    const beard = part(sph(0.1, 12, 8), bc, 0, 0.005, 0.055, neck, 1.04); beard.scale.set(1.18, 0.62, 0.86);
    part(new THREE.BoxGeometry(0.07, 0.016, 0.02), bc, 0, 0.058, 0.138, neck, 0);   // moustache
  }

  // ---- hair / headwear ----
  const hs = opts.hair || (female ? 'bun' : 'crop');
  const capC = opts.capColor || hairColor;
  if(hs==='crop' || hs==='bun' || hs==='braids' || hs==='afro'){
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.158, 18, 10, 0, Math.PI*2, 0, Math.PI/2.15), rigMat(hairColor));
    cap.position.set(0, 0.115, -0.006); cap.scale.set(0.95, 1.08, 1.02); neck.add(cap); outline(cap, 1.05);
  }
  if(hs==='afro'){ const a = part(sph(0.2, 14, 12), hairColor, 0, 0.17, -0.02, neck, 1.04); a.scale.set(1, 0.85, 0.95); }
  if(hs==='bun'){ part(sph(0.07, 10, 8), hairColor, 0, 0.2, -0.12, neck, 1.06); }
  if(hs==='braids'){
    for(let i=0;i<7;i++){ const a = -0.9 + i*0.3; const b = part(cyl(0.016, 0.012, 0.3, 6), hairColor, Math.sin(a)*0.14, -0.02, -0.08 + Math.cos(a)*-0.05, neck, 0); b.rotation.x = 0.15; }
  }
  if(hs==='gele'){
    const base = part(cyl(0.17, 0.16, 0.12, 14), capC, 0, 0.19, -0.01, neck, 1.05);
    const fan = part(sph(0.2, 14, 10), capC, 0, 0.29, -0.03, neck, 1.04); fan.scale.set(1.25, 0.55, 0.85); fan.rotation.x = -0.25;
    const knot = part(sph(0.05, 8, 6), darken(capC, 0.8), 0.12, 0.31, 0.04, neck, 0);
  }
  if(hs==='cap'){                       // kufi / fila
    const k = part(cyl(0.155, 0.158, 0.11, 16), capC, 0, 0.2, -0.005, neck, 1.05);
  }
  if(hs==='beret'){
    part(sph(0.155, 16, 10), hairColor, 0, 0.115, -0.006, neck, 1.04).scale.set(0.95, 0.9, 1.0);
    const b = part(cyl(0.17, 0.165, 0.06, 16), capC, -0.03, 0.22, 0, neck, 1.05); b.rotation.z = 0.22;
  }
  if(hs==='bcap'){                      // baseball cap with a brim (a crown that sits above the brow)
    const crown = new THREE.Mesh(new THREE.SphereGeometry(0.162, 16, 10, 0, Math.PI*2, 0, Math.PI/2), rigMat(capC));
    crown.position.set(0, 0.15, -0.008); crown.scale.set(0.98, 0.95, 1.04); neck.add(crown); outline(crown, 1.05);
    const brim = part(new THREE.BoxGeometry(0.22, 0.016, 0.15), capC, 0, 0.155, 0.17, neck, 1.05); brim.rotation.x = 0.1;
  }
  if(hs==='twists'){                    // short twists
    const cap3 = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 10, 0, Math.PI*2, 0, Math.PI/2.1), rigMat(hairColor));
    cap3.position.set(0, 0.12, -0.006); cap3.scale.set(0.97, 1.12, 1.03); neck.add(cap3); outline(cap3, 1.05);
    for(let k=0;k<11;k++){ const a = k*2.39, r = 0.05 + (k%3)*0.03; part(sph(0.035, 6, 5), hairColor, Math.cos(a)*r, 0.25 - r*0.4, Math.sin(a)*r*0.9 - 0.01, neck, 0); }
  }
  if(hs==='updo'){                      // high braided bun
    const cap2 = new THREE.Mesh(new THREE.SphereGeometry(0.158, 18, 10, 0, Math.PI*2, 0, Math.PI/2.1), rigMat(hairColor));
    cap2.position.set(0, 0.115, -0.006); cap2.scale.set(0.95, 1.08, 1.02); neck.add(cap2); outline(cap2, 1.05);
    part(sph(0.1, 12, 10), hairColor, 0, 0.29, -0.04, neck, 1.05).scale.set(1, 0.85, 1);
  }
  if(hs==='wrap'){                      // a simple head-tie
    const w = part(sph(0.168, 16, 10), capC, 0, 0.16, -0.015, neck, 1.04); w.scale.set(1, 0.8, 1.05);
    part(sph(0.06, 8, 6), darken(capC, 0.85), 0.03, 0.27, 0.08, neck, 0);
  }
  if(hs==='gelePuff'){                  // a big, rounded gele
    part(cyl(0.165, 0.16, 0.08, 16), capC, 0, 0.18, -0.01, neck, 1.04);
    const puff = part(sph(0.26, 14, 10), capC, 0, 0.33, -0.02, neck, 1.04); puff.scale.set(1.25, 0.6, 1.15);
  }
  if(hs==='mask'){
    const m = part(sph(0.162, 16, 12), capC || '#141414', 0, 0.1, 0, neck, 1.04); m.scale.set(0.95, 1.1, 1.0);
    const slit = part(new THREE.BoxGeometry(0.14, 0.04, 0.02), skin, 0, 0.12, 0.148, neck, 0);
  }

  // ---- arms: shoulder pivot → upper arm → elbow pivot → forearm → hand ----
  const arms = [];
  for(const sx of [-1,1]){
    const sh = new THREE.Group(); sh.position.set(sx*(chestTopR+0.045), 1.43, 0); g.add(sh);
    const rest = new THREE.Group(); rest.rotation.z = sx * 0.09; sh.add(rest);       // arms hang slightly out
    shirtParts.push(part(cyl(0.06, 0.05, 0.29), opts.tank ? skin : shirt, 0, -0.145, 0, rest));
    const elbow = new THREE.Group(); elbow.position.set(0, -0.29, 0); rest.add(elbow);
    part(cyl(0.049, 0.041, 0.26), sleeve, 0, -0.13, 0, elbow);
    const hand = part(sph(0.048, 10, 8), skin, 0, -0.285, 0.005, elbow, 1.06); hand.scale.set(0.85, 1.1, 0.7);
    elbow.rotation.x = -0.12;
    arms.push({sh, elbow, hand});
  }

  // ---- knee-length skirt ----
  if(opts.skirt){
    const sk = part(cyl(0.175, 0.205, 0.5, 16), opts.skirt, 0, 0.74, 0, g, 1.04); sk.scale.z = 0.8;
  }
  // ---- long garment (wrapper, robe, agbada) over the legs ----
  if(opts.robe){
    var robe = part(cyl(heavy?0.22:0.18, 0.29, 0.74, 16), opts.robe, 0, 0.6, 0, g, 1.04);
    robe.scale.z = 0.8;
    if(opts.robeTrim){ part(cyl(0.292, 0.292, 0.05, 16), opts.robeTrim, 0, 0.255, 0, g, 0).scale.z = 0.8; }
  }

  g.userData = {
    _rig:true, armL:arms[0].sh, armR:arms[1].sh, legL:legs[0].hip, legR:legs[1].hip,
    elbowL:arms[0].elbow, elbowR:arms[1].elbow, kneeL:legs[0].knee, kneeR:legs[1].knee,
    handR:arms[1].hand, handL:arms[0].hand, spine, neck, eyes, walkPhase:0, baseY:0,
    shirtParts, robe: (typeof robe!=='undefined' ? robe : null),
    _seed: Math.random()*100, _last:null, _blink:2+Math.random()*3,
  };
  if(opts.scale) g.scale.setScalar(opts.scale);
  return g;
}

/* Kelechi — the player. Navy NACECA uniform, plate carrier, low fade, sidearm in hand. */
function buildPlayerMeshLegacy(){
  const g = buildHumanoid('#5a3826', '#14234a', '#1a1f2e', '#0c0a10', { hair:'crop', longSleeve:true, shoe:'#0a0a0a' });
  const u = g.userData;
  const vest = new THREE.Mesh(cyl(0.2, 0.175, 0.36, 14), rigMat('#0a1428'));
  vest.position.set(0, 0.24, 0); vest.scale.z = 0.78; u.spine.add(vest); outline(vest, 1.05);
  for(let i=-1;i<=1;i++){ const mag = new THREE.Mesh(new THREE.BoxGeometry(0.075,0.12,0.05), rigMat('#06080e')); mag.position.set(i*0.09, 0.14, 0.15); u.spine.add(mag); }
  const patch = new THREE.Mesh(new THREE.PlaneGeometry(0.15,0.055), basicMat('#d8a64a')); patch.position.set(0.075, 0.36, 0.158); u.spine.add(patch);
  const belt = new THREE.Mesh(cyl(0.172, 0.172, 0.06, 14), rigMat('#1a1208')); belt.position.y = 1.0; belt.scale.z = 0.74; g.add(belt); outline(belt, 1.04);
  // sidearm in the right hand, low-ready
  const gun = new THREE.Group();
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.045,0.11,0.035), rigMat('#0a0a0a')); grip.position.y = 0.0; gun.add(grip);
  const slide = new THREE.Mesh(new THREE.BoxGeometry(0.045,0.04,0.16), rigMat('#1a1a1a')); slide.position.set(0,0.055,0.05); gun.add(slide); outline(slide,1.08);
  gun.position.set(0, -0.3, 0.03); u.elbowR.add(gun);
  u.elbowR.rotation.x = -0.35;
  u._baseElbowR = -0.35;
  return g;
}

/* Old signature kept: buildNPCMesh(skin, shirt, pants, hair[, opts]). */
function buildNPCMesh(skin, shirt, pants, hair, opts){
  return buildHumanoid(skin, shirt, pants, hair, opts || {});
}

/* Secondary animation for every rigged character in the scene. Runs after the
   scene's own update so it layers on top: it never fights the primary swing. */
function animateRigs(dt){
  const list = [];
  if(ENGINE.player) list.push(ENGINE.player);
  for(const n of ENGINE.npcs){ const o = (n && n.isObject3D) ? n : (n && n.mesh); if(o) list.push(o); }
  const t = performance.now()/1000;
  for(const g of list){
    const u = g.userData; if(!u || !u._rig || !g.visible) continue;
    // speed from actual movement
    const p = g.position;
    let v = 0;
    if(u._last){ v = Math.hypot(p.x-u._last.x, p.z-u._last.z) / Math.max(dt, 1e-3); u._last.set(p.x, p.y, p.z); }
    else u._last = p.clone();
    u._v = THREE.MathUtils.lerp(u._v||0, v, Math.min(1, dt*10));
    const moving = u._v > 0.35;
    if(u._pose){
      const P = u._pose;
      if(P.armL){ u.armL.rotation.set(P.armL[0], P.armL[1], P.armL[2]); }
      if(P.armR){ u.armR.rotation.set(P.armR[0], P.armR[1], P.armR[2]); }
    }
    const lL = u.legL.rotation.x, lR = u.legR.rotation.x;
    // knees fold as the leg swings through; a little bend even when standing
    u.kneeL.rotation.x = THREE.MathUtils.clamp(Math.max(0, lL)*1.5 + (moving?0.18:0.04), 0, 1.6);
    u.kneeR.rotation.x = THREE.MathUtils.clamp(Math.max(0, lR)*1.5 + (moving?0.18:0.04), 0, 1.6);
    // elbows: forward swing bends the elbow; raised-hands poses keep it straighter
    const aL = u.armL.rotation.x, aR = u.armR.rotation.x;
    if(!(u._pose && u._pose.elbowL != null)) u.elbowL.rotation.x = aL < -1.2 ? -0.2 : -(0.12 + Math.max(0, -aL)*0.7 + (moving?0.15:0));
    if(u._pose && u._pose.elbowL != null) u.elbowL.rotation.x = u._pose.elbowL;
    if(u._pose && u._pose.elbowR != null) u.elbowR.rotation.x = u._pose.elbowR;
    else if(u._baseElbowR != null) u.elbowR.rotation.x = u._baseElbowR - Math.max(0,-aR)*0.3;
    else u.elbowR.rotation.x = aR < -1.2 ? -0.2 : -(0.12 + Math.max(0, -aR)*0.7 + (moving?0.15:0));
    // walking bob + torso counter-twist; idle breathing + head drift
    const s = u._seed;
    if(moving){
      const ph = u.walkPhase || (t*8);
      u.spine.rotation.y = Math.sin(ph)*0.06;
      u.spine.position.y = 1.0 + Math.abs(Math.cos(ph))*0.02;
      u.neck.rotation.y *= 0.9;
    } else {
      u.spine.rotation.y *= 0.9;
      u.spine.position.y = 1.0;
      u.spine.scale.set(1 + Math.sin(t*1.6+s)*0.012, 1, 1 + Math.sin(t*1.6+s)*0.02);
      u.neck.rotation.y = Math.sin(t*0.37+s)*0.22 + Math.sin(t*0.91+s*2)*0.05;
      u.neck.rotation.x = Math.sin(t*0.53+s)*0.04;
    }
    // blink
    u._blink -= dt;
    const closed = u._blink < 0.12;
    if(u._blink < 0) u._blink = 2.2 + Math.random()*3.5;
    for(const e of u.eyes) e.scale.y = closed ? 0.15 : 1;
  }
}

/* plate carrier strapped to a rigged character's torso (moves and breathes with it) */
function addVestLegacy(g, color='#0b1a3a'){
  const u = g.userData; if(!u || !u.spine) return null;
  const v = new THREE.Mesh(cyl(0.215, 0.19, 0.36, 14), rigMat(color));
  v.position.set(0, 0.24, 0); v.scale.z = 0.8; u.spine.add(v); outline(v, 1.05);
  for(let i=-1;i<=1;i++){ const m = new THREE.Mesh(new THREE.BoxGeometry(0.075,0.12,0.05), rigMat('#06080e')); m.position.set(i*0.09, 0.14, 0.16); u.spine.add(m); }
  return v;
}
