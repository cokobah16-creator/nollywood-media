/* =========================================================================
   NACECA · v12 Phase 2 — Case 07½ · The Engineer's Car
   Uche drives. Kelechi rides in the passenger seat and calls the tail, from
   the filling station before Ugbowo junction to the mouth of Akintola Close
   in Ekosodin: how close to sit, which lane, what to do about a danfo, a
   red light, a police checkpoint and the moment he parks. Clean, made or
   lost — the result rides into Case 08.
   ========================================================================= */
(function(){
'use strict';
const V12 = window.V12;
const MID = 't7';
const clamp = (v, a, b)=>Math.max(a, Math.min(b, v));
const lerp = (a, b, t)=>a + (b - a)*t;
const smooth = t => { t = clamp(t, 0, 1); return t*t*(3 - 2*t); };
const rnd = (a, b)=>a + Math.random()*(b - a);
const pick = a => a[Math.floor(Math.random()*a.length)];

/* ---------------- the case on the board ---------------- */
if(!MISSIONS.some(m => m.id === MID)){
  const i = MISSIONS.findIndex(m => m.id === 'm7');
  MISSIONS.splice(i + 1, 0, { id:MID, num:'07½', name:"The Engineer's Car", region:'EDO · UGBOWO → EKOSODIN, 20:40',
    summary:'Uche drives, you make the calls. Follow the black jeep from the filling station to Ekosodin, and don\'t let him see you.', playable:true, interlude:true });
}
if(typeof SAFETY_TIPS !== 'undefined') SAFETY_TIPS[MID] = "If you think a car is following you, don't drive home. Drive somewhere busy and well lit, or to a police station, and call someone you trust on the way.";

/* =====================================================================
   THE ROAD
   One centre line for our side of the road, sampled every metre.
   A  Ugbowo–Lagos Road: dual carriageway, streetlights on the median
   J  Ugbowo junction: traffic lights, he turns left
   B  along the university fence: four lanes, the checkpoint
   C  Ekosodin: one laterite lane each way, almost no light
   ===================================================================== */
const CP = [[0, 30], [0, 0], [1, -120], [8, -240], [10, -360], [4, -470], [0, -520], [-1.5, -544], [-11, -558], [-30, -566],
            [-150, -570], [-300, -568], [-420, -566], [-444, -570], [-456, -584], [-460, -608], [-464, -700], [-452, -780], [-455, -846], [-452, -900]];
const R = { px:null, pz:null, tx:null, tz:null, n:0, len:0, K:{} };
function buildRoute(){
  const curve = new THREE.CatmullRomCurve3(CP.map(([x, z])=>new THREE.Vector3(x, 0, z)), false, 'centripetal');
  curve.arcLengthDivisions = 3000;
  const L = curve.getLength(), n = Math.ceil(L);
  const pts = curve.getSpacedPoints(n);
  R.n = pts.length; R.len = L; R.step = L/(pts.length - 1);
  R.px = new Float32Array(R.n); R.pz = new Float32Array(R.n); R.tx = new Float32Array(R.n); R.tz = new Float32Array(R.n);
  for(let i=0;i<R.n;i++){ R.px[i] = pts[i].x; R.pz[i] = pts[i].z; }
  for(let i=0;i<R.n;i++){
    const a = Math.max(0, i - 2), b = Math.min(R.n - 1, i + 2);
    let dx = R.px[b] - R.px[a], dz = R.pz[b] - R.pz[a]; const l = Math.hypot(dx, dz) || 1; R.tx[i] = dx/l; R.tz[i] = dz/l;
  }
  const near = (x, z)=>{ let best = 0, bd = 1e9; for(let i=0;i<R.n;i++){ const d = (R.px[i]-x)**2 + (R.pz[i]-z)**2; if(d < bd){ bd = d; best = i; } } return best*R.step; };
  R.K = {
    station: near(0, 0), stop: near(0.3, -535), turnL: near(-11, -558), bStart: near(-40, -567), cp: near(-300, -568),
    turnR: near(-456, -584), cStart: near(-461, -612), parlour: near(-463, -690), park: near(-454, -806), end: R.len - 2,
  };
}
/* position + frame at distance s, offset sideways by `off` (right is +) */
const _f = { x:0, z:0, tx:0, tz:-1, rx:1, rz:0, yaw:0 };
function frame(s, off){
  s = clamp(s, 0, R.len); const f = s/R.step, i = Math.min(R.n - 2, Math.floor(f)), t = f - i;
  const tx = lerp(R.tx[i], R.tx[i+1], t), tz = lerp(R.tz[i], R.tz[i+1], t), l = Math.hypot(tx, tz) || 1;
  _f.tx = tx/l; _f.tz = tz/l; _f.rx = -_f.tz; _f.rz = _f.tx;
  _f.x = lerp(R.px[i], R.px[i+1], t) + _f.rx*(off || 0); _f.z = lerp(R.pz[i], R.pz[i+1], t) + _f.rz*(off || 0);
  _f.yaw = Math.atan2(-_f.tx, -_f.tz);
  return _f;
}
const seg = s => s < R.K.stop + 14 ? 'A' : s < R.K.bStart ? 'J' : s < R.K.turnR - 6 ? 'B' : 'C';
/* lane centres for our direction of travel */
function laneOff(s, lane){
  const two = lane ? 1.75 : -1.75, one = 1.4;
  const k = smooth((s - (R.K.turnR - 16))/26);
  return lerp(two, one, k);
}
const PROF = {
  A:{ vJ:12.5, close:20, good:55, lost:150, vMax:17.5 },
  J:{ vJ:8,    close:16, good:55, lost:170, vMax:15 },
  B:{ vJ:11.5, close:20, good:55, lost:150, vMax:17 },
  C:{ vJ:7,    close:15, good:42, lost:95,  vMax:10.5 },
};

/* ---------------- painted textures ---------------- */
function cv(w, h){ const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function tex(c, rep){ const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; if(rep){ t.wrapS = t.wrapT = THREE.RepeatWrapping; } t.anisotropy = 4; return t; }
function speckle(x, w, h, n, a){ for(let i=0;i<n;i++){ const v = Math.random() < 0.5 ? 0 : 255; x.fillStyle = `rgba(${v},${v},${v},${a*Math.random()})`; x.fillRect(Math.random()*w, Math.random()*h, 1 + Math.random()*2, 1 + Math.random()*2); } }
const FONT = (px, w)=>`${w || 700} ${px}px Oswald, Impact, "Arial Narrow", sans-serif`;
/* two lanes, 7 m across, 16 m along: dashed divider, solid edges */
function asphaltLanes(edgeL, edgeR){
  const [c, x] = cv(256, 512);
  x.fillStyle = '#25272b'; x.fillRect(0, 0, 256, 512); speckle(x, 256, 512, 5000, 0.10);
  for(let i=0;i<14;i++){ x.fillStyle = `rgba(10,10,12,${0.12 + Math.random()*0.18})`; x.beginPath(); x.ellipse(Math.random()*256, Math.random()*512, 8 + Math.random()*26, 4 + Math.random()*14, Math.random()*3, 0, 7); x.fill(); }
  x.fillStyle = 'rgba(30,30,32,0.5)'; x.fillRect(60, 0, 18, 512); x.fillRect(178, 0, 18, 512);      // tyre polish
  x.fillStyle = 'rgba(232,232,220,0.78)'; for(let y=0;y<512;y+=160) x.fillRect(125, y, 6, 64);
  if(edgeL){ x.fillStyle = edgeL; x.fillRect(4, 0, 5, 512); }
  if(edgeR){ x.fillStyle = edgeR; x.fillRect(247, 0, 5, 512); }
  return tex(c, true);
}
function dirtTex(base, ruts){
  const [c, x] = cv(256, 256);
  x.fillStyle = base; x.fillRect(0, 0, 256, 256); speckle(x, 256, 256, 6000, 0.16);
  for(let i=0;i<30;i++){ x.fillStyle = `rgba(20,10,6,${0.1 + Math.random()*0.2})`; x.beginPath(); x.ellipse(Math.random()*256, Math.random()*256, 6 + Math.random()*20, 3 + Math.random()*10, Math.random()*3, 0, 7); x.fill(); }
  if(ruts){ x.fillStyle = 'rgba(25,12,8,0.35)'; x.fillRect(52, 0, 26, 256); x.fillRect(178, 0, 26, 256);
    for(let i=0;i<4;i++){ x.fillStyle = 'rgba(70,90,110,0.35)'; x.beginPath(); x.ellipse(40 + Math.random()*170, Math.random()*256, 14 + Math.random()*16, 8 + Math.random()*10, 0, 0, 7); x.fill(); } }
  return tex(c, true);
}
function glowTex(){
  const [c, x] = cv(128, 128), g = x.createRadialGradient(64, 64, 1, 64, 64, 63);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
}
/* shop fronts at night: 2 x 5 cells, 512 x 192 each */
const FAC = { cols:2, rows:5 };
function facadeAtlas(){
  const W = 512, H = 192, [c, x] = cv(W*FAC.cols, H*FAC.rows);
  const cell = (i, fn)=>{ const cx = (i % FAC.cols)*W, cy = Math.floor(i / FAC.cols)*H; x.save(); x.translate(cx, cy); x.beginPath(); x.rect(0, 0, W, H); x.clip(); fn(); x.restore(); };
  const wall = col =>{ x.fillStyle = col; x.fillRect(0, 0, W, H); speckle(x, W, H, 2500, 0.08); const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(0,0,0,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0.05)'); x.fillStyle = g; x.fillRect(0, 0, W, H); };
  const sign = (txt, bg, fg, y, h, px)=>{ x.fillStyle = bg; x.fillRect(16, y, W - 32, h); x.fillStyle = fg; x.font = FONT(px || 30); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, W/2, y + h/2 + 1, W - 50); };
  const lit = (x0, y0, w, h, col)=>{ const g = x.createLinearGradient(0, y0, 0, y0 + h); g.addColorStop(0, col); g.addColorStop(1, 'rgba(60,40,20,0.9)'); x.fillStyle = g; x.fillRect(x0, y0, w, h); };
  const shutter = (x0, y0, w, h)=>{ x.fillStyle = '#4a4e54'; x.fillRect(x0, y0, w, h); x.fillStyle = 'rgba(20,20,24,0.6)'; for(let y=y0;y<y0+h;y+=7) x.fillRect(x0, y, w, 2); };
  const shelves = (x0, y0, w, h)=>{ for(let k=0;k<4;k++){ x.fillStyle = 'rgba(40,24,10,0.5)'; x.fillRect(x0 + 6, y0 + 14 + k*(h/4.4), w - 12, 4);
      for(let j=0;j<10;j++){ x.fillStyle = ['#c84a3a','#e8c547','#4a8ad8','#5db86a','#f0f0e8'][(j + k) % 5]; x.fillRect(x0 + 10 + j*((w - 20)/10), y0 + 4 + k*(h/4.4), (w - 20)/10 - 3, 10); } } };
  // 0 pharmacy, lit
  cell(0, ()=>{ wall('#6a7a6a'); sign('UGBOWO CARE PHARMACY', '#1f6b3a', '#f2f2e6', 14, 46, 30); x.fillStyle = '#5ee08a'; x.fillRect(W - 64, 22, 30, 8); x.fillRect(W - 53, 11, 8, 30);
    lit(30, 76, W - 60, 106, '#fff1c8'); shelves(30, 76, W - 60, 106); x.fillStyle = 'rgba(30,30,30,0.7)'; x.fillRect(W/2 - 4, 76, 8, 106); });
  // 1 phone shop, shuttered
  cell(1, ()=>{ wall('#7a6a58'); sign('BEST LINE PHONES & ACCESSORIES', '#1d2b6c', '#ffd76a', 14, 46, 26); shutter(26, 72, W - 52, 112); x.fillStyle = 'rgba(255,255,255,0.15)'; x.font = FONT(18, 600); x.fillText('POS · TRANSFER · AIRTIME', W/2, 128); });
  // 2 barber, lit sign
  cell(2, ()=>{ wall('#5a4a6a'); sign('KINGS CUT BARBING SALON', '#141418', '#ff5aa8', 14, 46, 30); lit(40, 76, 200, 106, '#d8f0ff'); lit(272, 76, 200, 106, '#d8f0ff');
    x.fillStyle = 'rgba(20,20,26,0.75)'; x.beginPath(); x.ellipse(140, 132, 22, 28, 0, 0, 7); x.fill(); x.fillRect(118, 150, 44, 32); });
  // 3 bukka with plastic chairs
  cell(3, ()=>{ wall('#8a5a3a'); sign('MAMA EKI KITCHEN', '#b8321c', '#ffe9b8', 14, 46, 32); lit(24, 72, W - 48, 112, '#ffd090');
    for(let k=0;k<4;k++){ x.fillStyle = ['#d23a2a','#2a6ad2','#e8c547','#2ab060'][k]; x.fillRect(60 + k*110, 140, 36, 30); x.fillRect(64 + k*110, 116, 6, 26); } });
  // 4 closed warehouse door, one bulb
  cell(4, ()=>{ wall('#3a3e44'); shutter(110, 40, 292, 144); x.fillStyle = 'rgba(255,214,140,0.9)'; x.beginPath(); x.arc(256, 24, 7, 0, 7); x.fill(); x.fillStyle = 'rgba(255,255,255,0.18)'; x.font = FONT(20, 600); x.fillText('NO PARKING', W/2, 110); });
  // 5 supermarket, lit
  cell(5, ()=>{ wall('#6a6a7a'); sign('VICTORY SUPERSTORE', '#d8a64a', '#141418', 14, 46, 32); lit(24, 72, W - 48, 112, '#f0f6ff'); shelves(24, 72, W - 48, 112); });
  // 6 photocopy, half lit
  cell(6, ()=>{ wall('#7a7058'); sign('ACE PHOTOCOPY · BINDING · TYPING', '#2a2a30', '#f0e6cc', 14, 46, 24); lit(30, 76, 220, 106, '#fff8e0'); shutter(262, 76, 220, 106); });
  // 7 POS kiosk front
  cell(7, ()=>{ wall('#4a6a7a'); sign('SWIFT POS · WITHDRAW & TRANSFER', '#0e5a8a', '#ffffff', 14, 46, 24); lit(150, 80, 212, 100, '#fff0c0'); x.fillStyle = '#d8a64a'; x.fillRect(150, 150, 212, 30); });
  // 8 upper floor: lit windows
  cell(8, ()=>{ wall('#6a6258'); for(let k=0;k<4;k++){ const on = k !== 2; x.fillStyle = on ? (k % 2 ? '#ffd9a0' : '#c8dcff') : '#1a1c22'; x.fillRect(36 + k*120, 46, 74, 86); x.fillStyle = 'rgba(30,26,22,0.8)'; x.fillRect(36 + k*120 + 35, 46, 4, 86); x.fillRect(36 + k*120, 86, 74, 4); } });
  // 9 upper floor: dark, one window
  cell(9, ()=>{ wall('#55504a'); for(let k=0;k<4;k++){ x.fillStyle = k === 1 ? '#ffcf8a' : '#16181c'; x.fillRect(36 + k*120, 46, 74, 86); } x.fillStyle = 'rgba(200,200,200,0.12)'; x.fillRect(0, 150, W, 6); });
  const t = tex(c, false); t.minFilter = THREE.LinearMipmapLinearFilter; return t;
}

/* ---------------- geometry helpers ---------------- */
function geo(pos, uv, idx, col){
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  if(uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  if(col) g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals(); return g;
}
/* a strip of road from s0 to s1 between side offsets a and b */
function ribbon(s0, s1, a, b, y, vLen, step){
  step = step || 2; const pos = [], uv = [], idx = [];
  let k = 0;
  for(let s=s0; ; s += step){
    const ss = Math.min(s, s1);
    let f = frame(ss, a); pos.push(f.x, y, f.z); uv.push(0, ss/vLen);
    f = frame(ss, b); pos.push(f.x, y, f.z); uv.push(1, ss/vLen);
    if(k){ const o = (k - 1)*2; idx.push(o, o + 2, o + 1, o + 1, o + 2, o + 3); }
    k++; if(ss >= s1) break;
  }
  return geo(pos, uv, idx);
}
/* a straight strip from point p in direction (dx,dz), length L, width W */
function strip(px, pz, dx, dz, L, W, y, vLen){
  const rx = -dz, rz = dx, h = W/2;
  const pos = [px - rx*h, y, pz - rz*h, px + rx*h, y, pz + rz*h, px - rx*h + dx*L, y, pz - rz*h + dz*L, px + rx*h + dx*L, y, pz + rz*h + dz*L];
  return geo(pos, [0, 0, 1, 0, 0, L/vLen, 1, L/vLen], [0, 2, 1, 1, 2, 3]);
}
function mergeGeos(list){
  let nv = 0, ni = 0;
  for(const g of list){ nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
  const P = new Float32Array(nv*3), N = new Float32Array(nv*3), U = new Float32Array(nv*2), C = list.some(g => g.attributes.color) ? new Float32Array(nv*3) : null;
  const I = []; let vo = 0;
  for(const g of list){
    const p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv, c = g.attributes.color;
    P.set(p.array, vo*3); if(n) N.set(n.array, vo*3); if(u) U.set(u.array, vo*2); if(C && c) C.set(c.array, vo*3);
    if(g.index) for(let i=0;i<g.index.count;i++) I.push(g.index.array[i] + vo); else for(let i=0;i<p.count;i++) I.push(i + vo);
    vo += p.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(P, 3)); out.setAttribute('normal', new THREE.BufferAttribute(N, 3)); out.setAttribute('uv', new THREE.BufferAttribute(U, 2));
  if(C) out.setAttribute('color', new THREE.BufferAttribute(C, 3));
  out.setIndex(I); return out;
}
const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V3 = new THREE.Vector3(), SC = new THREE.Vector3(1, 1, 1), EU = new THREE.Euler();
function placed(g, x, y, z, yaw){ const c = g.clone(); EU.set(0, yaw || 0, 0); Q.setFromEuler(EU); M4.compose(V3.set(x, y, z), Q, SC); c.applyMatrix4(M4); return c; }
function colorize(g, hex){ const c = new THREE.Color(hex), n = g.attributes.position.count, a = new Float32Array(n*3); for(let i=0;i<n;i++){ a[i*3] = c.r; a[i*3+1] = c.g; a[i*3+2] = c.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; }

/* ---------------- building the night ---------------- */
const W = { };            // world handles for this run
function buildWorld(){
  const sc = newScene({ bg:'#05070d', fog:'#0a0e18' });
  sc.fog.near = 45; sc.fog.far = 250;
  ENGINE.camera.fov = 62; ENGINE.camera.far = 420; ENGINE.camera.near = 0.08; ENGINE.camera.updateProjectionMatrix();
  sc.add(new THREE.HemisphereLight('#2c3858', '#140f0a', 0.62));
  sc.add(new THREE.AmbientLight('#1c2232', 0.5));
  const moon = new THREE.DirectionalLight('#7f90c0', 0.22); moon.position.set(-40, 80, 30); sc.add(moon);
  buildRoute();
  W.glow = glowTex();
  const K = R.K;
  // the ground under it all
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), new THREE.MeshLambertMaterial({ color:'#0d0b09' }));
  ground.rotation.x = -Math.PI/2; ground.position.set(-230, -0.03, -420); sc.add(ground);
  // ---- road surfaces
  const asA = asphaltLanes('rgba(240,200,60,0.85)', 'rgba(235,235,225,0.8)'), asOpp = asphaltLanes('rgba(240,200,60,0.85)', 'rgba(235,235,225,0.8)');
  const roadMat = new THREE.MeshLambertMaterial({ map:asA }), oppMat = new THREE.MeshLambertMaterial({ map:asOpp });
  const shoulder = new THREE.MeshLambertMaterial({ map:dirtTex('#5a3424', false) }), kerb = new THREE.MeshLambertMaterial({ color:'#6a6a64' });
  const late = new THREE.MeshLambertMaterial({ map:dirtTex('#7a3e24', true) });
  const add = (g, m)=>{ const o = new THREE.Mesh(g, m); o.receiveShadow = false; sc.add(o); return o; };
  const aEnd = K.turnL + 2, bBeg = K.turnL - 2, cBeg = K.turnR - 4;
  // A: our two lanes, a raised median, the oncoming two lanes, shoulders
  add(ribbon(0, aEnd, -3.5, 3.5, 0, 16), roadMat);
  add(ribbon(0, K.stop + 6, -4.5, -3.5, 0.16, 8), kerb);
  add(ribbon(0, K.stop + 6, -11.5, -4.5, 0, 16), oppMat);
  add(ribbon(0, K.stop - 4, 3.5, 9.5, 0.02, 12), shoulder);
  add(ribbon(0, K.stop - 4, -17.5, -11.5, 0.02, 12), shoulder);
  // J: the junction box and the two roads we don't take
  const jx = -4, jz = -556;
  add(strip(jx - 9, jz + 17, 0, -1, 36, 54, 0.02, 16), new THREE.MeshLambertMaterial({ map:dirtTex('#26272a', false) }));
  add(strip(jx + 2, jz - 16, 0, -1, 160, 15, 0.002, 16), oppMat);                  // straight on, north
  add(strip(jx + 16, jz - 4, 1, 0, 170, 15, 0.002, 16), oppMat);                   // right, east
  add(strip(jx + 16, jz - 4 + 9.5, 1, 0, 160, 4, 0.02, 12), shoulder);
  add(strip(jx + 2 + 9.5, jz - 16, 0, -1, 150, 4, 0.02, 12), shoulder);
  // B: four lanes along the fence, a double yellow line between
  add(ribbon(bBeg, cBeg + 6, -3.5, 3.5, 0, 16), roadMat);
  add(ribbon(K.bStart - 4, cBeg - 10, -10.5, -3.5, 0, 16), oppMat);
  add(ribbon(K.bStart - 4, cBeg - 10, -3.62, -3.52, 0.012, 4), new THREE.MeshBasicMaterial({ color:'#c8a032' }));
  add(ribbon(K.bStart - 4, cBeg - 10, -3.48, -3.38, 0.012, 4), new THREE.MeshBasicMaterial({ color:'#c8a032' }));
  add(ribbon(K.bStart, cBeg - 6, 3.5, 7.5, 0.02, 12), shoulder);
  add(ribbon(K.bStart, cBeg - 10, -15.5, -10.5, 0.02, 12), shoulder);
  // the main road carries on past the turn into Ekosodin
  { const f = fr(K.turnR - 18, -3.5); add(strip(f.x, f.z, f.tx, f.tz, 150, 14, 0.004, 16), roadMat); const g = fr(K.turnR - 18, -12.5); add(strip(g.x, g.z, g.tx, g.tz, 150, 4, 0.02, 12), shoulder); }
  // C: Ekosodin — red earth
  add(ribbon(cBeg - 6, R.len, -1.6, 4.3, 0.01, 10), late);
  add(ribbon(cBeg, R.len, -4.6, -1.6, 0.012, 10), late);
  add(ribbon(cBeg, R.len, 4.3, 6.2, 0.03, 12), shoulder);
  add(ribbon(cBeg, R.len, -6.4, -4.6, 0.03, 12), shoulder);
  buildLamps(sc); buildCity(sc); buildStation(sc); buildJunction(sc); buildCheckpoint(sc); buildEkosodin(sc); buildSky(sc);
  return sc;
}

/* ---- streetlights: a fifth of them are out, as usual ---- */
function buildLamps(sc){
  const K = R.K, heads = [], pools = [], lit = [];
  const poleG = mergeGeos([ placed(new THREE.CylinderGeometry(0.09, 0.13, 8, 6), 0, 4, 0), placed(new THREE.BoxGeometry(0.12, 0.12, 2.6), 0, 7.9, -1.3), placed(new THREE.BoxGeometry(0.34, 0.14, 0.7), 0, 7.85, -2.6) ]);
  const dblG = mergeGeos([ placed(new THREE.CylinderGeometry(0.09, 0.13, 8, 6), 0, 4, 0), placed(new THREE.BoxGeometry(0.12, 0.12, 5.2), 0, 7.9, 0), placed(new THREE.BoxGeometry(0.34, 0.14, 0.7), 0, 7.85, -2.6), placed(new THREE.BoxGeometry(0.34, 0.14, 0.7), 0, 7.85, 2.6) ]);
  const singles = [], doubles = [];
  const lamp = (s, off, double, facing)=>{
    const f = frame(s, off), on = Math.random() > 0.2;
    // arms reach toward the road (facing = -1: toward the left of travel)
    const yaw = f.yaw + (facing < 0 ? Math.PI/2 : -Math.PI/2);
    (double ? doubles : singles).push([f.x, f.z, yaw]);
    if(!on) return;
    const reach = (sd)=>{ const hx = f.x + f.rx*sd, hz = f.z + f.rz*sd; heads.push(hx, 7.75, hz); pools.push([hx, hz, 13]); lit.push([s, sd + off]); };
    if(double){ reach(2.6); reach(-2.6); } else reach(facing*2.6);
  };
  for(let s=K.station + 14; s < K.stop - 8; s += 34) lamp(s, -4, true, 1);                     // median, both carriageways
  for(let s=K.bStart + 20; s < K.turnR - 20; s += 46) lamp(s, 5.6, false, -1);               // fence side
  for(const [s, off] of [[K.cStart + 40, 5.6], [K.parlour + 30, -5.8], [K.park - 70, 5.6]]) lamp(s, off, false, off > 0 ? -1 : 1);
  const mat = new THREE.MeshLambertMaterial({ color:'#3a3d42' });
  const inst = (G, list)=>{ if(!list.length) return; const im = new THREE.InstancedMesh(G, mat, list.length);
    list.forEach(([x, z, yaw], i)=>{ EU.set(0, yaw, 0); Q.setFromEuler(EU); M4.compose(V3.set(x, 0, z), Q, SC); im.setMatrixAt(i, M4); }); im.instanceMatrix.needsUpdate = true; sc.add(im); };
  inst(poleG, singles); inst(dblG, doubles);
  addGlowPoints(sc, heads, '#ffb45e', 3.2, 0.95);
  addPools(sc, pools, '#ffa648', 0.34);
  W.lit = lit;
}
function addGlowPoints(sc, arr, color, size, op){
  if(!arr.length) return null;
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ map:W.glow, color:new THREE.Color(color), size, sizeAttenuation:true, transparent:true, opacity:op, depthWrite:false, blending:THREE.AdditiveBlending }));
  sc.add(p); return p;
}
function addPools(sc, list, color, op){
  if(!list.length) return null;
  const pos = [], uv = [], idx = [];
  list.forEach(([x, z, r], i)=>{ const o = i*4; pos.push(x - r, 0.04, z - r, x + r, 0.04, z - r, x - r, 0.04, z + r, x + r, 0.04, z + r); uv.push(0, 0, 1, 0, 0, 1, 1, 1); idx.push(o, o + 2, o + 1, o + 1, o + 2, o + 3); });
  const m = new THREE.Mesh(geo(pos, uv, idx), new THREE.MeshBasicMaterial({ map:W.glow, color:new THREE.Color(color), transparent:true, opacity:op, depthWrite:false, blending:THREE.AdditiveBlending }));
  m.renderOrder = 1; sc.add(m); return m;
}

/* ---- shops and houses along the road ---- */
function buildCity(sc){
  const K = R.K, bodies = [], fronts = [];
  const atlas = facadeAtlas(), cw = 1/FAC.cols, ch = 1/FAC.rows;
  const cellUV = i => { const cx = i % FAC.cols, cy = Math.floor(i / FAC.cols); return [cx*cw, 1 - (cy + 1)*ch, (cx + 1)*cw, 1 - cy*ch]; };
  const WALLS = ['#3a3530', '#433d36', '#2f3238', '#4a4038', '#38342e'];
  /* a building whose front sits `off` metres from the centre line, on side +1 (right) or -1 (left) */
  const building = (s, side, off, w, dep, storeys, cellGround, cellUp)=>{
    const f = frame(s, off*side), yaw = f.yaw + (side > 0 ? -Math.PI/2 : Math.PI/2);   // front faces the road
    const h = 3.7*storeys + 0.6;
    const body = colorize(new THREE.BoxGeometry(w, h, dep), pick(WALLS));
    // the box's +z face is its front; push the box back from the front line
    const c = placed(body, 0, 0, 0, 0); c.translate(0, h/2, -dep/2);
    EU.set(0, yaw, 0); Q.setFromEuler(EU); M4.compose(V3.set(f.x, 0, f.z), Q, SC); c.applyMatrix4(M4); bodies.push(c);
    const quad = (cell, y0, y1)=>{
      const [u0, v0, u1, v1] = cellUV(cell), pos = [-w/2, y0, 0.03, w/2, y0, 0.03, -w/2, y1, 0.03, w/2, y1, 0.03];
      const q = geo(pos, [u0, v0, u1, v0, u0, v1, u1, v1], [0, 1, 2, 2, 1, 3]); q.applyMatrix4(M4); fronts.push(q);
    };
    quad(cellGround, 0, 3.7);
    for(let k=1;k<storeys;k++) quad(cellUp != null ? cellUp : (Math.random() < 0.6 ? 8 : 9), 3.7*k, 3.7*(k + 1));
  };
  const row = (s0, s1, side, off, cells)=>{
    let s = s0;
    while(s < s1){
      const w = rnd(8.5, 12.5); if(s + w > s1) break;
      if(Math.random() < 0.14){ s += w*0.8; continue; }                      // an empty plot
      building(s + w/2, side, off, w - rnd(0.2, 1.2), rnd(7, 11), Math.random() < 0.45 ? 2 : 1, pick(cells));
      s += w;
    }
  };
  const SHOPS = [0, 1, 2, 3, 4, 5, 6, 7];
  row(K.station + 66, K.stop - 26, 1, 10.5, SHOPS);
  row(K.station - 10, K.stop - 26, -1, 18.5, SHOPS);
  row(K.bStart + 10, K.turnR - 24, -1, 17, [1, 3, 4, 6, 7, 4]);
  // corner shops at the junction
  building(K.stop - 6, 1, 13, 11, 9, 2, 5, 8); building(K.stop - 18, -1, 19, 10, 9, 1, 7);
  const bm = new THREE.Mesh(mergeGeos(bodies), new THREE.MeshLambertMaterial({ vertexColors:true }));
  const fm = new THREE.Mesh(mergeGeos(fronts), new THREE.MeshBasicMaterial({ map:atlas }));
  sc.add(bm); sc.add(fm);
  // the university fence on the right of B, trees behind it
  const fence = [], wire = [], trees = [];
  for(let s=K.bStart + 4; s < K.turnR - 18; s += 4){
    const f = frame(s + 2, 7.4), yaw = f.yaw + Math.PI/2;
    fence.push(placed(new THREE.BoxGeometry(4.02, 2.5, 0.25), f.x, 1.25, f.z, yaw));
    if(Math.round(s) % 8 < 4) fence.push(placed(new THREE.BoxGeometry(0.35, 2.7, 0.35), f.x, 1.35, f.z, yaw));
    wire.push(placed(new THREE.BoxGeometry(4.0, 0.06, 0.06), f.x, 2.75, f.z, yaw));
    if(Math.random() < 0.5){ const t = frame(s, rnd(12, 26)); trees.push([t.x, t.z, rnd(5, 9)]); }
  }
  sc.add(new THREE.Mesh(mergeGeos(fence), new THREE.MeshLambertMaterial({ color:'#6e6656' })));
  sc.add(new THREE.Mesh(mergeGeos(wire), new THREE.MeshBasicMaterial({ color:'#121212' })));
  const crowns = trees.map(([x, z, h])=>placed(new THREE.SphereGeometry(h*0.42, 7, 5), x, h*0.78, z));
  const trunks = trees.map(([x, z, h])=>placed(new THREE.CylinderGeometry(0.16, 0.24, h*0.6, 5), x, h*0.3, z));
  if(crowns.length){ sc.add(new THREE.Mesh(mergeGeos(crowns), new THREE.MeshLambertMaterial({ color:'#0f1a12' }))); sc.add(new THREE.Mesh(mergeGeos(trunks), new THREE.MeshLambertMaterial({ color:'#1a1410' }))); }
}

/* ---- the filling station we start beside ---- */
const fr = (s, off)=>Object.assign({}, frame(s, off));
function buildStation(sc){
  const K = R.K, f = fr(K.station + 30, 17), yaw = f.yaw;
  const g = new THREE.Group(); g.position.set(f.x, 0, f.z); g.rotation.y = yaw; sc.add(g);
  const dark = new THREE.MeshLambertMaterial({ color:'#2a2e36' });
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(12, 0.7, 20), new THREE.MeshLambertMaterial({ color:'#d8dde4' })); canopy.position.set(0, 5.4, 0); g.add(canopy);
  const band = new THREE.Mesh(new THREE.BoxGeometry(12.1, 0.36, 20.1), new THREE.MeshBasicMaterial({ color:'#e0702a' })); band.position.set(0, 5.4, 0); g.add(band);
  const under = new THREE.Mesh(new THREE.PlaneGeometry(11.6, 19.6), new THREE.MeshBasicMaterial({ color:'#fff8ec' })); under.rotation.x = Math.PI/2; under.position.set(0, 5.04, 0); g.add(under);
  for(const [x, z] of [[-4, -7], [4, -7], [-4, 7], [4, 7]]){ const p = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5.1, 0.4), dark); p.position.set(x, 2.55, z); g.add(p); }
  for(const z of [-4, 4]){ const pump = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.7, 1.4), new THREE.MeshLambertMaterial({ color:'#c8cdd4' })); pump.position.set(0, 0.85, z); g.add(pump);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.3), new THREE.MeshBasicMaterial({ color:'#5ae08a' })); scr.position.set(0.41, 1.3, z); scr.rotation.y = Math.PI/2; g.add(scr); }
  // the brand pole: a fictional company
  const [c, x] = cv(256, 384);
  x.fillStyle = '#141820'; x.fillRect(0, 0, 256, 384); x.fillStyle = '#e0702a'; x.fillRect(10, 10, 236, 120);
  x.fillStyle = '#fff'; x.font = FONT(64); x.textAlign = 'center'; x.fillText('SUNLINK', 128, 92);
  x.font = FONT(40, 600); x.fillStyle = '#ffd76a'; ['PMS', 'AGO', 'DPK'].forEach((t, i)=>{ x.fillText(t, 70, 190 + i*64); x.fillStyle = '#5ae08a'; x.fillText('— —', 180, 190 + i*64); x.fillStyle = '#ffd76a'; });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 3.3), new THREE.MeshBasicMaterial({ map:tex(c) }));
  const sf = frame(K.station + 52, 8.6); sign.position.set(sf.x, 5.2, sf.z); sign.rotation.y = sf.yaw + Math.PI; sc.add(sign);
  const pole = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.6, 0.3), dark); pole.position.set(sf.x, 1.8, sf.z); sc.add(pole);
  addPools(sc, [[f.x, f.z, 16]], '#fff2dc', 0.45);
  W.stationLit = [K.station + 12, K.station + 62];
}

