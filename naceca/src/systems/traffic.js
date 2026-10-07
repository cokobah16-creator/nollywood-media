/* =========================================================================
   NACECA · systems/traffic.js
   Lagos traffic for street scenes. Vehicles run along lanes, brake and honk
   if Kelechi steps in front of them (nobody dies crossing the road — the
   horn is the lesson), and recycle at the ends of the road.
     startTraffic(scene, { lanes:[{z, dir, speed}], xMin, xMax, density })
   Families: danfo · taxi · saloon · okada (with rider). Nigerian plates.
   ========================================================================= */

const TRAFFIC = { cars:[], cfg:null, scene:null, honkCool:0 };

function _plateTex(text){
  const c = document.createElement('canvas'); c.width = 128; c.height = 40;
  const x = c.getContext('2d'); x.fillStyle = '#f2f2ea'; x.fillRect(0,0,128,40);
  x.fillStyle = '#2a7a3a'; x.fillRect(0,0,128,7); x.fillStyle = '#1a2a6a'; x.font = 'bold 20px sans-serif'; x.textAlign = 'center'; x.fillText(text, 64, 31);
  return new THREE.CanvasTexture(c);
}
function _plate(){ const L='ABCDEFGHJKLMNPRSTUVWXYZ'; const r=()=>L[Math.floor(Math.random()*L.length)]; return `${['LND','KJA','EKY','AGL','IKD'][Math.floor(Math.random()*5)]}-${100+Math.floor(Math.random()*899)}${r()}${r()}`; }

function makeVehicle(kind){
  const g = new THREE.Group(); let L = 4.2, W = 1.8;
  const box = (w,h,d,c,x,y,z,o=1.03)=>{ const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), toonMat(c)); m.position.set(x,y,z); m.castShadow = true; g.add(m); if(o) outline(m,o); return m; };
  const wheel = (x,z,r=0.34)=>{ const w = new THREE.Mesh(new THREE.CylinderGeometry(r,r,0.22,12), toonMat('#141414')); w.position.set(x,r,z); w.rotation.x = Math.PI/2; g.add(w); return w; };
  if(kind === 'danfo'){            // the yellow Lagos minibus with black stripes
    L = 4.8; W = 1.9;
    box(L, 1.7, W, '#e8b818', 0, 1.25, 0); box(L+0.02, 0.12, W+0.02, '#141414', 0, 0.85, 0, 0); box(L+0.02, 0.12, W+0.02, '#141414', 0, 1.55, 0, 0);
    box(0.06, 0.7, 1.5, '#0e1218', L/2, 1.55, 0, 0); for(let i=-1;i<=1;i++) box(0.9, 0.6, 0.04, '#0e1218', i*1.2-0.2, 1.6, W/2+0.01, 0);
    [[-1.6,-0.85],[-1.6,0.85],[1.5,-0.85],[1.5,0.85]].forEach(([x,z])=>wheel(x,z,0.36));
  } else if(kind === 'okada'){     // a motorcycle taxi and its rider
    L = 1.9; W = 0.6;
    box(1.5, 0.35, 0.28, '#7a1a1a', 0, 0.75, 0); box(0.6, 0.12, 0.3, '#141414', -0.2, 0.98, 0, 0);
    wheel(-0.62, 0, 0.32).rotation.set(Math.PI/2, 0, 0); wheel(0.62, 0, 0.32);
    const rider = buildNPCMesh('#5a3826', ['#2a5aa8','#c8342c','#e0b020','#1e1e1e'][Math.floor(Math.random()*4)], '#2a2a2a', '#0a0a0a', {hair: Math.random()<0.5 ? 'bcap' : 'crop', capColor:'#141414'});
    rider.position.set(-0.15, 0.02, 0); rider.rotation.y = Math.PI/2; rider.userData._pose = { armL:[-1.1,0,0.1], armR:[-1.1,0,-0.1], elbowL:-0.3, elbowR:-0.3 };
    rider.userData.legL.rotation.x = -1.2; rider.userData.legR.rotation.x = -1.2; rider.position.y = 0.05; if(typeof applyPoseNow==='function') applyPoseNow(rider);
    g.add(rider); g.userData.rider = rider;
  } else {                          // taxi (yellow) or saloon
    const body = kind === 'taxi' ? '#e8b818' : ['#8a1a1a','#d8d8d0','#2a3a5a','#4a4a4a','#1a4a2a'][Math.floor(Math.random()*5)];
    box(L, 0.75, W, body, 0, 0.72, 0); box(2.2, 0.62, W-0.14, kind === 'taxi' ? '#d0a010' : body, -0.2, 1.38, 0);
    box(0.04, 0.5, W-0.3, '#0e1218', 0.92, 1.38, 0, 0); box(0.04, 0.5, W-0.3, '#0e1218', -1.32, 1.38, 0, 0);
    if(kind === 'taxi'){ box(L+0.01, 0.1, 0.02, '#141414', 0, 0.8, W/2, 0); box(L+0.01, 0.1, 0.02, '#141414', 0, 0.8, -W/2, 0); }
    [[-1.3,-0.8],[-1.3,0.8],[1.3,-0.8],[1.3,0.8]].forEach(([x,z])=>wheel(x,z));
  }
  // lights and a plate
  if(kind !== 'okada'){
    for(const sz of [-1,1]){
      const hl = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.14), new THREE.MeshBasicMaterial({color:0xfff2c8})); hl.position.set(L/2+0.01, 0.8, sz*(W/2-0.3)); hl.rotation.y = Math.PI/2; g.add(hl);
      const tl = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.12), new THREE.MeshBasicMaterial({color:0xd01818})); tl.position.set(-L/2-0.01, 0.8, sz*(W/2-0.3)); tl.rotation.y = -Math.PI/2; g.add(tl);
    }
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.16), new THREE.MeshBasicMaterial({map:_plateTex(_plate())})); pl.position.set(-L/2-0.02, 0.55, 0); pl.rotation.y = -Math.PI/2; g.add(pl);
  } else {
    const hl = new THREE.Mesh(new THREE.CircleGeometry(0.1, 10), new THREE.MeshBasicMaterial({color:0xfff2c8})); hl.position.set(0.9, 0.95, 0); hl.rotation.y = Math.PI/2; g.add(hl);
  }
  const cone = new THREE.Mesh(new THREE.ConeGeometry(kind === 'okada' ? 0.9 : 1.6, 7, 12, 1, true), new THREE.MeshBasicMaterial({color:0xfff0c8, transparent:true, opacity:0.07, depthWrite:false, side:THREE.DoubleSide, blending:THREE.AdditiveBlending}));
  cone.rotation.z = Math.PI/2; cone.position.set(L/2 + 3.5, 0.75, 0); g.add(cone);
  g.userData.len = L; g.userData.kind = kind;
  return g;
}