/* ---- Ugbowo junction: the lights that decide it ---- */
function buildJunction(sc){
  const K = R.K, heads = [];
  const mk = (s, off, yawAdd)=>{
    const f = frame(s, off), g = new THREE.Group(); g.position.set(f.x, 0, f.z); g.rotation.y = f.yaw + (yawAdd || 0); sc.add(g);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 5.2, 6), new THREE.MeshLambertMaterial({ color:'#2a2c30' })); pole.position.y = 2.6; g.add(pole);
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.2, 0.36), new THREE.MeshLambertMaterial({ color:'#111214' })); box.position.set(0, 4.6, 0); g.add(box);
    const lens = ['#ff2a1a', '#ffb21a', '#2aff6a'].map((c, i)=>{ const m = new THREE.Mesh(new THREE.CircleGeometry(0.13, 14), new THREE.MeshBasicMaterial({ color:'#1a1a1a' }));
      m.position.set(0, 4.98 - i*0.38, 0.19); g.add(m); m.userData.on = new THREE.Color(c); return m; });
    heads.push(lens); return g;
  };
  mk(K.stop - 2, 4.6, 0); mk(K.stop - 2, -4.2, 0);
  W.lights = heads; W.lightState = 'green';
  // a glow that sells the colour at a distance
  W.lightGlow = addGlowPoints(sc, [frame(K.stop - 2, 4.6).x, 4.2, frame(K.stop - 2, 4.6).z, frame(K.stop - 2, -4.2).x, 4.2, frame(K.stop - 2, -4.2).z], '#2aff6a', 1.6, 0.9);
  // stop line
  const f = frame(K.stop, 0);
  const line = new THREE.Mesh(strip(f.x - f.tx*0.2, f.z - f.tz*0.2, f.tx, f.tz, 0.45, 7, 0.015, 1), new THREE.MeshBasicMaterial({ color:'#d8d8cc' }));
  line.position.x += 0; sc.add(line);
  addPools(sc, [[f.x - 5, f.z - 30, 16], [f.x + 8, f.z - 40, 10]], '#ffd8a0', 0.22);
  W.junctionLit = [K.stop - 20, K.stop + 30];
}
function setLight(state){
  if(!W.lights || W.lightState === state) return; W.lightState = state;
  const idx = { red:0, amber:1, green:2 }[state];
  W.lights.forEach(lens => lens.forEach((m, i)=>{ m.material.color.copy(i === idx ? m.userData.on : new THREE.Color('#1a1a1a')); }));
  if(W.lightGlow) W.lightGlow.material.color.copy(W.lights[0][idx].userData.on);
}