function startTraffic(scene, cfg){
  stopTraffic();
  TRAFFIC.scene = scene; TRAFFIC.cfg = Object.assign({ xMin:-45, xMax:45, density:0.6 }, cfg);
  for(const lane of TRAFFIC.cfg.lanes){
    const n = Math.max(1, Math.round((TRAFFIC.cfg.xMax - TRAFFIC.cfg.xMin) / 22 * TRAFFIC.cfg.density));
    for(let i=0;i<n;i++) _spawnCar(lane, TRAFFIC.cfg.xMin + (i+Math.random()*0.6)*(TRAFFIC.cfg.xMax-TRAFFIC.cfg.xMin)/n);
  }
}
function _spawnCar(lane, x){
  const r = Math.random();
  const kind = lane.kinds ? lane.kinds[Math.floor(Math.random()*lane.kinds.length)] : (r < 0.3 ? 'danfo' : r < 0.55 ? 'okada' : r < 0.75 ? 'taxi' : 'saloon');
  const v = makeVehicle(kind);
  v.position.set(x, 0, lane.z + (Math.random()-0.5)*0.4); v.rotation.y = lane.dir > 0 ? 0 : Math.PI;
  TRAFFIC.scene.add(v);
  TRAFFIC.cars.push({ v, lane, speed: lane.speed * (kind === 'okada' ? 1.25 : 1) * (0.85 + Math.random()*0.3), cur:0, horn:0 });
}
function stopTraffic(){ if(TRAFFIC.scene) TRAFFIC.cars.forEach(c=>TRAFFIC.scene.remove(c.v)); TRAFFIC.cars = []; TRAFFIC.scene = null; }
function hornSound(){
  if(typeof AUDIO === 'undefined' || !AUDIO.ctx) return;
  const ctx = AUDIO.ctx, t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'square'; o.frequency.value = 370 + Math.random()*60; g.gain.value = 0;
  o.connect(g); g.connect(AUDIO.sfxGain || ctx.destination); o.start(t);
  g.gain.linearRampToValueAtTime(0.05, t+0.03); g.gain.linearRampToValueAtTime(0, t+0.45); o.stop(t+0.5);
}
function updateTraffic(dt){
  if(!TRAFFIC.scene || !TRAFFIC.cars.length) return;
  const P = ENGINE.player && ENGINE.player.position;
  const { xMin, xMax } = TRAFFIC.cfg;
  TRAFFIC.honkCool -= dt;
  for(const c of TRAFFIC.cars){
    const v = c.v, dir = c.lane.dir, half = v.userData.len/2;
    // brake for the player, or for the car ahead
    let want = c.speed;
    if(P && Math.abs(P.z - c.lane.z) < 1.5){
      const ahead = (P.x - v.position.x) * dir;
      if(ahead > half - 0.4 && ahead < half + 7){
        want = ahead < half + 2.2 ? 0 : c.speed * 0.25;
        if(c.horn <= 0 && TRAFFIC.honkCool <= 0){ hornSound(); c.horn = 2.5; TRAFFIC.honkCool = 0.8; if(typeof onTrafficHonk==='function') onTrafficHonk(c); }
        if(ahead < half + 0.2){ P.z += (P.z > c.lane.z ? 1 : -1) * dt * 3; }      // nudged back to the kerb
      }
    }
    for(const o of TRAFFIC.cars){ if(o === c || o.lane !== c.lane) continue; const gap = (o.v.position.x - v.position.x) * dir; if(gap > 0 && gap < half + o.v.userData.len/2 + 2.5) want = Math.min(want, o.cur * 0.9); }
    c.cur += (want - c.cur) * Math.min(1, dt * (want < c.cur ? 5 : 1.4));
    c.horn -= dt;
    v.position.x += c.cur * dir * dt;
    if(v.userData.kind !== 'okada') v.children.forEach(ch=>{ if(ch.geometry && ch.geometry.type === 'CylinderGeometry') ch.rotation.y += c.cur*dt*2.8*dir; });
    if(dir > 0 && v.position.x > xMax + 6) v.position.x = xMin - 6 - Math.random()*8;
    if(dir < 0 && v.position.x < xMin - 6) v.position.x = xMax + 6 + Math.random()*8;
  }
}