/* ---- the checkpoint on the fence road ---- */
function buildCheckpoint(sc){
  const K = R.K, s = K.cp;
  const [c, x] = cv(64, 64); for(let i=0;i<4;i++){ x.fillStyle = i % 2 ? '#f2f2ea' : '#e0601a'; x.fillRect(0, i*16, 64, 16); }
  const drumM = new THREE.MeshLambertMaterial({ map:tex(c) }), drums = [];
  for(const [ds, off] of [[0, -3.2], [0.9, -2.0], [-0.2, -0.8], [1.4, 0.2], [6, -2.6], [6.6, -1.2]]){ const f = frame(s + ds, off); drums.push(placed(new THREE.CylinderGeometry(0.3, 0.3, 0.9, 10), f.x, 0.45, f.z)); }
  sc.add(new THREE.Mesh(mergeGeos(drums), drumM));
  const plank = frame(s - 1.2, 4.6); const pl = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.08, 0.3), new THREE.MeshLambertMaterial({ color:'#5a4026' })); pl.position.set(plank.x, 0.05, plank.z); pl.rotation.y = plank.yaw + Math.PI/2; sc.add(pl);
  // the police pickup on the fence shoulder, beacons going
  if(VEH.ready){ const f = frame(s + 9, 5.4); const v = VEH.spawn('pickupP', { lights:'tail', beacons:true }); if(v){ v.position.set(f.x, 0, f.z); v.rotation.y = f.yaw + 0.12; sc.add(v); } }
  // a hand-painted board
  const [c2, x2] = cv(256, 128); x2.fillStyle = '#e8e2cc'; x2.fillRect(0, 0, 256, 128); x2.fillStyle = '#b3161b'; x2.font = FONT(44); x2.textAlign = 'center'; x2.fillText('STOP', 128, 52); x2.fillStyle = '#141414'; x2.font = FONT(26, 600); x2.fillText('POLICE CHECKPOINT', 128, 100);
  const bf = frame(s - 6, 5.0); const board = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.7), new THREE.MeshBasicMaterial({ map:tex(c2) })); board.position.set(bf.x, 1.1, bf.z); board.rotation.y = bf.yaw; sc.add(board);
  const lan = frame(s + 1.4, 0.2); addGlowPoints(sc, [lan.x, 1.05, lan.z], '#ffbf6a', 1.4, 1);
  addPools(sc, [[lan.x, lan.z, 7]], '#ffbf6a', 0.3);
  W.cpLit = [s - 14, s + 6];
  // two officers, torches
  W.officers = [];
  if(typeof PEOPLE !== 'undefined' && PEOPLE.make && ART.ready){
    const look = { body:'M', skin:'#3e2618', hair:'#0c0a09', torso:'#15181d', armA:'#15181d', armB:'#15181d', armC:'#15181d', hips:'#15181d', thigh:'#15181d', shin:'#15181d', shoe:'#0a0a0a', gear:['Gear_Beret'], beret:'#101216' };
    [[-0.6, 2.6, 'talk'], [3.4, -1.6, 'idle']].forEach(([ds, off, clip])=>{
      const f = frame(s + ds, off), p = PEOPLE.make('npc', Object.assign({}, look, { skin:pick(['#3e2618', '#4a2b1c', '#5a3826']) }));
      p.position.set(f.x, 0, f.z); p.rotation.y = f.yaw + Math.PI; sc.add(p); p.userData.anim.play(clip, { fade:0 }); ENGINE.extraSkinned.push(p); W.officers.push(p);
    });
    W.torch = addGlowPoints(sc, [0, 0, 0], '#fff6dc', 1.1, 1);
  }
}

/* ---- Ekosodin: compound walls, gates, a beer parlour, the close ---- */
function buildEkosodin(sc){
  const K = R.K, walls = [], gates = [], roofs = [], bulbs = [];
  const WALLC = ['#b8ab8a', '#8aa0a8', '#c49a8a', '#9a9a8e', '#a88a6a', '#7a8a6a'], GATEC = ['#1f4a2a', '#141414', '#2a2a6a', '#5a1a1a', '#2a3a4a'];
  const closeS = K.park + 6;
  const side = (sd)=>{
    let s = K.cStart - 6;
    while(s < R.len - 4){
      const w = rnd(14, 22);
      if(sd > 0 && s < closeS + 7 && s + w > closeS - 7){ s = closeS + 7; continue; }        // the mouth of Akintola Close
      const col = pick(WALLC), mid = s + w/2, f = frame(mid, sd*6.6), yaw = f.yaw + Math.PI/2;
      walls.push(colorize(placed(new THREE.BoxGeometry(w - 0.4, 2.2, 0.3), f.x, 1.1, f.z, yaw), col));
      const gf = frame(mid + rnd(-w/4, w/4), sd*6.45);
      gates.push(colorize(placed(new THREE.BoxGeometry(3.0, 2.3, 0.12), gf.x, 1.15, gf.z, yaw), pick(GATEC)));
      if(Math.random() < 0.55) bulbs.push(gf.x, 2.6, gf.z);
      const rf = frame(mid, sd*13); roofs.push(colorize(placed(new THREE.BoxGeometry(w*0.7, 3.4, 9), rf.x, 1.7, rf.z, yaw), '#2a2622'));
      roofs.push(colorize(placed(new THREE.BoxGeometry(w*0.76, 0.3, 10), rf.x, 3.5, rf.z, yaw), '#3a2a22'));
      s += w;
    }
  };
  side(1); side(-1);
  sc.add(new THREE.Mesh(mergeGeos(walls.concat(gates, roofs)), new THREE.MeshLambertMaterial({ vertexColors:true })));
  // the beer parlour: a string of coloured bulbs, plastic chairs, music
  const pf = fr(K.parlour, -8.5), str = [];
  for(let i=0;i<9;i++){ const q = frame(K.parlour - 8 + i*2, -6.2); str.push(q.x, 2.7 + Math.sin(i*0.9)*0.15, q.z); }
  W.parlour = { x:pf.x, z:pf.z };
  const pts = addGlowPoints(sc, str, '#ff7ad0', 0.9, 1); if(pts){ const cols = []; for(let i=0;i<9;i++){ const c = new THREE.Color(['#ff4a6a', '#4aff8a', '#4a8aff', '#ffd04a'][i % 4]); cols.push(c.r, c.g, c.b); } pts.geometry.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); pts.material.vertexColors = true; pts.material.color.set('#ffffff'); }
  addPools(sc, [[pf.x, pf.z, 9]], '#ff9ad0', 0.18);
  const chairs = []; for(let i=0;i<6;i++){ const q = frame(K.parlour - 6 + i*2.2, -8 - (i % 2)); chairs.push(colorize(placed(new THREE.BoxGeometry(0.5, 0.45, 0.5), q.x, 0.22, q.z), pick(['#d23a2a', '#2a6ad2', '#e8c547']))); }
  sc.add(new THREE.Mesh(mergeGeos(chairs), new THREE.MeshLambertMaterial({ vertexColors:true })));
  addGlowPoints(sc, bulbs, '#ffcf8a', 1.0, 0.9);
  // kiosks with a bulb and somebody minding them
  W.kiosks = [];
  for(const [ds, sd] of [[K.cStart + 22, 1], [K.parlour + 44, 1], [K.park - 40, -1]]){
    const f = frame(ds, sd*5.4), k = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.1, 1.4), new THREE.MeshLambertMaterial({ color:pick(['#1a5aa0', '#c8a020', '#2a8a4a']) }));
    k.position.set(f.x, 1.05, f.z); k.rotation.y = f.yaw; sc.add(k);
    addGlowPoints(sc, [f.x - f.rx*sd*0.9, 2.2, f.z - f.rz*sd*0.9], '#fff0c8', 1.2, 1); addPools(sc, [[f.x - f.rx*sd*1.4, f.z - f.rz*sd*1.4, 4.5]], '#fff0c8', 0.25);
    W.kiosks.push([ds, sd]);
  }
  // Akintola Close: a lane into the dark on the right, a street sign at the corner
  const cm = frame(closeS, 0), dx = cm.rx, dz = cm.rz;
  sc.add(new THREE.Mesh(strip(cm.x + dx*6, cm.z + dz*6, dx, dz, 70, 7, 0.012, 10), new THREE.MeshLambertMaterial({ map:dirtTex('#6a3620', true) })));
  const lw = [];
  for(const sd of [-1, 1]){ for(let k=0;k<4;k++){ const ox = cm.x + dx*(10 + k*16) + (-dz)*sd*4.2*(-1), oz = cm.z + dz*(10 + k*16) + dx*sd*4.2*(-1);
    lw.push(colorize(placed(new THREE.BoxGeometry(15.4, 2.2, 0.3), ox, 1.1, oz, Math.atan2(-dx, -dz) + Math.PI/2), pick(WALLC))); } }
  sc.add(new THREE.Mesh(mergeGeos(lw), new THREE.MeshLambertMaterial({ vertexColors:true })));
  // the blue gate halfway down, a generator shed and a back gate on the corner
  const bg = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.4, 0.14), new THREE.MeshLambertMaterial({ color:'#1d4fb0' }));
  const bgx = cm.x + dx*44 + dz*4.05, bgz = cm.z + dz*44 - dx*4.05; bg.position.set(bgx, 1.2, bgz); bg.rotation.y = Math.atan2(-dx, -dz) + Math.PI/2; sc.add(bg);
  addGlowPoints(sc, [bgx, 2.7, bgz], '#ffd08a', 0.9, 0.8);
  const shed = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.6, 2.0), new THREE.MeshLambertMaterial({ color:'#3a3a3e' }));
  shed.position.set(cm.x + dx*9 - dz*3.0, 1.3, cm.z + dz*9 + dx*3.0); sc.add(shed);
  addGlowPoints(sc, [shed.position.x, 2.9, shed.position.z], '#fff0c8', 0.8, 0.9);
  W.close = { s:closeS, x:cm.x, z:cm.z, dx, dz, tx:cm.tx, tz:cm.tz, gate:[bgx, bgz], shed:[shed.position.x, shed.position.z] };
  // the street sign
  const [c, x] = cv(256, 64); x.fillStyle = '#1a5a2a'; x.fillRect(0, 0, 256, 64); x.strokeStyle = '#f0f0e0'; x.lineWidth = 4; x.strokeRect(4, 4, 248, 56);
  x.fillStyle = '#f0f0e0'; x.font = FONT(34); x.textAlign = 'center'; x.fillText('AKINTOLA CLOSE', 128, 44);
  const sp = frame(closeS - 6, 6.2), sign = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), new THREE.MeshBasicMaterial({ map:tex(c), side:THREE.DoubleSide }));
  sign.position.set(sp.x, 2.5, sp.z); sign.rotation.y = sp.yaw; sc.add(sign);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.6, 5), new THREE.MeshLambertMaterial({ color:'#666' })); pole.position.set(sp.x, 1.3, sp.z); sc.add(pole);
}
function buildSky(sc){
  // a low orange city glow on the horizon and a few stars
  const [c, x] = cv(16, 256), g = x.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#03040a'); g.addColorStop(0.62, '#070a14'); g.addColorStop(0.86, '#1a1410'); g.addColorStop(1, '#2a1a10');
  x.fillStyle = g; x.fillRect(0, 0, 16, 256);
  const t = new THREE.CanvasTexture(c);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(380, 24, 12, 0, Math.PI*2, 0, Math.PI/2), new THREE.MeshBasicMaterial({ map:t, side:THREE.BackSide, fog:false, depthWrite:false }));
  dome.position.set(-230, -20, -420); dome.renderOrder = -1; sc.add(dome); W.dome = dome;
  const st = []; for(let i=0;i<260;i++){ const a = Math.random()*Math.PI*2, e = 0.25 + Math.random()*1.1, r = 360; st.push(-230 + Math.cos(a)*Math.cos(e)*r, -20 + Math.sin(e)*r, -420 + Math.sin(a)*Math.cos(e)*r); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(st, 3));
  const stars = new THREE.Points(sg, new THREE.PointsMaterial({ color:'#c8d4ff', size:1.4, sizeAttenuation:false, fog:false, transparent:true, opacity:0.7 }));
  sc.add(stars); W.stars = stars;
}

/* =====================================================================
   THE CARS
   ===================================================================== */
const snd = (name, ...a)=>{ const S = V12.SND; if(S && typeof S[name] === 'function'){ try{ return S[name](...a); }catch(e){} } };
const TR = [], XT = [];
const CARU = { s:0, lat:0, v:0, len:4.8, me:true }, CARJ = { s:0, lat:0, v:0, len:4.86, jeep:true };
const X = { our:null, jeep:null, spot:null, pool:null, engr:null, boy:null, can:null, brake:[], indL:null, indR:null };
const vehLen = type => (VEH.spec && VEH.spec.types && VEH.spec.types[type] && VEH.spec.types[type].L) || 4.4;
function spawnVeh(type, o){
  try{
    if(type === 'okada'){
      if(typeof makeVehicle !== 'function') return null;
      const g = makeVehicle('okada'); g.rotation.y = Math.PI/2; const w = new THREE.Group(); w.add(g); w.userData.len = 2.0; ENGINE.scene.add(w); return w;
    }
    const v = VEH.spawn(type, o); if(!v) return null; v.userData.len = vehLen(type); ENGINE.scene.add(v); return v;
  }catch(e){ return null; }
}
const SEDAN_COL = ['#8a1a1a', '#d8d8d0', '#2a3a5a', '#4a4a4a', '#1a4a2a', '#6a6a70', '#b8b8b0'];
function oppLat(s, lane){ const sg = seg(s); if(sg === 'C') return -1.5; return sg === 'A' ? (lane ? -9.75 : -6.25) : (lane ? -8.75 : -5.25); }
function latFor(t, s){ return t.dir > 0 ? laneOff(s, t.lane) : oppLat(s, t.lane); }
function addTraffic(kind, s, dir, lane, v, role){
  const color = kind === 'sedan' ? pick(SEDAN_COL) : kind === 'suv' ? pick(['#d8d8d0', '#3a3d42', '#5a1a1a']) : undefined;
  const g = spawnVeh(kind, { color, lights:'on', glow:dir < 0 });
  if(!g) return null;
  const t = { g, kind, s, dir, lane, lat:0, latFrom:null, laneT:1, latAdd:0, v, vC:v, len:g.userData.len || 4.4, role:role || null, st:role ? 'start' : null, horn:rnd(1.5, 5) };
  TR.push(t); placeT(t); return t;
}
function placeT(t){
  const base = latFor(t, t.s);
  t.lat = (t.laneT < 1 && t.latFrom != null ? lerp(t.latFrom, base, smooth(t.laneT)) : base) + t.latAdd;
  const f = frame(t.s, t.lat);
  t.g.position.set(f.x, 0, f.z); t.g.rotation.y = f.yaw + (t.dir < 0 ? Math.PI : 0);
}
function dropT(t){ if(t.g && t.g.parent) t.g.parent.remove(t.g); const st = t.g && t.g.userData && t.g.userData.veh; if(st){ const i = VEH.list.indexOf(st); if(i >= 0) VEH.list.splice(i, 1); } }
function sameDir(){ return TR.filter(t => t.dir > 0 && !t.peel); }
/* the nearest thing ahead of `self` in its lateral band */
function ahead(self){
  let best = null, bs = 1e9;
  const consider = o => { if(o === self) return; const ds = o.s - self.s; if(ds > 0 && ds < bs && Math.abs(o.lat - self.lat) < 1.7){ bs = ds; best = o; } };
  for(const t of TR) if(t.dir > 0 && (!t.peel || t.peel.d < 30)) consider(t);
  consider(CARU); consider(CARJ);
  return best ? { o:best, gap:bs - (best.len/2 + self.len/2) } : null;
}
function laneClear(s, lane, self, span){
  const lat = laneOff(s, lane), sp = span || 9;
  for(const o of [CARU, CARJ].concat(sameDir())){ if(o === self) continue; if(Math.abs(o.lat - lat) < 1.6 && Math.abs(o.s - s) < sp) return false; }
  return true;
}
function startLane(t, lane){ t.latFrom = t.lat - t.latAdd; t.lane = lane; t.laneT = 0; }

/* the Engineer's black jeep, with a plate you can read when it's lit */
function dressJeep(g){
  const zr = vehLen('suv')/2 - 0.02;
  const [c, x] = cv(256, 96);
  x.fillStyle = '#f4f4ee'; x.fillRect(0, 0, 256, 96); x.strokeStyle = 'rgba(40,40,40,0.8)'; x.lineWidth = 3; x.strokeRect(2, 2, 252, 92);
  x.fillStyle = '#1f3f9a'; x.textAlign = 'center'; x.font = FONT(20, 600); x.fillText('EDO STATE', 128, 24);
  x.font = FONT(52); x.fillText('BEN 417 KJ', 128, 80); x.fillStyle = 'rgba(30,110,50,0.75)'; x.fillRect(10, 34, 12, 50);
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.165), new THREE.MeshBasicMaterial({ map:tex(c) }));
  plate.position.set(0, 0.9, zr + 0.02); g.add(plate);
  const glow = (x0, y, col, sz)=>{ const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map:W.glow, color:new THREE.Color(col), blending:THREE.AdditiveBlending, depthWrite:false, transparent:true, opacity:0 }));
    sp.position.set(x0, y, zr + 0.08); sp.scale.setScalar(sz); g.add(sp); return sp; };
  X.brake = [glow(-0.82, 1.08, '#ff2a1a', 0.95), glow(0.82, 1.08, '#ff2a1a', 0.95)];
  X.tail = [glow(-0.82, 1.08, '#ff3a2a', 0.55), glow(0.82, 1.08, '#ff3a2a', 0.55)];
  X.indL = glow(-0.86, 0.84, '#ffa020', 0.75); X.indR = glow(0.86, 0.84, '#ffa020', 0.75);
}
function makePerson(look){
  if(typeof PEOPLE === 'undefined' || !PEOPLE.make || !ART.ready) return null;
  const p = PEOPLE.make('npc', look); p.visible = false; ENGINE.scene.add(p); p.userData.anim.play('idle', { fade:0 }); ENGINE.extraSkinned.push(p); return p;
}
function spawnCars(){
  const sc = ENGINE.scene;
  try{ VEH.makeEnv({ lights:{ sky:'#2a3a5a', ground:'#17181c', key:['#5a6a90', 0.3, [-4, 10, 6]], points:[{ pos:[0, 4.3, 0], c:'#ffb050' }] }, fog:['#0b1220'] }); }catch(e){}
  X.our = spawnVeh('sedan', { color:'#3b4046', lights:'tail' });
  const j = VEH.spawn('suv', { color:'#121416', lights:'on' }); sc.add(j); j.userData.len = vehLen('suv');
  try{ VEH.addGlow(j); }catch(e){}
  dressJeep(j); X.jeep = j;
  // our headlights: the only real light on the road
  const sp = new THREE.SpotLight('#ffe6c4', 1.7, 72, 0.46, 0.55, 1.3); sc.add(sp); sc.add(sp.target); X.spot = sp;
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 13), new THREE.MeshBasicMaterial({ map:W.glow, color:new THREE.Color('#ffe2b8').multiplyScalar(0.55), transparent:true, depthWrite:false, blending:THREE.AdditiveBlending }));
  pool.rotation.x = -Math.PI/2; pool.renderOrder = 1; sc.add(pool); X.pool = pool;
  X.engr = makePerson({ body:'M', skin:'#3e2418', hair:'#0c0a09', beard:'#141010', torso:'#2c3440', armA:'#2c3440', armB:'#2c3440', armC:'#2c3440', hips:'#1c1e22', thigh:'#1c1e22', shin:'#1c1e22', shoe:'#111111', gear:['Gear_Glasses'] });
  X.boy = makePerson({ body:'M', skin:'#4a2b1c', hair:'#0c0a09', torso:'#a83a2a', armA:'#a83a2a', armB:'#a83a2a', armC:null, hips:'#2a2a3a', thigh:'#2a2a3a', shin:null, shoe:'#141414', gear:[], scale:0.9 });
  X.can = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.36, 0.16), new THREE.MeshLambertMaterial({ color:'#e8c020' })); X.can.visible = false; sc.add(X.can);
  // the road is already busy
  for(let s=R.K.station + 20; s<R.K.station + 300; s += rnd(30, 55)) addTraffic(pick(['taxi', 'sedan', 'danfo', 'suv', 'taxi', 'keke']), s, -1, Math.random() < 0.5 ? 0 : 1, rnd(10, 14));
}

/* =====================================================================
   THE TAIL
   ===================================================================== */
const C = { active:false };
function resetRun(){
  TR.length = 0; XT.length = 0;
  for(const k in C) delete C[k];
  Object.assign(C, {
    active:true, t:0, phase:'intro', slow:1, over:false, outcome:null, ev:{}, calls:{}, eff:{ integrity:0, publicTrust:0, agencyFavour:0, heat:0 },
    sU:R.K.station + 6, vU:0, laneU:1, laneUFrom:5.0, laneUT:0, latU:5.0, stopAt:null, cruise:null, hold:false, grace:0, catchUp:0, pendingLane:null,
    sJ:R.K.station + 46, vJ:0, laneJ:1, laneJFrom:5.6, laneJT:0, latJ:5.6, jStopAt:null, jHold:0, jMode:null, jHidden:false, jLaneAt:-99, uLaneAt:-99, park:0,
    target:45, susp:0, peak:0, closest:999, sweet:0, total:0, lookT:0, lookNext:rnd(7, 10), alert:0, lostT:0,
    decision:null, plate:false, photoCool:0, photoT:0, lights:true, cool:{}, say:null, sayT:0, sayPri:0, tipT:0, house:false, back:false,
  });
  CAM.head = CAM.headT = 0;
}
const CAM = { head:0, headT:0 };

/* ---------- what Uche says in the car ---------- */
const LINES = {
  close:['Too close, sir. He\'ll see my face.', 'Easy — we\'re on his bumper.', 'Sir. Any closer and I\'m in his back seat.'],
  far:['We\'re losing him, sir.', 'He\'s pulling away from us.', 'I can barely see his lights.'],
  look:['He\'s checking his mirror.', 'Eyes in the mirror. Sit still.', 'He\'s looking back.'],
  susp:['He\'s getting nervous. Give him room.', 'He\'s watching us, sir. Back off.'],
  cover:['Good — that car hides us.', 'Keep something between us and him.'],
  good:['Good. Right there.', 'This is a good distance.', 'Steady. Like this.'],
  copy:['He changed lanes and so did we. That\'s how they spot you.', 'Don\'t copy his moves, sir. Copying is what they look for.'],
};
function say(text, o){
  o = o || {}; const pri = o.pri || 1;
  if(C.say && C.sayT > 0 && pri < C.sayPri) return false;
  C.say = text; C.sayPri = pri; C.sayT = (o.ms || Math.max(2300, text.length*58))/1000;
  const who = o.who || 'SGT. UCHE', el = document.getElementById('car-say');
  if(el){ el.querySelector('#car-who').textContent = who; el.querySelector('#car-line').textContent = text; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); el.dataset.who = who === 'SGT. UCHE' ? 'uche' : 'other'; }
  return true;
}
function sayKey(key, lines, cool, pri){ if((C.cool[key] || -1) > C.t) return; if(say(pick(lines), { pri })) C.cool[key] = C.t + cool; }

/* ---------- the player's calls ---------- */
function control(c){
  if(!C.active || C.over || C.decision) return;
  if(c === 'photo') return takePhoto();
  if(C.phase !== 'tail') return;
  if(c === 'closer'){ C.target = Math.max(10, C.target - 10); bump('closer'); }
  if(c === 'back'){ C.target = Math.min(110, C.target + 10); bump('back'); }
  if(c === 'laneL' || c === 'laneR'){
    if(seg(C.sU) === 'C' || seg(C.sU) === 'J'){ say(seg(C.sU) === 'C' ? 'One lane, sir. Nowhere to go.' : 'Not in the junction, sir.', { pri:1 }); return; }
    const want = c === 'laneL' ? 0 : 1; if(want === C.laneU || C.laneUT < 1) return;
    if(C.ev.ucp && C.ev.ucp !== 'done' && want === 0){ say('Drums in that lane, sir.', { pri:1 }); return; }
    if(!laneClear(C.sU, want, CARU, 8)){ say('Not now — there\'s a car beside us.', { pri:2 }); return; }
    laneU(want);
  }
}
function laneU(want){
  C.laneUFrom = C.latU; C.laneU = want; C.laneUT = 0; C.uLaneAt = C.t; snd('tick');
  // copying his lane change a moment after he made it is what tails get caught on
  if(C.t - C.jLaneAt < 3 && want === C.laneJ && !covered() && (C.sJ - C.sU) < 70){ C.susp = Math.min(1, C.susp + 0.1); sayKey('copy', LINES.copy, 30, 2); }
}
function bump(dir){
  const el = document.querySelector(`#car-ctl [data-c="${dir}"]`); if(el){ el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit'); }
  if(typeof sfxClick === 'function') sfxClick();
}

/* ---------- decisions: the world slows while you choose ---------- */
function decide(o){
  if(C.decision || C.over) return;
  o.el = 0; C.decision = o; C.slow = 0.3;
  const hud = document.getElementById('car-hud'); if(hud) hud.classList.add('deciding');
  const el = document.getElementById('car-dec'); if(!el) return;
  el.innerHTML = `<div class="cd-k">${V12.esc(o.kicker || 'YOUR CALL')}</div><div class="cd-t">${V12.esc(o.title)}</div>${o.body ? `<div class="cd-b">${V12.esc(o.body)}</div>` : ''}
    <div class="cd-opts n${o.opts.length}">${o.opts.map((x, i)=>`<button data-k="${x.k}"><span class="cd-n">${i + 1}</span><b>${V12.esc(x.label)}</b>${x.sub ? `<small>${V12.esc(x.sub)}</small>` : ''}</button>`).join('')}</div>
    <div class="cd-time"><i id="cd-bar"></i></div>`;
  el.classList.add('show');
  el.querySelectorAll('button').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); resolveDecision(b.dataset.k); }));
  snd('decide');
  V12.log('car_decide', { id:o.id });
}
function resolveDecision(k){
  const o = C.decision; if(!o) return;
  C.decision = null; C.slow = 1;
  const el = document.getElementById('car-dec'); if(el) el.classList.remove('show');
  const hud = document.getElementById('car-hud'); if(hud) hud.classList.remove('deciding');
  if(typeof sfxClick === 'function') sfxClick();
  V12.log('car_choice', { id:o.id, k });
  try{ o.on(k); }catch(e){ console.warn('[v12] car decision', e); }
}