/* =========================================================================
   NACECA · systems/live_adapt_v10.js — glue for the merged features
   (cold open, traffic, ambient behaviours) on the v10 art: traffic and
   parked street vehicles come from the shared vehicle library, okada
   riders sit on the skinned bodies, and the townspeople's behaviours map
   onto the skinned animation set.
   ========================================================================= */
const _VEH_KIND = { danfo:'danfo', taxi:'taxi', saloon:'sedan', sedan:'sedan', okada:'okada', keke:'keke', suv:'suv', van:'vanP', truck:'truck', pickup:'pickupP' };
const makeVehicleLegacy = makeVehicle;
makeVehicle = function(kind){
  const T = _VEH_KIND[kind];
  if(typeof VEH === 'undefined' || !VEH.ready || !T || !VEH.types[T]) return makeVehicleLegacy(kind);
  const scene = ENGINE.scene;
  // scenes without a baked environment still get reflections that suit the night street
  if(!VEH.env && VEH._envScene !== scene){ VEH._envScene = scene; try{ VEH.makeEnv({ lights:{ sky:'#2a3a5a', ground:'#17181c', key:['#5a6a90', 0.3, [-4, 10, 6]], points:[{ pos:[0, 4.3, 0], c:'#ffb050' }] }, fog:['#0b1220'] }); }catch(e){} }
  const night = !!(scene && scene.background && scene.background.isColor && scene.background.getHSL({}).l < 0.12);
  const color = kind === 'saloon' ? ['#8a1a1a','#d8d8d0','#2a3a5a','#4a4a4a','#1a4a2a'][Math.floor(Math.random()*5)]
              : kind === 'okada' ? ['#a3141a','#1d3f8a','#1a1a1c','#6a1a1a'][Math.floor(Math.random()*4)] : undefined;
  const v = VEH.spawn(T, { color, lights: night ? 'on' : 'off', glow: night });
  const g = new THREE.Group(); v.rotation.y = -Math.PI/2; g.add(v);     // the street code drives along +x
  v.traverse(m=>{ if(m.isMesh && !m.material.isMeshBasicMaterial) m.castShadow = true; });
  const sp = (VEH.spec.types && VEH.spec.types[T]) || {};
  g.userData.len = sp.L || 4.2; g.userData.kind = kind; g.userData.veh = v;
  if(kind === 'okada'){
    const rider = buildNPCMesh('#5a3826', ['#2a5aa8','#c8342c','#e0b020','#1e1e1e'][Math.floor(Math.random()*4)], '#2a2a2a', '#0a0a0a', { hair: Math.random() < 0.5 ? 'cap' : 'crop', capColor:'#141414' });
    if(rider.userData && rider.userData._proxy){
      rider.position.set(-0.30, 0.355, 0); rider.rotation.y = Math.PI/2;      // on the CG-style seat (top 0.86)
      rider.userData._idle = (typeof PEOPLE !== 'undefined' && PEOPLE.clips && PEOPLE.clips.sit) ? 'sit' : 'idle';
    } else {
      rider.position.set(-0.15, 0.05, 0); rider.rotation.y = Math.PI/2; rider.userData._pose = { armL:[-1.1,0,0.1], armR:[-1.1,0,-0.1], elbowL:-0.3, elbowR:-0.3 };
      rider.userData.legL.rotation.x = -1.2; rider.userData.legR.rotation.x = -1.2; if(typeof applyPoseNow === 'function') applyPoseNow(rider);
    }
    g.add(rider); g.userData.rider = rider;
  }
  return g;
};
/* ambient behaviours on skinned townspeople: the pose tricks become clips */
const addBehaviourLegacy = addBehaviour;
addBehaviour = function(g, kind, opts){
  const b = addBehaviourLegacy(g, kind, opts);
  const u = g && g.userData;
  if(u && u._proxy){
    if(kind === 'sit'){ g.position.y = 0; u.legL.rotation.x = 0; u.legR.rotation.x = 0; u._idle = (PEOPLE.clips && PEOPLE.clips.sit) ? 'sit' : 'idle'; }
    else if(kind === 'argue' || kind === 'gesture' || kind === 'sell') u._idle = 'talk';
    else if(kind !== 'phone') u._idle = 'idle';
  }
  return b;
};