/* ---------- the plate ---------- */
const inR = (s, r)=>r && s >= r[0] && s <= r[1];
function jeepLit(){
  const s = C.sJ; if(inR(s, W.stationLit) || inR(s, W.junctionLit) || inR(s, W.cpLit)) return true;
  for(const [ls] of (W.lit || [])) if(Math.abs(ls - s) < 9) return true;
  return false;
}
function takePhoto(){
  if(C.phase !== 'tail' || C.over || C.photoCool > 0) return;
  C.photoCool = 1.1; snd('shutter'); bump('photo');
  const d = C.sJ - C.sU, lit = jeepLit(), side = Math.abs(C.latU - C.latJ);
  const ok = !C.jHidden && side < 4.4 && ((d <= 27 && lit) || d <= 13);
  if(d < 32) C.susp = Math.min(1, C.susp + 0.04);           // a phone screen glows in a dark car
  drawPhoto(ok, d, lit);
  V12.log('car_photo', { ok, d:Math.round(d), lit });
  if(ok && !C.plate){
    C.plate = true;
    collectEvidence({ id:'tail_plate', name:'Plate BEN 417 KJ — the black jeep, registered to Ikpoba Mast Services (the tower contractor)', xp:90 });
    say('Got it. BEN 417 KJ. Send it to the desk.', { pri:2 });
  } else if(!ok){
    say(C.jHidden ? 'He\'s not even in the picture, sir.' : d > 27 ? 'Too far, sir. That\'s two red lights and a prayer.' : 'Too dark. Wait for a streetlight.', { pri:2 });
  }
}
function drawPhoto(ok, d, lit){
  const el = document.getElementById('car-photo'); if(!el) return;
  const [c, x] = cv(320, 200);
  const g = x.createLinearGradient(0, 0, 0, 200); g.addColorStop(0, lit ? '#2a2620' : '#0b0d12'); g.addColorStop(1, '#050608'); x.fillStyle = g; x.fillRect(0, 0, 320, 200);
  const k = clamp(26/Math.max(8, d), 0.35, 1.6), cx = 160, cy = 118;
  x.save(); if(!ok && typeof x.filter === 'string') x.filter = `blur(${d > 27 ? 5 : 3}px)`;
  x.fillStyle = '#121418'; x.fillRect(cx - 70*k, cy - 52*k, 140*k, 84*k);                          // the tailgate
  x.fillStyle = '#0a0b0d'; x.fillRect(cx - 58*k, cy - 48*k, 116*k, 30*k);
  x.fillStyle = '#ff3020'; x.fillRect(cx - 70*k, cy - 46*k, 12*k, 34*k); x.fillRect(cx + 58*k, cy - 46*k, 12*k, 34*k);
  x.fillStyle = '#f4f4ee'; x.fillRect(cx - 26*k, cy + 2*k, 52*k, 18*k);
  x.fillStyle = '#1f3f9a'; x.font = FONT(Math.max(6, 12*k)); x.textAlign = 'center'; x.fillText('BEN 417 KJ', cx, cy + 16*k);
  x.restore();
  if(!lit){ x.fillStyle = 'rgba(0,0,0,0.45)'; x.fillRect(0, 0, 320, 200); }
  for(let i=0;i<1400;i++){ const v = Math.random()*255|0; x.fillStyle = `rgba(${v},${v},${v},0.07)`; x.fillRect(Math.random()*320, Math.random()*200, 1, 1); }
  el.innerHTML = '';
  c.className = 'cp-img'; el.appendChild(c);
  el.appendChild(V12.el('div', 'cp-cap ' + (ok ? 'ok' : 'no'), ok ? 'BEN 417 KJ · LOGGED' : (d > 27 ? 'TOO FAR' : 'TOO DARK')));
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  C.photoT = 2.6;
}

/* ---------- him ---------- */
function jeepLaneAt(s){ const K = R.K; if(s < 210) return 1; if(s < K.cp - 70) return 0; return 1; }
function jeepWant(){
  const K = R.K, s = C.sJ; let v = PROF[seg(s)].vJ;
  if(C.jMode === 'flee') return 19;
  if(s < K.station + 140) v = Math.min(v, 9);                  // easing off the forecourt
  if(s > K.stop - 70 && s < K.stop) v = 13.5;                  // making the amber
  if(s >= K.stop && s < K.bStart + 6) v = 7.5;                  // the left turn
  if(s > K.turnR - 36 && s < K.cStart + 4) v = 5.5;             // right, into Ekosodin
  if(C.jStopAt != null) v = Math.min(v, Math.sqrt(Math.max(0, 2*3.2*(C.jStopAt - s))));
  if(C.jHold > 0) v = 0;
  return v;
}
function updateJeep(dt){
  const K = R.K;
  // the intro: he pulls off the forecourt and into the slow lane
  if(C.phase === 'intro' && C.t < 1.3){ placeJeep(); return; }
  // the checkpoint: they wave him through after a word at the window
  if(!C.ev.jcp && C.sJ >= K.cp - 42){ C.ev.jcp = 'in'; C.jStopAt = K.cp - 1.5; }
  if(C.ev.jcp === 'in' && C.jStopAt != null && C.jStopAt - C.sJ < 0.5 && C.vJ < 0.3){ C.ev.jcp = 'window'; C.jHold = 2.6; C.jStopAt = null; if(X.officer) X.officer.userData.anim.play('talk'); }
  if(C.ev.jcp === 'window' && C.jHold <= 0) C.ev.jcp = 'through';
  // parking at the mouth of the close
  if(!C.ev.jpark && C.sJ >= K.park - 50){ C.ev.jpark = 'in'; C.jStopAt = K.park; }
  if(C.ev.jpark === 'in' && C.jStopAt - C.sJ < 0.4 && C.vJ < 0.25){ C.ev.jpark = 'parked'; C.jStopAt = null; C.jHold = 999; engineerOut(); }
  if(C.jHold > 0) C.jHold -= dt;
  const want = jeepWant();
  const prev = C.vJ;
  C.vJ += clamp(want - C.vJ, -4.5*dt, (C.jMode === 'flee' ? 5 : 2.4)*dt); C.vJ = Math.max(0, C.vJ);
  C.sJ = Math.min(R.len - 1, C.sJ + C.vJ*dt);
  C.jBrake = (C.vJ < prev - 0.6*dt) || C.vJ < 0.15;
  // lanes: he signals first, then moves
  const L = jeepLaneAt(C.sJ);
  if(seg(C.sJ) !== 'C' && L !== C.laneJ){ C.laneJFrom = C.latJ - (C.parkOff || 0); C.laneJ = L; C.laneJT = 0; C.jLaneAt = C.t; }
  if(C.laneJT < 1) C.laneJT = Math.min(1, C.laneJT + dt/2.4);
  const s = C.sJ, soon = jeepLaneAt(s + 32);
  C.ind = (C.laneJT < 1 ? (C.laneJFrom > 4 || C.laneJ === 0 ? 'L' : 'R') : null)
       || (seg(s) !== 'C' && soon !== C.laneJ ? (soon === 0 ? 'L' : 'R') : null)
       || (s > K.stop - 75 && s < K.turnL + 4 ? 'L' : null)
       || (s > K.turnR - 60 && s < K.turnR + 2 ? 'R' : null)
       || (C.ev.jpark ? 'R' : null);
  if(C.jMode === 'flee') C.ind = null;
  placeJeep();
}
function placeJeep(){
  const K = R.K;
  if(C.phase === 'intro' && C.t < 1.3){ C.latJ = 5.6; }
  else {
    const base = laneOff(C.sJ, C.laneJ);
    C.parkOff = C.ev.jpark ? 1.7*smooth((C.sJ - (K.park - 22))/20) : 0;
    C.latJ = lerp(C.laneJFrom, base, smooth(C.laneJT)) + C.parkOff;
  }
  const f = frame(C.sJ, C.latJ);
  X.jeep.position.set(f.x, 0, f.z); X.jeep.rotation.y = f.yaw;
  X.jeep.visible = !C.jHidden;
  CARJ.s = C.sJ; CARJ.lat = C.latJ; CARJ.v = C.vJ;
  const blink = Math.floor(C.t*3.2) % 2 === 0;
  X.brake.forEach(b => { b.material.opacity = C.jBrake ? 0.95 : 0; });
  if(X.tail) X.tail.forEach(b => { b.material.opacity = 0.55; });
  if(X.indL) X.indL.material.opacity = C.ind === 'L' && blink ? 1 : 0;
  if(X.indR) X.indR.material.opacity = C.ind === 'R' && blink ? 1 : 0;
}

/* ---------- us ---------- */
function updateUs(dt){
  const K = R.K, p = PROF[seg(C.sU)], d = C.sJ - C.sU;
  let want;
  if(C.phase === 'intro') want = 0;
  else if(C.cruise != null) want = C.cruise;
  else {
    const vmax = p.vMax + (C.t < C.catchUp ? 4 : 0);
    want = clamp(C.vJ + 0.38*(d - C.target), 0, vmax);
    if(C.jHidden) want = vmax;
  }
  // whatever is ahead of us in our lane
  const a = ahead(CARU);
  if(a){ const g = a.gap; if(g < 16) want = Math.min(want, a.o.v + Math.max(-6, (g - 6)*0.55)); if(g < 2.5) want = 0; }
  if(C.stopAt != null){ const rem = C.stopAt - C.sU; want = Math.min(want, Math.sqrt(Math.max(0, 2*5*rem))); if(rem < 0.15) want = 0; }
  // cross traffic still in the junction box
  if(C.sU > K.stop - 3 && C.sU < K.stop + 22 && XT.some(inBox)) want = 0;
  C.vU += clamp(want - C.vU, -7*dt, 3.2*dt); C.vU = Math.max(0, C.vU);
  C.sU = Math.min(R.len - 1, C.sU + C.vU*dt);
  // a lane change Uche couldn't make yet
  if(C.pendingLane != null && C.laneUT >= 1 && laneClear(C.sU, C.pendingLane, CARU, 8)){ laneU(C.pendingLane); C.pendingLane = null; }
  // the drums at the checkpoint close the inside lane
  if(C.laneU === 0 && C.laneUT >= 1 && C.sU > K.cp - 70 && C.sU < K.cp + 4 && !C.ev.cpMerge){ C.ev.cpMerge = true; say('Drums ahead in this lane. I\'m moving right.', { pri:1 }); C.pendingLane = 1; }
  if(C.laneUT < 1 && C.phase === 'tail') C.laneUT = Math.min(1, C.laneUT + dt/1.6);
  const base = laneOff(C.sU, C.laneU);
  const pass = C.passOff || 0;
  const lat = lerp(C.laneUFrom, base, smooth(C.laneUT)) + pass;
  C.latVel = (lat - C.latU)/Math.max(dt, 1e-3); C.latU = lat;
  CARU.s = C.sU; CARU.lat = C.latU; CARU.v = C.vU;
  const f = frame(C.sU, C.latU);
  if(X.our){ X.our.position.set(f.x, 0, f.z); X.our.rotation.y = f.yaw; }
  // headlights
  const hx = f.x + f.tx*2.3, hz = f.z + f.tz*2.3;
  if(X.spot){ X.spot.position.set(hx, 0.8, hz); X.spot.target.position.set(f.x + f.tx*30, 0, f.z + f.tz*30); X.spot.intensity = C.lights ? 1.7 : 0; }
  if(X.pool){ X.pool.position.set(f.x + f.tx*9.5, 0.05, f.z + f.tz*9.5); X.pool.rotation.z = -f.yaw; X.pool.visible = C.lights; }
}
function covered(){
  const lo = C.sU + 3, hi = C.sJ - 3;
  for(const t of TR){ if(t.dir < 0 || t.peel || t.s < lo || t.s > hi) continue;
    const k = (t.s - C.sU)/Math.max(1, C.sJ - C.sU), line = lerp(C.latU, C.latJ, k);
    if(Math.abs(t.lat - line) < 1.3) return true; }
  return false;
}

/* ---------- everyone else ---------- */
function updateTraffic(dt){
  const K = R.K, sg = seg(C.sU);
  for(const t of TR){
    if(t.dir < 0){ t.s -= t.v*dt; placeT(t);
      if(sg === 'C' && t.kind === 'okada' && Math.abs(t.s - C.sU) < 20 && (t.horn -= dt) < 0){ snd('horn', 0.6); t.horn = 99; }
      continue; }
    if(t.peel){ t.v = Math.min(13, t.v + 2*dt); t.peel.d += t.v*dt; t.s += t.v*dt; t.g.position.x += t.peel.dx*t.v*dt; t.g.position.z += t.peel.dz*t.v*dt; continue; }
    if(t.s > K.turnR - 18 && seg(t.s) !== 'C'){ const f = frame(t.s, t.lat); t.peel = { dx:f.tx, dz:f.tz, d:0 }; t.v = Math.max(t.v, 9); continue; }
    let want = t.vC;
    if(t.role === 'danfo') want = danfoWant(t, dt);
    if(t.s > K.cp - 70 && t.s < K.cp + 6){
      if(t.lane === 0 && t.laneT >= 1){ if(laneClear(t.s, 1, t, 9)) startLane(t, 1); else want = Math.min(want, Math.sqrt(Math.max(0, 2*4*(K.cp - 8 - t.s)))); }
      if(t.s > K.cp - 12) want = Math.min(want, 4);
    }
    const a = ahead(t);
    if(a){ const g = a.gap; if(g < 18) want = Math.min(want, a.o.v + Math.max(-6, (g - 7)*0.6)); if(g < 2.5) want = 0;
      // stuck behind something slow: overtake when the other lane is clear
      if(!t.role && seg(t.s) !== 'C' && seg(t.s) !== 'J' && t.laneT >= 1 && g < 16 && a.o.v < t.vC - 2 && laneClear(t.s, 1 - t.lane, t, 10)) startLane(t, 1 - t.lane);
      if(a.o === CARU && g < 10 && (t.horn -= dt) < 0){ snd('horn', 0.5); t.horn = rnd(5, 9); }
    }
    t.v += clamp(want - t.v, -6*dt, 2.6*dt); t.v = Math.max(0, t.v);
    t.s += t.v*dt;
    if(t.laneT < 1) t.laneT = Math.min(1, t.laneT + dt/1.8);
    placeT(t);
  }
  // the junction box: cross traffic while we wait at red
  for(const x of XT){ x.x += x.vx*dt; x.g.position.x = x.x; }
  for(let i=XT.length-1;i>=0;i--){ const x = XT[i]; if(Math.abs(x.x - x.x0) > 165){ dropT(x); XT.splice(i, 1); } }
  // tidy up and keep the road alive
  for(let i=TR.length-1;i>=0;i--){ const t = TR[i];
    if((t.peel && t.peel.d > 130) || (!t.peel && t.dir > 0 && (t.s < C.sU - 90 || t.s > C.sJ + 230 || t.s > R.len - 4)) || (t.dir < 0 && (t.s < C.sU - 40 || t.s < 2))){ dropT(t); TR.splice(i, 1); } }
  if(C.over && C.outcome !== 'burned') return;
  const opp = TR.filter(t => t.dir < 0).length, same = sameDir().length;
  const wantOpp = sg === 'A' ? 6 : sg === 'B' ? 4 : sg === 'C' ? 2 : 0;
  if(opp < wantOpp && (C.oppCool = (C.oppCool || 0) - dt) < 0){
    C.oppCool = rnd(0.6, 1.6);
    const s = Math.min(R.len - 3, C.sU + rnd(230, 290));
    const zone = s > K.stop - 15 && s < K.bStart + 15;
    if(!zone && s > C.sU + 60){
      const c = seg(s) === 'C';
      addTraffic(c ? pick(['okada', 'okada', 'keke', 'sedan']) : pick(['taxi', 'sedan', 'danfo', 'suv', 'truck', 'keke', 'taxi', 'sedan']), s, -1, c ? 0 : (Math.random() < 0.5 ? 0 : 1), c ? rnd(5.5, 8) : rnd(10, 15));
    }
  }
  const wantSame = (sg === 'A' ? 3 : sg === 'B' ? 2 : 0);
  const quietB = C.sU > K.cp - 160 && C.sU < K.cp + 20;
  if(C.phase === 'tail' && same < wantSame && !quietB && (C.sameCool = (C.sameCool || 0) - dt) < 0){
    C.sameCool = rnd(2.5, 5);
    const lane = Math.random() < 0.5 ? 0 : 1, s = C.sU - rnd(45, 70);
    if(s > 5 && seg(s) === sg && laneClear(s, lane, null, 14)) addTraffic(pick(['taxi', 'sedan', 'taxi', 'suv', 'keke']), s, 1, lane, Math.min(PROF[sg].vMax + 2, C.vU + rnd(2.5, 5)));
  }
}
/* the danfo that cuts in, then stops for passengers in front of you */
function danfoWant(t, dt){
  const K = R.K, stopS = K.station + 335;
  if(t.st === 'start'){ t.st = 'cutin'; }
  if(t.st === 'cutin'){
    if(t.s > C.sU + 9 && t.laneT >= 1){ if(laneClear(t.s, C.laneU, t, 7)){ startLane(t, C.laneU); t.st = 'cover'; snd('horn', 1); say('This danfo driver…!', { pri:2 }); C.calls.danfoCut = true; } }
    if(t.s > C.sU + 34) t.st = 'cover';
    return C.vU + 6;
  }
  if(t.st === 'cover'){ if(t.s >= stopS - 26) t.st = 'stopping'; return Math.max(6, C.vJ - 1.1); }
  if(t.st === 'stopping'){
    t.latAdd = Math.min(0.7, t.latAdd + dt*0.5);
    const rem = stopS - t.s;
    if(rem < 0.4 && t.v < 0.3){ t.st = 'stopped'; t.hold = 5.5; snd('shout'); say('Uniben! Ekosodin! Enter with your change!', { who:'DANFO CONDUCTOR · ON THE STREET', pri:1, ms:2600 }); }
    return Math.sqrt(Math.max(0, 2*3*rem));
  }
  if(t.st === 'stopped'){ t.hold -= dt; if(C.calls.danfo === 'wait' && Math.abs(t.lat - C.latU) < 1.4) C.hold = true;
    if(t.hold <= 0){ t.st = 'go'; t.latAdd = 0; if(C.calls.danfo === 'wait'){ C.hold = false; C.grace = C.t + 16; C.catchUp = C.t + 16; say('Go, go. He\'s two streetlights ahead.', { pri:2 }); } } return 0; }
  t.role = null; return 11;
}

/* ---------- the story beats ---------- */
function director(dt){
  const K = R.K, ev = C.ev, d = C.sJ - C.sU, tier = V12.ucheTier();
  // intro
  if(C.phase === 'intro'){
    if(!ev.i1 && C.t > 0.5){ ev.i1 = 1; say(FL_().musa_hilux || V12.who.musaTalked() ? 'Eight-forty, like Musa said. Black jeep at the pump — that\'s our man.' : 'Eight-forty. Black jeep at the pump — that\'s him.', { pri:3 }); }
    if(!ev.i2 && C.t > 2.4){ ev.i2 = 1; addTraffic('taxi', Math.max(1, C.sU - 34), 1, 1, 13.5); }
    if(!ev.i3 && C.t > 2.9){ ev.i3 = 1; say('He\'s moving. Let the taxi go first. Then we go.', { pri:3 }); }
    if(C.t > 4.6 && laneClear(C.sU, 1, CARU, 9)){ C.phase = 'tail'; C.laneUFrom = C.latU; C.laneUT = 0; completeObjective('c1_go'); tip(); snd('tick'); }
    return;
  }
  // the danfo
  if(!ev.danfo && C.sU > 115 && seg(C.sU) === 'A'){ ev.danfo = 1; const lane = C.laneU ? 0 : 1; const t = addTraffic('danfo', C.sU - 24, 1, lane, C.vU + 7, 'danfo'); if(t) C.danfo = t; }
  const dn = C.danfo;
  if(dn && !ev.danfoCall && (dn.st === 'stopping' || dn.st === 'stopped') && Math.abs(dn.lat - C.latU) < 1.4 && dn.s - C.sU > 0 && dn.s - C.sU < 48){
    ev.danfoCall = 1;
    decide({ id:'danfo', kicker:'UGBOWO ROAD', title:'THE DANFO IS STOPPING', body:'Passengers. It will sit there a while — and the jeep won\'t.',
      opts:[{ k:'around', label:'GO AROUND IT', sub:'Change lanes. If he\'s looking, he may see the move.' }, { k:'wait', label:'WAIT BEHIND IT', sub:'Safe. He gets away from you.' }],
      ms:4500, def:'wait', on:k => { C.calls.danfo = k; if(k === 'around'){ const o = C.laneU ? 0 : 1; if(laneClear(C.sU, o, CARU, 8)) laneU(o); else { C.pendingLane = o; say('Wait… wait… now.', { pri:2 }); } } else say('We wait. He\'s not going anywhere we can\'t find.', { pri:2 }); } });
  }
  // Ugbowo junction
  if(!ev.amber && C.sJ >= K.stop - 48){ ev.amber = true; setLight('amber'); say('Amber… he\'s going for it.', { pri:2 }); snd('engineRev'); }
  if(ev.amber && !ev.red && C.sJ >= K.stop + 3) ev.red = C.t + 0.7;
  if(ev.red && !ev.redOn && C.t >= ev.red){ ev.redOn = true; setLight('red'); crossTraffic(true); if(C.sU >= K.stop - 1.5){ ev.lightDone = true; C.calls.light = 'through'; } }
  if(ev.redOn && !ev.lightDone && C.sU < K.stop - 1.5 && K.stop - C.sU < 75){
    ev.lightDone = true;
    decide({ id:'light', kicker:'UGBOWO JUNCTION', title:'RED LIGHT', body:'He went through on the amber. The cross traffic is already moving.',
      opts:[{ k:'run', label:'RUN IT', sub:'Keep him in sight. He\'ll see a car jump the light behind him.' }, { k:'stop', label:'STOP', sub:'Lose him for a few seconds. Then call which way he went.' }],
      ms:5000, def:'stop', on:k => { C.calls.light = k;
        if(k === 'run'){ C.runRed = true; say('Hold on!', { pri:3 }); }
        else { C.stopAt = K.stop - 1.2; C.hold = true; say('We wait.', { pri:2 }); } } });
  }
  if(C.runRed && !ev.ran && C.sU > K.stop){ ev.ran = true; C.susp = Math.min(1, C.susp + 0.3); C.eff.integrity -= 1; C.eff.publicTrust -= 1; snd('horn', 1); setTimeout(()=>snd('horn', 0.8), 260); snd('skid'); if(typeof shakeCamera === 'function') shakeCamera(0.12);
    setTimeout(()=>{ if(C.active && !C.over) say(tier === 'low' ? 'Everyone at that junction saw us. So did he.' : 'He saw that, sir. Everyone saw that.', { pri:2 }); }, 2200); }
  if(C.calls.light === 'stop'){
    if(!ev.hide && C.sJ > K.turnL + 22){ ev.hide = true; C.jHidden = true; }
    if(!ev.waitEnd && C.stopAt != null && C.vU < 0.2 && C.stopAt - C.sU < 1.5){ ev.waitEnd = C.t + 6.5; }
    if(ev.waitEnd && !ev.green && C.t >= ev.waitEnd){ ev.green = true; setLight('green'); crossTraffic(false); C.jHidden = true;
      const body = tier === 'high' ? '"He was indicating left before the junction, sir. I saw it."' : tier === 'mid' ? '"I was watching the light, sir. Which way?"' : '"Your call, sir."';
      decide({ id:'which', kicker:'UGBOWO JUNCTION', title:'WHICH WAY DID HE GO?', body,
        opts:[{ k:'left', label:'LEFT', sub:'Along the university fence' }, { k:'straight', label:'STRAIGHT ON', sub:'Up Ugbowo road' }, { k:'right', label:'RIGHT', sub:'Back towards the city' }],
        ms:7000, def:tier === 'high' ? 'left' : 'straight', on:k => { C.calls.turn = k;
          if(k === 'left'){ C.stopAt = null; C.hold = false; C.jHidden = false; C.grace = C.t + 18; C.catchUp = C.t + 18; say('Left. There — his tail-lights, by the fence.', { pri:3 }); }
          else lost('turn', k); } });
    }
  }
  // the checkpoint
  if(C.ev.jcp === 'window' && !ev.cpSeen && C.sJ - C.sU < 120){ ev.cpSeen = true; say('Checkpoint. They\'re waving him through — he knows them.', { pri:2 }); }
  if(!ev.ucp && C.sJ > K.cp + 1 && C.sU > K.cp - 95){ ev.ucp = 'in'; C.stopAt = K.cp - 5; if(!ev.cpSeen){ ev.cpSeen = true; say('Checkpoint. They let him straight through.', { pri:2 }); } snd('whistle'); }
  if(ev.ucp === 'in' && C.stopAt != null && C.vU < 0.25 && C.stopAt - C.sU < 1.2){
    ev.ucp = 'stopped'; C.hold = true;
    decide({ id:'cp', kicker:'POLICE CHECKPOINT', title:'"PARTICULARS."', body:'A torch in your face. The jeep\'s tail-lights are getting smaller.',
      opts:[{ k:'badge', label:'SHOW THE BADGE', sub:'Through in seconds. Policemen talk.' }, { k:'civilian', label:'PLAY CIVILIAN', sub:'Uche does the talking. It will take time.' }, { k:'bribe', label:'₦500 "FOR THE BOYS"', sub:'Through in seconds. It\'s a bribe.' }],
      ms:7000, def:'civilian', on:k => { C.calls.cp = k; checkpointCall(k, tier); } });
  }
  if(ev.ucp === 'wait' && C.t >= C.cpWait){ ev.ucp = 'done'; C.stopAt = null; C.hold = false; C.grace = C.t + 16; C.catchUp = C.t + 16; say(C.calls.cp === 'civilian' ? 'Now we chase. Quietly.' : 'Go.', { pri:2 }); }
  if(C.tipAt && C.t >= C.tipAt){ C.tipAt = 0; C.alert = C.t + 16; C.lookNext = 0.4; snd('phoneBuzz'); say('His phone is ringing… now he\'s checking his mirrors. Somebody at that checkpoint made a call.', { pri:3 }); }
  // Ekosodin
  if(!ev.eko && C.sU > K.turnR - 8){ ev.eko = true; say('Ekosodin. One lane, no lights. If he stops, we don\'t.', { pri:2 }); }
  // he parks
  if(!ev.final && C.ev.jpark && C.sJ >= K.park - 34 && !C.over){
    ev.final = true;
    decide({ id:'final', kicker:'EKOSODIN · 21:02', title:'HE\'S PULLING OVER', body:'The mouth of a close. Right indicator. He\'s parking.',
      opts:[{ k:'past', label:'DRIVE PAST, DON\'T LOOK', sub:'Eyes front. See what you can from the corner of your eye.' }, { k:'stop', label:'STOP HERE, LIGHTS OFF', sub:'Watch him walk in from a distance.' }, { k:'foot', label:'FOLLOW HIM ON FOOT', sub:'See exactly where he goes — if he doesn\'t turn round.' }],
      ms:6500, def:'stop', on:k => finalCall(k) });
  }
  if(C.calls.final === 'past') drivePast(dt);
  if(C.watch && W.close) lookAt(W.close.x + W.close.dx*8, W.close.z + W.close.dz*8, -0.9);
}
const FL_ = ()=>S.game.flags || {};
function checkpointCall(k, tier){
  const ev = C.ev; ev.ucp = 'wait';
  if(k === 'badge'){ C.cpWait = C.t + 2.6; say('Ah — NACECA! Oga, welcome sah! Go well o!', { who:'OFFICER · CHECKPOINT', pri:3, ms:2400 }); C.tipAt = C.t + 7;
    setTimeout(()=>{ if(C.active && !C.over) say('Did you see the one by the pickup reach for his phone?', { pri:2 }); }, 3200); }
  if(k === 'civilian'){ C.cpWait = C.t + 9;
    say('Good evening, officer. My wife is at UBTH — I\'m going to carry her home.', { pri:3, ms:3000 });
    setTimeout(()=>{ if(C.active && !C.over) say('Ehen. Wetin you carry for boot? …Oya, go.', { who:'OFFICER · CHECKPOINT', pri:3, ms:2600 }); }, 3800); }
  if(k === 'bribe'){ C.cpWait = C.t + 2.2; C.eff.integrity -= 6; C.eff.publicTrust -= 1;
    say('Correct guy! Go!', { who:'OFFICER · CHECKPOINT', pri:3, ms:1800 });
    setTimeout(()=>{ if(C.active && !C.over) say(tier === 'high' ? '…That was not us, sir. Not in my car. Not again.' : tier === 'mid' ? 'I\'ll pretend I didn\'t see that.' : 'So this is how you work.', { pri:3 }); }, 2000); }
}
function finalCall(k){
  const K = R.K, d = C.sJ - C.sU;
  C.calls.final = k;
  if(k === 'past'){
    C.cruise = 5.5;
    if(d < 14){ C.susp = Math.min(1, C.susp + 0.45); say('We\'re right on him — he\'s getting out!', { pri:3 }); }
    else say('Eyes front, sir. Look with the corner of your eye.', { pri:3 });
  }
  if(k === 'stop'){
    C.stopAt = C.sU + Math.max(1, C.vU*C.vU/(2*5)); C.lights = false; snd('tick');
    if(d < 25){ C.susp = Math.min(1, C.susp + 0.35); say('Too close to stop here, sir — he\'ll see us sitting behind him.', { pri:3 }); }
    else say('Lights off. …There. He\'s walking into that close.', { pri:3 });
    C.watch = true;
    setTimeout(()=>{ if(!C.active || C.over) return; C.house = true; say('Akintola Close. The bulbs are out — I can\'t see which gate.', { pri:3 }); setTimeout(()=>endRun('clean'), 2600); }, 5200);
  }
  if(k === 'foot'){
    C.stopAt = C.sU + Math.max(1, C.vU*C.vU/(2*5)); C.lights = false;
    const ok = C.susp <= 0.25;
    setTimeout(()=>{ if(!C.active || C.over) return;
      if(ok){ C.house = true; C.back = true; say('You let him get thirty metres ahead, then walk. He knocks twice at a gate halfway down. It opens. A boy with a jerrycan slips out of the back gate by the generator. You walk back to the car.', { who:'NACECA SYSTEM', pri:4, ms:6200 }); setTimeout(()=>endRun('clean'), 6000); }
      else { say('He turns at the sound of your door. For one second he looks straight at you. Then he walks very fast.', { who:'NACECA SYSTEM', pri:4, ms:4200 }); setTimeout(()=>burned(true), 1200); }
    }, 1400);
  }
}
/* driving past the close: the passenger seat is on the right, so you see it */
function drivePast(dt){
  const K = R.K, ev = C.ev;
  // swing out round his parked jeep
  C.passOff = -1.3*smooth((C.sU - (K.park - 26))/10) * (1 - smooth((C.sU - (K.park + 8))/10));
  if(!ev.boy && C.sU >= K.park - 14){ ev.boy = true; boyOut(); }
  if(!ev.look && C.sU >= K.park - 4){ ev.look = true; }
  if(ev.look && !ev.lookBack) lookAt(W.close.x + W.close.dx*24, W.close.z + W.close.dz*24, -1.5);
  if(!ev.seen && C.sU >= K.park + 5){ ev.seen = true; C.house = true; C.back = true;
    say('Akintola Close. He\'s walking past three gates. Halfway down, a boy with a jerrycan slips out of a back gate by a generator.', { who:'NACECA SYSTEM', pri:4, ms:5200 }); }
  if(!ev.lookBack && C.sU >= K.park + 18){ ev.lookBack = true; CAM.headT = 0; setTimeout(()=>{ if(C.active && !C.over) say('Nine o\'clock fuel run, and he leaves that gate open. Remember it.', { pri:3 }); }, 600); }
  if(!ev.pastEnd && C.sU >= K.park + 40){ ev.pastEnd = true; C.cruise = 0; setTimeout(()=>endRun('clean'), 2400); }
}
/* turn Kelechi's head toward a point, no further than `max` radians to the right */
function lookAt(x, z, max){
  const f = frame(C.sU, C.latU), want = Math.atan2(-(x - f.x), -(z - f.z));
  let d = want - f.yaw; while(d > Math.PI) d -= Math.PI*2; while(d < -Math.PI) d += Math.PI*2;
  CAM.headT = clamp(d, max, 0.3);
}
function engineerOut(){
  const e = X.engr; if(!e) return;
  const f = frame(C.sJ, C.latJ - 1.2);
  e.position.set(f.x, 0, f.z); e.visible = true; e.userData.anim.play('walk', { fade:0.2 });
  const W2 = W.close, mouth = [W2.x + W2.dx*5.5, W2.z + W2.dz*5.5], deep = [W2.gate[0] - W2.dx*1.2, W2.gate[1] - W2.dz*1.2];
  C.walk = { who:e, pts:[[f.x, f.z], mouth, [mouth[0] + W2.dx*10, mouth[1] + W2.dz*10], deep], i:1, v:1.45, done:()=>{ e.visible = false; } };
}
function boyOut(){
  const b = X.boy; if(!b) return;
  const Q = W.close, sx = Q.shed[0] + Q.dx*1.6, sz = Q.shed[1] + Q.dz*1.6;
  b.position.set(sx, 0, sz); b.visible = true; b.userData.anim.play('walk', { fade:0.2 }); X.can.visible = true;
  const m = [Q.x + Q.dx*7 - Q.tx*2.6, Q.z + Q.dz*7 - Q.tz*2.6], far = [Q.x + Q.dx*5.6 - Q.tx*30, Q.z + Q.dz*5.6 - Q.tz*30];
  C.walk2 = { who:b, pts:[[sx, sz], m, far], i:1, v:1.3, carry:X.can, done:()=>{ b.visible = false; X.can.visible = false; } };
}
function stepWalk(w, dt){
  if(!w || w.i >= w.pts.length) return;
  const p = w.who.position, [tx, tz] = w.pts[w.i], dx = tx - p.x, dz = tz - p.z, L = Math.hypot(dx, dz);
  if(L < 0.15){ w.i++; if(w.i >= w.pts.length){ w.who.userData.anim.play('idle'); if(w.done) w.done(); } return; }
  const k = Math.min(1, w.v*dt/L); p.x += dx*k; p.z += dz*k; w.who.rotation.y = Math.atan2(dx, dz);
  if(w.carry){ const r = w.who.rotation.y; w.carry.position.set(p.x - Math.cos(r)*0.3, 0.52, p.z + Math.sin(r)*0.3); w.carry.rotation.y = r; }
}

/* ---------- endings ---------- */
function endRun(outcome){
  if(C.over) return;
  C.over = true; C.outcome = outcome;
  if(outcome === 'clean'){ completeObjective('c2_stay'); completeObjective('c3_where'); }
  V12.log('car_end', { outcome, susp:Math.round(C.peak*100), plate:C.plate, calls:C.calls });
  setTimeout(()=>{ if(C.active) showResult(); }, outcome === 'clean' ? 1800 : 3000);
}
function burned(onFoot){
  if(C.over) return;
  C.susp = 1; C.jMode = 'flee'; C.jHold = 0; C.jStopAt = null; C.cruise = C.vU > 3 ? C.vU*0.5 : 0;
  if(!onFoot) say(pick(['He\'s made us. He\'s running.', 'That\'s it — he\'s seen us. He\'s going.']), { pri:5 });
  snd('engineRev');
  setTimeout(()=>{ if(C.active) say('He knows, sir. Whatever is in that house will know in five minutes.', { pri:5 }); }, 1600);
  endRun('burned');
}
function lost(why, k){
  if(C.over) return;
  C.cruise = why === 'turn' ? 9 : C.vU; C.calls.lostWhy = why;
  if(why === 'turn'){ say(k === 'straight' ? 'Straight… nothing. Nothing.' : 'Right… no. No black jeep.', { pri:4 }); setTimeout(()=>{ if(C.active) say('We\'ve lost him, sir.', { pri:5 }); }, 1800); C.jHidden = true; }
  else say('…He\'s gone. We\'ve lost him.', { pri:5 });
  endRun('lost');
}
function crossTraffic(on){
  if(!on){ C.xOn = false; return; }
  C.xOn = true; C.xCool = 0;
}
function crossTick(dt){
  if(!C.xOn) return;
  if((C.xCool -= dt) > 0) return;
  C.xCool = rnd(1.0, 2.0);
  const z = Math.random() < 0.6 ? -558.3 : -554.8, x0 = -66;
  const g = spawnVeh(pick(['taxi', 'sedan', 'danfo', 'keke', 'suv', 'sedan']), { color:pick(SEDAN_COL), lights:'on', glow:true });
  if(!g) return;
  g.position.set(x0, 0, z); g.rotation.y = -Math.PI/2;
  XT.push({ g, x:x0, x0, vx:rnd(10, 13) });
}
const inBox = x => x.x > -24 && x.x < 16;

/* ---------- the loop ---------- */
function tickCar(dtReal){
  if(!C.active) return;
  if(isOverlayOpen() || document.hidden){ updateCam(dtReal); return; }
  // decisions run on the clock you can see, not the slowed world
  if(C.decision){ C.decision.el += dtReal; const bar = document.getElementById('cd-bar'); if(bar) bar.style.width = (100*Math.max(0, 1 - C.decision.el*1000/C.decision.ms)).toFixed(1) + '%';
    if(C.decision.el*1000 >= C.decision.ms) resolveDecision(C.decision.def); }
  const dt = dtReal * C.slow * ((V12.carDebug && V12.carDebug.speed) || 1);
  C.t += dt;
  updateJeep(dt); updateUs(dt); updateTraffic(dt); crossTick(dt); director(dt);
  stepWalk(C.walk, dt); stepWalk(C.walk2, dt);
  if(C.photoCool > 0) C.photoCool -= dtReal;
  if(C.photoT > 0 && (C.photoT -= dtReal) <= 0){ const el = document.getElementById('car-photo'); if(el) el.classList.remove('show'); }
  if(C.sayT > 0 && (C.sayT -= dtReal) <= 0){ C.say = null; const el = document.getElementById('car-say'); if(el) el.classList.remove('show'); }
  // what he sees, and how worried he is
  const d = C.sJ - C.sU, p = PROF[seg(C.sU)], tail = C.phase === 'tail' && !C.over;
  if(tail){
    if(C.lookT > 0) C.lookT -= dt;
    else if((C.lookNext -= dt) <= 0){ C.lookT = rnd(1.8, 2.6); C.lookNext = C.t < C.alert ? rnd(2.2, 3.6) : rnd(6.5, 11); }
    const looking = C.lookT > 0 && !C.jHidden && C.jHold < 100, cov = covered(), same = Math.abs(C.latU - C.latJ) < 1.3;
    let g = 0;
    if(!C.jHidden && !C.calls.final){
      if(d < 10) g += 0.32;
      else if(d < p.close) g += 0.12 + (p.close - d)/p.close*0.12;
      if(looking && !cov) g += (d < 25 ? 0.34 : d < 45 ? (same ? 0.2 : 0.085) : (same ? 0.07 : 0.02)) * (C.t < C.alert ? 1.6 : 1) * (seg(C.sU) === 'C' && C.lights ? 1.25 : 1);
      if(looking && cov) g += 0.015;
    }
    if(g > 0) C.susp += g*dt; else C.susp -= (d >= p.close && d <= p.good ? 0.035 : 0.025)*dt;
    C.susp = clamp(C.susp, 0, 1); C.peak = Math.max(C.peak, C.susp);
    if(C.susp >= 1) burned();
    // stats
    if(!C.hold && !C.jHidden){ C.total += dt; if(d >= p.close && d <= p.good) C.sweet += dt; if((C.vU > 1 || d < 12) && d > 0 && !C.calls.final) C.closest = Math.min(C.closest, d); }
    // losing him
    const limit = p.lost + (C.t < C.grace ? 80 : 0);
    if(!C.hold && !C.over && d > limit){ C.lostT += dt; if(C.lostT > 4.5) lost('distance'); } else C.lostT = Math.max(0, C.lostT - dt*2);
    // Uche's running commentary
    if(!C.decision && !C.over && !C.hold && !C.jHidden && C.cruise == null){
      if(d < p.close && C.vU > 2) sayKey('close', LINES.close, 9, 1);
      else if(d > p.lost*0.72) sayKey('far', LINES.far, 8, 2);
      if(looking && !cov && d < p.good + 10) sayKey('look', LINES.look, 12, 1);
      if(C.susp > 0.62) sayKey('susp', LINES.susp, 10, 2);
      if(cov && d < p.good && C.susp < 0.3 && C.t > 20) sayKey('cover', LINES.cover, 40, 0);
      if(d >= p.close && d <= p.good && C.susp < 0.12 && C.t > 14) sayKey('good', LINES.good, 35, 0);
    }
    setEye(C.susp, looking ? 'look' : null);
  } else if(C.phase === 'intro') setEye(0, null);
  // the officer's torch
  const o = W.officers && W.officers[0];
  if(W.torch && o){ W.torch.position.set(o.position.x + Math.sin(o.rotation.y)*0.45, 1.25, o.position.z + Math.cos(o.rotation.y)*0.45); }
  updateGauge(d, p);
  updateCam(dtReal);          // after the car has moved this frame, or the lens trails behind the bonnet
  snd('carUpdate', { speed:C.vU, surface:seg(C.sU) === 'C' ? 'laterite' : 'asphalt', parlour:W.parlour ? Math.hypot(ENGINE.camera.position.x - W.parlour.x, ENGINE.camera.position.z - W.parlour.z) : 999, ind:C.laneUT < 1 });
}
function updateCam(dt){
  const cam = ENGINE.camera; if(!cam || !R.n) return;
  const f = frame(C.sU, C.latU);
  CAM.head += (CAM.headT - CAM.head)*Math.min(1, dt*2.4);
  const bump = seg(C.sU) === 'C' ? (Math.sin(C.t*11)*0.012 + (Math.random() - 0.5)*0.008)*Math.min(1, C.vU/5) : (Math.random() - 0.5)*0.002*Math.min(1, C.vU/10);
  cam.position.set(f.x + f.rx*0.36 - f.tx*0.12, 1.17 + bump, f.z + f.rz*0.36 - f.tz*0.12);
  cam.rotation.order = 'YXZ';
  cam.rotation.set(-0.045 + (C.vU < 0.5 ? 0 : Math.sin(C.t*1.7)*0.004), f.yaw + CAM.head, clamp(-(C.latVel || 0)*0.012, -0.03, 0.03));
  const want = innerWidth < innerHeight ? 80 : innerWidth < 760 ? 70 : 62;
  if(Math.abs(cam.fov - want) > 0.5){ cam.fov = want; cam.updateProjectionMatrix(); }
  if(ENGINE._shake && typeof applyShake === 'function') applyShake();
  if(W.dome){ W.dome.position.set(cam.position.x, -20, cam.position.z); W.stars.position.set(cam.position.x, 0, cam.position.z); }
}

/* ---------- the HUD inside the car ---------- */
function mountHUD(){
  let el = document.getElementById('car-hud');
  if(!el){ el = V12.el('div', '', ''); el.id = 'car-hud'; document.getElementById('game-root').appendChild(el); }
  const touch = document.body.classList.contains('touch-active');
  const key = k => touch ? '' : `<span class="ck">${k}</span>`;
  el.innerHTML = `
    <svg class="car-frame" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id="cfDash" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#16181d"/><stop offset="1" stop-color="#050608"/></linearGradient>
        <linearGradient id="cfRoof" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#07080b"/><stop offset="1" stop-color="#101217"/></linearGradient></defs>
      <path d="M0 0 H1000 V44 Q500 66 0 44 Z" fill="url(#cfRoof)"/>
      <path d="M0 0 H62 L14 640 L0 700 Z" fill="#0a0b0e"/><path d="M1000 0 H938 L986 640 L1000 700 Z" fill="#0a0b0e"/>
      <path d="M0 846 Q500 776 1000 846 V1000 H0 Z" fill="url(#cfDash)"/>
      <path d="M0 846 Q500 776 1000 846" fill="none" stroke="rgba(216,166,74,.18)" stroke-width="2"/>
      <path d="M600 880 Q760 862 920 880 L930 960 Q760 950 596 960 Z" fill="rgba(255,255,255,.035)"/>
    </svg>
    <div class="car-mirror"><i></i></div>
    <div class="car-wheel"></div>
    <div class="car-gauge" id="car-gauge"><div class="cg-bar"><i class="cg-z cg-c"></i><i class="cg-z cg-g"></i><i class="cg-z cg-f"></i><i class="cg-z cg-l"></i><b class="cg-tgt" id="cg-tgt"></b><b class="cg-me" id="cg-me"></b></div>
      <div class="cg-txt"><span id="cg-d">—</span><span id="cg-t"></span></div></div>
    <div class="car-say" id="car-say"><b id="car-who">SGT. UCHE</b><span id="car-line"></span></div>
    <div class="car-ctl" id="car-ctl">
      <button data-c="back">${key('S')}<span class="cl">BACK OFF</span></button><button data-c="closer">${key('W')}<span class="cl">CLOSER</span></button>
      <i class="car-sep"></i>
      <button data-c="laneL">${key('A')}<span class="cl">◀ LANE</span></button><button data-c="laneR">${key('D')}<span class="cl">LANE ▶</span></button>
      <i class="car-sep"></i>
      <button data-c="photo" class="cam">${key('SPACE')}<span class="cl">PHOTO</span></button>
    </div>
    <div class="car-dec" id="car-dec"></div>
    <div class="car-photo" id="car-photo"></div>
    <div class="car-tip" id="car-tip"></div>`;
  el.classList.add('show');
  el.querySelectorAll('#car-ctl button').forEach(b => {
    b.addEventListener('click', e => { e.stopPropagation(); control(b.dataset.c); });
    b.addEventListener('touchstart', e => { e.stopPropagation(); }, { passive:true });
  });
}
function tip(){
  const el = document.getElementById('car-tip'); if(!el) return;
  const touch = document.body.classList.contains('touch-active');
  el.innerHTML = touch ? '<b>CLOSER</b> and <b>BACK OFF</b> tell Uche how near to sit. <b>LANE</b> hides you behind other cars. <b>PHOTO</b> when his plate is under a light. Keep the eye empty.'
    : '<b>W / S</b> — tell Uche to close up or back off · <b>A / D</b> — change lanes · <b>SPACE</b> — photograph his plate when it\'s lit. Keep the eye empty.';
  el.classList.add('show'); setTimeout(()=>el.classList.remove('show'), 9000);
}
function updateGauge(d, p){
  const lostD = p.lost, pc = v => (100*clamp(v/lostD, 0, 1)).toFixed(1) + '%';
  const g = document.getElementById('car-gauge'); if(!g) return;
  g.style.setProperty('--c', pc(p.close)); g.style.setProperty('--g', pc(p.good)); g.style.setProperty('--f', pc(lostD*0.75));
  const me = document.getElementById('cg-me'), tg = document.getElementById('cg-tgt');
  if(me) me.style.left = pc(C.jHidden ? lostD : d); if(tg) tg.style.left = pc(C.target);
  const dEl = document.getElementById('cg-d'), tEl = document.getElementById('cg-t');
  const parked = !!C.calls.final;
  const band = C.jHidden ? 'gone' : parked ? 'gone' : d < p.close ? 'close' : d <= p.good ? 'good' : d > lostD*0.75 ? 'lost' : 'far';
  if(dEl){ dEl.textContent = C.jHidden ? 'OUT OF SIGHT' : parked ? 'HE HAS PARKED' : `${Math.round(d)} m · ${{ close:'TOO CLOSE', good:'GOOD', far:'FAR', lost:'LOSING HIM' }[band]}`; dEl.dataset.band = band; }
  if(me) me.style.opacity = parked ? 0 : 1;
  if(tEl) tEl.textContent = C.cruise != null || C.stopAt != null ? '' : `UCHE HOLDS ${C.target} m`;
  const ctl = document.getElementById('car-ctl');
  if(ctl){ const one = seg(C.sU) === 'C' || seg(C.sU) === 'J'; ctl.classList.toggle('one-lane', one); ctl.classList.toggle('locked', C.phase !== 'tail' || C.over || C.stopAt != null || C.cruise != null); }
}

/* ---------- the result ---------- */
const HEAD = { clean:'HE NEVER SAW YOU', burned:'HE MADE THE TAIL', lost:'HE GOT AWAY' };
function showResult(){
  let ov = document.getElementById('screen-car');
  if(!ov){ ov = V12.el('div', 'overlay', ''); ov.id = 'screen-car'; document.getElementById('game-root').appendChild(ov); }
  const tier = V12.ucheTier(), o = C.outcome;
  const pct = C.total > 1 ? Math.round(100*C.sweet/C.total) : 0, closest = C.closest < 900 ? Math.round(C.closest) : '—';
  const sub = o === 'clean' ? (C.back ? 'Akintola Close — and the back gate that opens at nine.' : 'Akintola Close. You know the street he went to.')
    : o === 'burned' ? 'He knows somebody followed him. So will the house on Akintola Close.' : 'You know he was heading for Ekosodin. Nothing more.';
  const callTxt = {
    danfo:{ around:'Went around the danfo', wait:'Waited behind the danfo' },
    light:{ run:'Ran the red light', stop:'Stopped at the red light', through:'Followed him through on amber' },
    turn:{ left:'Called LEFT at the junction', straight:'Called STRAIGHT ON — wrong', right:'Called RIGHT — wrong' },
    cp:{ badge:'Showed the badge at the checkpoint', civilian:'Played civilian at the checkpoint', bribe:'Paid ₦500 at the checkpoint' },
    final:{ past:'Drove past the close', stop:'Stopped short, lights off', foot:'Followed him on foot' },
  };
  const calls = ['danfo', 'light', 'turn', 'cp', 'final'].filter(k => C.calls[k] && callTxt[k][C.calls[k]]).map(k => `<li class="${(k === 'turn' && C.calls[k] !== 'left') || (k === 'cp' && C.calls[k] === 'bribe') || (k === 'light' && C.calls[k] === 'run') ? 'bad' : ''}">${callTxt[k][C.calls[k]]}</li>`).join('');
  const closing = o === 'clean' ? (tier === 'low' ? 'Clean. I\'ll give you that.' : C.calls.cp === 'bribe' ? 'Clean tail. Dirty checkpoint. We will talk about that another day.' : 'That was clean, sir. Like a professional.')
    : o === 'burned' ? (tier === 'high' ? 'It happens to everybody once. Not twice.' : 'Now they know a car followed him. Think about what that means for the boy in that house.')
    : 'We\'ll find the house the slow way. We always do.';
  const face = typeof paintedPortrait === 'function' ? paintedPortrait('SGT. UCHE', o === 'clean' ? null : 'evasive') : null;
  ov.innerHTML = `<div class="overlay-bg"></div><div class="carr-frame">
    <div class="plan-k">CASE 07½ · THE ENGINEER'S CAR</div>
    <div class="carr-h carr-${o}">${HEAD[o]}</div>
    <div class="carr-sub">${V12.esc(sub)}</div>
    <div class="carr-grid">
      <div><b>${pct}%</b><span>of the drive at the right distance</span></div>
      <div><b>${closest}${closest === '—' ? '' : ' m'}</b><span>closest you got</span></div>
      <div><b>${Math.round(C.peak*100)}%</b><span>how close he came to spotting you</span></div>
      <div><b>${C.plate ? 'BEN 417 KJ' : '—'}</b><span>his plate</span></div>
    </div>
    ${calls ? `<ul class="carr-calls">${calls}</ul>` : ''}
    <div class="carr-uche">${face ? `<img src="${face}" alt="">` : ''}<p>“${V12.esc(closing)}”</p></div>
    <div class="carr-actions"><button class="btn ghost" id="carr-retry">TRY THE TAIL AGAIN</button><button class="btn primary" id="carr-go">ON TO EKOSODIN ▶</button></div>
  </div>`;
  ov.querySelector('#carr-go').onclick = ()=>{ commit(); teardown(); showOverlay(null); showHUD(false); titleCard(['EKOSODIN', 'AKINTOLA CLOSE · 21:05'], 2400, ()=>loadMission('m8')); };
  ov.querySelector('#carr-retry').onclick = ()=>{ V12.log('car_retry', { outcome:o }); teardown(); showOverlay(null); V12._fromHub = MID; loadMission(MID); };
  showOverlay('screen-car');
  if(o === 'clean' && typeof sfxComplete === 'function') sfxComplete();
}
function commit(){
  const r = { outcome:C.outcome, plate:!!C.plate, danfo:C.calls.danfo || null, light:C.calls.light || null, turn:C.calls.turn || null, checkpoint:C.calls.cp || null, final:C.calls.final || null,
    house:!!C.house, back:!!C.back, peak:Math.round(C.peak*100), sweet:C.total > 1 ? Math.round(100*C.sweet/C.total) : 0, at:Date.now() };
  V12.mem().car = r;
  const e = C.eff;
  if(r.outcome === 'clean') e.agencyFavour += 2;
  if(r.outcome === 'burned') e.heat += 8;
  if(r.checkpoint === 'civilian') e.integrity += 1;
  applyEffect({ integrity:e.integrity, publicTrust:e.publicTrust, agencyFavour:e.agencyFavour });
  if(e.heat){ const rep = S.player.reputation; rep.underworldHeat = clamp((rep.underworldHeat == null ? 20 : rep.underworldHeat) + e.heat, 0, 100); }
  if(r.back){ S.game.flags.backgate_tip = true; if(!S.game.flags.backgate_src) S.game.flags.backgate_src = 'car'; }
  awardXP(r.outcome === 'clean' ? 220 : r.outcome === 'burned' ? 80 : 100);
  V12.log('car', r); V12.log('mission_end', { m:MID });
  completeMission(MID, { silent:true });
}

/* ---------- in and out of the car ---------- */
function beginCar(){
  S.game._opEv = [];
  S.game._opStart = { arrests:S.game.arrests || 0, civ:S.game.civiliansRescued || 0, force:S.game.forceUsed || 0, intel:S.game.intelScore || 0, xp:S.player.xp || 0, rep:Object.assign({}, S.player.reputation) };
  S.game._opBumps = 0;
  if(typeof fadeIn === 'function') fadeIn();
  if(typeof resetGuidance === 'function') resetGuidance();
  S.game.currentMission = MID; S.game.flags = S.game.flags || {};
  showOverlay(null); showHUD(true); ENGINE.movementEnabled = false;
  setMissionTitle("The Engineer's Car");
  setObjectives([{ id:'c1_go', text:'Pull out after the black jeep' }, { id:'c2_stay', text:'Stay with him. Don\'t let him see you' }, { id:'c3_where', text:'See where he goes' }]);
  setEvidenceMax(1);
  S.game.currentRegion = 'Edo'; S.game.currentSubregion = 'Ugbowo · 20:40';
  buildWorld();
  W.officers = W.officers || []; X.officer = W.officers[0] || null;
  setLight('green');
  resetRun();
  spawnCars();
  placeJeep(); updateUs(0); updateCam(0.016);
  mountHUD();
  document.body.classList.add('v12-car');
  ENGINE.sceneAlways = tickCar;
  if(typeof stopAmbient === 'function') stopAmbient();
  snd('carStart');
  if(typeof playMusic === 'function') playMusic('stealth', { volume:0.4 });
  V12.log('mission_start', { m:MID });
}
function teardown(){
  if(!C.active) return;
  C.active = false;
  document.body.classList.remove('v12-car');
  const h = document.getElementById('car-hud'); if(h) h.classList.remove('show', 'deciding');
  if(typeof setEye === 'function') setEye(null);
  snd('carStop');
  TR.length = 0; XT.length = 0;
}
V12.wrap('newScene', orig => function(){ teardown(); return orig.apply(this, arguments); });
V12.wrap('showOverlay', orig => function(id){ if(id === 'screen-title' && C.active) teardown(); return orig.apply(this, arguments); });
V12.wrap('loadMission', orig => function(id){
  if(id !== MID) return orig.apply(this, arguments);
  // the field office comes first, the evening after the tower
  const hub = V12.HUB_BEFORE && V12.HUB_BEFORE[MID];
  if(hub && V12.hubDone && !V12.hubDone(hub) && (S.game.completedMissions || []).includes('m7')) return orig.apply(this, arguments);
  const fromHub = V12._fromHub === MID; V12._fromHub = null;
  S.game.currentMission = MID; S.game.alertLevel = 0;
  showHUD(false); ENGINE.movementEnabled = false; showOverlay(null);
  if(fromHub) beginMission(MID);
  else titleCard(['UGBOWO JUNCTION', 'THE FILLING STATION · 20:40'], 2400, ()=>beginMission(MID));
});
V12.wrap('beginMissionCore', orig => function(id){
  if(id === MID) return beginCar();
  const r = orig.apply(this, arguments);
  if(id === 'm8'){
    const c = V12.mem().car;
    if(c && c.outcome === 'burned'){ S.game._finWarned = true; setTimeout(()=>{ if(S.game.currentMission === 'm8') toast('THE HOUSE IS AWAKE', 'The Engineer made the tail. They know somebody is coming.', 3200); }, 2200); }
  }
  return r;
});
document.addEventListener('keydown', e => {
  if(!C.active || isOverlayOpen() || e.repeat) return;
  const k = e.code;
  if(C.decision){
    const n = /^(?:Digit|Numpad)([1-4])$/.exec(k);
    if(n){ const o = C.decision.opts[+n[1] - 1]; if(o){ e.preventDefault(); resolveDecision(o.k); } }
    return;
  }
  const map = { KeyW:'closer', ArrowUp:'closer', KeyS:'back', ArrowDown:'back', KeyA:'laneL', ArrowLeft:'laneL', KeyD:'laneR', ArrowRight:'laneR', Space:'photo', KeyF:'photo' };
  if(map[k]){ e.preventDefault(); control(map[k]); }
}, true);

/* ---------- Case 08 remembers the car ---------- */
V12.wrap('startDialogue', orig => function(key){
  const c = V12.mem().car;
  if(c && typeof key === 'string' && /^fin_brief_(hold|tail|call)$/.test(key) && DIALOGUE[key]){
    const hold = key === 'fin_brief_hold';
    const line = c.outcome === 'burned' ? 'He made us on the road, sir. Whatever is in that house, they know a car followed the Engineer.'
      : c.outcome === 'lost' ? 'We lost the jeep, sir. So we do this the slow way.'
      : hold ? 'The Engineer parked at the mouth of this close and walked in. He never saw us. Same house, sir — I would bet my pension.'
      : 'The Engineer parked at the mouth of this close and walked in. He never saw us. The house is down there somewhere.';
    DIALOGUE[key + '_car'] = [{ speaker:'SGT. UCHE', portrait:'sergeant', mood:c.outcome === 'clean' ? undefined : 'evasive', text:line }].concat(DIALOGUE[key]);
    const args = Array.prototype.slice.call(arguments); args[0] = key + '_car';
    return orig.apply(this, args);
  }
  return orig.apply(this, arguments);
});
/* how you handled the tail goes into how Uche sees you */
const _trust = V12.ucheTrust;
if(typeof _trust === 'function') V12.ucheTrust = function(){
  let t = _trust.apply(this, arguments); const c = V12.mem().car;
  if(c){ if(c.checkpoint === 'bribe') t -= 10; if(c.checkpoint === 'civilian') t += 2; if(c.light === 'run') t -= 2; if(c.outcome === 'clean') t += 4; }
  return clamp(Math.round(t), 0, 100);
};

/* ---------- test hooks ---------- */
V12.carDebug = {
  speed:1,
  state:()=>({ active:C.active, phase:C.phase, t:+(C.t || 0).toFixed(1), sU:+(C.sU || 0).toFixed(1), sJ:+(C.sJ || 0).toFixed(1), d:+((C.sJ - C.sU) || 0).toFixed(1),
    vU:+(C.vU || 0).toFixed(1), vJ:+(C.vJ || 0).toFixed(1), laneU:C.laneU, laneJ:C.laneJ, latU:+(C.latU || 0).toFixed(2), latJ:+(C.latJ || 0).toFixed(2), susp:+(C.susp || 0).toFixed(2),
    target:C.target, decision:C.decision ? C.decision.id : null, over:C.over, outcome:C.outcome, plate:C.plate, light:W.lightState, seg:R.n ? seg(C.sU) : null,
    say:C.say, sayT:+(C.sayT || 0).toFixed(2), sayPri:C.sayPri, photoT:+(C.photoT || 0).toFixed(2), sayEl:(document.getElementById('car-say') || {}).className,
    lit:R.n ? jeepLit() : null, hidden:C.jHidden, look:!!(C.ev && C.ev.look), engr:!!(X.engr && X.engr.visible), boy:!!(X.boy && X.boy.visible), traffic:TR.length, calls:Object.assign({}, C.calls), K:R.K, len:R.len }),
  choose:k => resolveDecision(k), control, set:o => Object.assign(C, o), finish:()=>{ const b = document.getElementById('carr-go'); if(b) b.click(); },
};

})();
