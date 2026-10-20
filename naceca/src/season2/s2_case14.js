/* =========================================================================
   NACECA · v13 Case 14 — FRN v. Edafe & 2 Ors
   Federal High Court, Abuja Division, Court 5. The trial itself is run by
   V13.court (v13_court.js); this file stages it: the baked courtroom, the
   judge, the registrar, the bar, the dock, the witness box and a full
   gallery, people who walk where the trial sends them, and a camera that
   cuts to whoever is speaking (TPCAM.override) while the fans turn.
   ========================================================================= */
(function(){
'use strict';
const V13 = window.V13, MC = V13.mc;
const KEY = 'court';
const PI = Math.PI;
const V3 = (x, y, z)=>new THREE.Vector3(x, y, z);
const fast = ()=>!!(V13.court && V13.court.fast);

/* ---------- where everyone belongs ---------- */
const faceJudge = (x, z)=>Math.atan2(0 - x, -9.4 - z);
const P0 = {
  judge:{ x:0, y:1.02, z:-9.42, rot:0 },
  registrar:{ x:0, y:0, z:-6.95, rot:0 },
  usher:{ x:-2.75, y:0, z:-6.35, rot:0.35 },
  box:{ x:-5.6, y:0.4, z:-4.6, rot:PI / 2 },
  danladi:{ x:-3.0, y:0, z:-1.75, rot:PI }, okoro:{ x:-4.2, y:0, z:-1.75, rot:PI },
  san:{ x:3.0, y:0, z:-1.75, rot:PI }, akande:{ x:4.2, y:0, z:-1.75, rot:PI }, abara:{ x:2.0, y:0, z:-1.75, rot:PI },
  bello:{ x:3.55, y:0, z:-0.7, rot:PI }, nwosu:{ x:4.45, y:0, z:-0.75, rot:PI },
  dock1:{ x:5.4, y:0, z:-1.15 }, dock2:{ x:6.2, y:0, z:-1.15 }, dock3:{ x:7.0, y:0, z:-1.15 },
  kelSeat:{ x:-2.25, y:0, z:3.8, rot:PI }, ucheSeat:{ x:-3.28, y:0, z:3.8, rot:PI },
  conf:{ x:-0.5, y:0, z:0.05 }, confDan:{ x:-1.95, y:0, z:-1.2 },
};
['dock1', 'dock2', 'dock3'].forEach(k => { P0[k].rot = faceJudge(P0[k].x, P0[k].z); });
/* the judge comes in up the east steps and along the back of the bench */
const JUDGE_IN = [[6.1, 0, -8.1], [5.37, 0.3, -8.1], [5.07, 0.6, -8.1], [4.72, 0.9, -8.75], [0.75, 0.9, -8.8], [0, 1.02, -9.42]];
/* into the witness box by its steps (north-west corner) */
const BOX_IN = [[-6.0, 0, -6.35], [-6.05, 0.4, -5.2], [-5.6, 0.4, -4.6]];
const BOX_OUT = [[-6.05, 0.4, -5.2], [-6.0, 0, -6.35], [-4.6, 0, -6.6]];

/* ---------- looks ---------- */
const BLACK = '#141414', WIG = '#dcdad2';
const gown = (id, extra)=>V13.look(id, Object.assign({ gear:['Gear_Kaftan'], robe:BLACK, hips:BLACK, thigh:BLACK, shin:BLACK }, extra || {}));
const LOOKS = {
  judge:()=>gown('judge', { gear:['Gear_Kaftan', 'Gear_Glasses'], hair:'#eceae4' }),
  registrar:()=>V13.look('registrar', { gear:['Gear_F_Bun'] }),
  usher:()=>V13.look('usher', { gear:['Gear_Beret'], beret:'#1a2238', cap:'#1a2238' }),
  danladi:()=>V13.look('hauwa', { gear:['Gear_F_Bun'], hair:WIG, skirt:BLACK, hips:BLACK, thigh:BLACK }),
  okoro:()=>gown('kuti', { hair:WIG, skin:'#4e2f20' }),
  san:()=>gown('san', { hair:'#eeece6' }),
  akande:()=>gown('kuti', { hair:WIG, skin:'#5a3826' }),
  bello:()=>gown('kuti', { hair:WIG, skin:'#3e2418' }),
  nwosu:()=>V13.look('abara', { gear:['Gear_F_Bun'], hair:WIG, skirt:BLACK, hips:BLACK, thigh:BLACK, skin:'#4e2e1e' }),
  abara:()=>V13.look('abara', { gear:['Gear_F_Bun'], hair:WIG, skirt:BLACK, hips:BLACK, thigh:BLACK }),
  lucky:()=>V13.look('lucky'), felix:()=>V13.look('felix'), sotonye:()=>V13.look('sotonye'),
  tobi:()=>V13.look('tobi', { torso:'#d9dde6', armA:'#d9dde6', armB:'#d9dde6', armC:'#d9dde6', gear:['Gear_Glasses'] }),
  igbinosa:()=>V13.look('igbinosa'), ikpe:()=>V13.look('ikpe'),
  ejiro:()=>V13.look('ejiro', { torso:'#2a3a5a', armA:'#2a3a5a', armB:'#2a3a5a', armC:'#2a3a5a' }),
  agbada:()=>({ body:'M', skin:'#4a2b1c', hair:'#0c0a09', torso:'#1d1d26', armA:'#1d1d26', armB:'#1d1d26', armC:'#1d1d26', hips:'#1d1d26', thigh:'#1d1d26', shin:'#1d1d26', shoe:'#16120e', gear:['Gear_Kaftan', 'Gear_Fila'], robe:'#1d1d26', cap:'#1d1d26', res:256 }),
};
const FEMALE = { registrar:1, danladi:1, nwosu:1, abara:1, sotonye:1 };
function suit(){
  if(!(typeof ART !== 'undefined' && ART.ready && typeof PEOPLE !== 'undefined')) return buildPlayerMesh();
  const c = '#1e2638';
  const k = PEOPLE.make('kelechi', { gear:[], vest:null, text:null, torso:c, armA:c, armB:c, armC:c, hips:c, thigh:c, shin:c, shoe:'#0e0e10' });
  k.userData.isPlayer = true; return k;
}

/* ---------- the stage ---------- */
const ST = { P:{}, movers:[], shot:null, base:null, look:null, t:0, lastCounsel:'danladi', lastSpeaker:null, talking:null, gallery:[], back:[], seated:{} };
const RT = ()=>V13.rt;
function put(id, at, base, opt){
  opt = opt || {};
  let P = ST.P[id];
  if(!P){
    const look = opt.look || (LOOKS[id] ? LOOKS[id]() : {});
    const ch = opt.kind ? V13.person({}, at, { kind:opt.kind, clip:base, solid:false }) : V13.person(look, at, { clip:base, solid:false });
    P = ST.P[id] = { id, ch, base, f:!!(FEMALE[id] || opt.f), h:opt.h || (FEMALE[id] || opt.f ? 1.52 : 1.62), where:opt.where || 'floor' };
  }
  P.ch.visible = true;
  place(P, at, base, opt.where);
  return P;
}
function place(P, at, base, where){
  ST.movers = ST.movers.filter(m => m.P !== P);              // a walk cut short by the camera must not carry on
  P.ch.position.set(at.x, at.y || 0, at.z); if(at.rot != null) P.ch.rotation.y = at.rot;
  if(base) P.base = base;
  if(where) P.where = where;
  clip(P, P.base);
}
function clip(P, c){ if(P && P.ch) V13.play(P.ch, c, { fade:0.3 }); P.cur = c; }
const hide = id => { const P = ST.P[id]; if(P){ P.ch.visible = false; P.where = 'gone'; } };
const seated = P => P.base === 'sit' || P.base === 'sit_talk';
function head(P){
  const c = P.ch.position; return V3(c.x, c.y + (seated(P) ? P.h - 0.44 : P.h), c.z);
}
const HEAD = {
  judge:()=>V3(0, 2.22, -9.42),
  well:()=>V3(0, 1.4, -2.5),
  gallery:()=>V3(0, 1.1, 6.0),
};

/* walking: point lists [x, y, z]; the last point's facing is opt.face */
function walk(id, pts, opt){
  opt = opt || {};
  const P = ST.P[id]; if(!P) return Promise.resolve();
  if(fast() || !P.ch.visible || !pts.length){
    const e = pts[pts.length - 1]; if(e) P.ch.position.set(e[0], e[1], e[2]);
    if(opt.face != null) P.ch.rotation.y = opt.face;
    if(opt.end) P.base = opt.end; clip(P, P.base);
    return Promise.resolve();
  }
  ST.movers = ST.movers.filter(m => m.P !== P);
  return new Promise(res => {
    ST.movers.push({ P, pts:pts.map(p => V3(p[0], p[1], p[2])), i:0, speed:opt.speed || 1.45, res, end:opt.end, face:opt.face });
    clip(P, 'walk');
  });
}
function moveStep(dt){
  for(let k = ST.movers.length - 1; k >= 0; k--){
    const m = ST.movers[k], ch = m.P.ch;
    let step = m.speed * dt;
    while(step > 0 && m.i < m.pts.length){
      const b = m.pts[m.i], dx = b.x - ch.position.x, dz = b.z - ch.position.z, dy = b.y - ch.position.y, d = Math.hypot(dx, dz);
      if(d <= step){ ch.position.copy(b); step -= d; m.i++; }
      else { const f = step / d; ch.position.x += dx * f; ch.position.z += dz * f; ch.position.y += dy * f; ch.rotation.y = Math.atan2(dx, dz); step = 0; }
    }
    if(m.i >= m.pts.length){
      if(m.face != null) ch.rotation.y = m.face;
      if(m.end) m.P.base = m.end; clip(m.P, m.P.base);
      ST.movers.splice(k, 1); m.res();
    }
  }
}
const wait = ms => new Promise(r => setTimeout(r, fast() ? 0 : ms));

/* ---------- the camera ---------- */
function shot(pos, look, opt){
  opt = opt || {};
  const p = pos.isVector3 ? pos.clone() : V3(pos[0], pos[1], pos[2]), l = look.isVector3 ? look.clone() : V3(look[0], look[1], look[2]);
  const cut = opt.cut !== false && (!ST.base || ST.base.distanceTo(p) > 0.4 || ST.look.distanceTo(l) > 0.5);
  ST.base = p; ST.look = l; ST.t = 0; ST.drift = opt.drift == null ? 0.022 : opt.drift;
  TPCAM.override = { pos:p.clone(), look:l.clone() };
  if(cut) TPCAM.cur = null;
}
/* frame a person as seen from the direction of whoever they are talking to */
function toward(P, target, opt){
  opt = opt || {};
  const h = head(P), t = target.isVector3 ? target : V3(target[0], target[1], target[2]);
  const d = V3(t.x - h.x, 0, t.z - h.z); const len = d.length() || 1; d.divideScalar(len);
  const side = V3(-d.z, 0, d.x).multiplyScalar(opt.side == null ? 0.42 : opt.side);
  const dist = Math.min(opt.dist || 2.25, Math.max(1.2, len - 0.5));
  const pos = h.clone().addScaledVector(d, dist).add(side).add(V3(0, opt.dy == null ? 0.07 : opt.dy, 0));
  // aim below the eyes so the face sits in the upper third, clear of the dialogue box
  const look = h.clone().add(V3(0, -0.06 - 0.14 * dist, 0)).addScaledVector(side, -0.25);
  shot(pos, look, opt);
}
const SH = {
  est:()=>shot([0, 3.0, 11.2], [0, 1.6, -5]),
  side:()=>shot([7.6, 2.9, 3.6], [-2, 1.0, -5]),
  west:()=>shot([-8.1, 2.7, 0.6], [2.5, 1.0, -3.0]),
  bench:()=>shot([1.55, 2.75, -9.5], [-2.2, 1.1, -2.2]),
  benchWide:()=>shot([2.7, 1.95, -2.4], [0.4, 1.7, -9.2]),
  rise:()=>shot([0.6, 2.25, -1.4], [-0.6, 1.25, 5.8]),
  judge:()=>shot([0.75, 2.0, -6.0], [0, 2.02, -9.42]),
  judgeLow:()=>shot([-0.9, 1.9, -6.05], [0, 2.08, -9.42]),
  boxWide:()=>shot([-2.15, 2.55, -1.5], [-5.6, 1.45, -4.9]),
  dockAll:()=>shot([3.95, 2.15, -4.4], [6.2, 1.25, -1.15]),
  bar:()=>shot([0.2, 2.2, -5.4], [0, 1.2, -1.2]),
  door:()=>shot([1.6, 1.85, 7.8], [-0.2, 1.45, 10.6]),
  aisle:()=>shot([1.7, 2.45, -2.9], [-0.9, 1.15, 2.4]),
  galleryKel:()=>shot([-1.15, 1.42, 1.95], [-2.25, 1.18, 3.8]),
};
/* who is talking to whom */
const WHO2ID = { JUDGE:'judge', REGISTRAR:'registrar', USHER:'usher', DANLADI:'danladi', SAN:'san', 'LEGAL AID':'abara', KELECHI:'kelechi',
  LUCKY:'lucky', FELIX:'felix', SOTONYE:'sotonye', EJIRO:'ejiro', TOBI:'tobi', IGBINOSA:'igbinosa', IKPE:'ikpe', UCHE:'uche' };
const COUNSEL = ['danladi', 'san', 'abara'];
const inBox = ()=>Object.values(ST.P).find(P => P.where === 'box' && P.ch.visible);
const toBench = text => /^(My Lord|May it please|I most humbly|With respect, my Lord)/i.test(text);
function frame(line){
  const who = line._who, text = line.text || '';
  if(line._shot){ (SH[line._shot] || SH.est)(); return; }
  if(who === 'NACECA SYSTEM'){ narrate(text); return; }
  if(who === 'USHER' && ST.mode === 'court'){ SH.rise(); return; }
  const P = ST.P[WHO2ID[who]];
  if(!P || !P.ch.visible || P.where === 'gone'){ SH.side(); return; }
  const box = inBox();
  if(who === 'JUDGE'){
    if(walking(P)){ SH.benchWide(); return; }
    if(/\{?Exhibit P\d+|rejected|Excluded|Sustained|Overruled|^Ruling|guilty|sentenced|discharged/i.test(text)) SH.judgeLow(); else SH.judge();
    return;
  }
  if(P.where === 'conf' || P.where === 'corridor'){ const o = partner(P); toward(P, o ? head(o) : HEAD.gallery(), { dist:1.5, side:0.42 }); return; }
  if(P.where === 'registrar'){ toward(P, V3(4.0, 1.4, -1.5), { dist:2.0, side:0.3, dy:0.12 }); return; }
  if(P.where === 'usher'){ toward(P, HEAD.gallery(), { dist:2.1, side:0.35 }); return; }
  if(P.where === 'bar'){
    if(['danladi', 'san', 'abara'].includes(P.id)) ST.lastCounsel = P.id;
    const t = (!toBench(text) && box && box !== P) ? head(box) : HEAD.judge();
    toward(P, t, { dist:2.3, side:P.id === 'danladi' ? -0.4 : 0.4, dy:0.1 });
    return;
  }
  if(P.where === 'box'){
    const asker = ST.P[ST.lastCounsel];
    const t = (ST.lastSpeaker === 'JUDGE' || !asker) ? HEAD.judge() : head(asker);
    toward(P, t, { dist:2.15, side:0.38, dy:0.08 });
    return;
  }
  if(P.where === 'dock'){ toward(P, ST.lastSpeaker === 'REGISTRAR' ? head(ST.P.registrar) : HEAD.judge(), { dist:2.0, side:0.35, dy:0.12 }); return; }
  if(P.where === 'gallery'){ toward(P, V3(P.ch.position.x + 0.6, 1.3, P.ch.position.z - 3), { dist:1.6, side:0.25, dy:0.1 }); return; }
  toward(P, HEAD.well());
}
/* narration: frame whoever the line is about, or the room */
const walking = P => ST.movers.some(m => m.P === P);
const partner = P => ST.P[P.id === 'kelechi' ? (ST.mode === 'corridor' ? ST.corridorWith : 'danladi') : 'kelechi'];
const NARR = [
  [/Justice|judge|bench|Bakare/i, ()=>{ const J = ST.P.judge; if(J && walking(J)) SH.benchWide(); else if(J && J.ch.visible) SH.judge(); else SH.bench(); }],
  [/Coker-Odusote|Senior Advocate/i, ()=>frameP(ST.P.san)],
  [/Danladi/i, ()=>frameP(ST.P.danladi)],
  [/\bUche\b/i, ()=>frameP(ST.P.uche)],
  [/\bLucky\b|first defendant/i, ()=>frameP(ST.P.lucky)],
  [/\bFelix\b|Ugbekile|second defendant/i, ()=>frameP(ST.P.felix)],
  [/\bSotonye\b|Ms\. Jumbo|third defendant/i, ()=>frameP(ST.P.sotonye)],
  [/Kelechi|second row|PW1|collar/i, ()=>frameP(ST.P.kelechi)],
  [/Igbinosa|Onuoha|Ikpe|Ejiro|PW\d/i, ()=>{ const b = inBox(); b ? frameP(b) : SH.boxWide(); }],
  [/registrar/i, ()=>frameP(ST.P.registrar)],
  [/gallery|reporters|seat|room|fans|wigs|Court 5|COURT 5/i, ()=>SH.est()],
];
function frameP(P){
  if(!P || !P.ch || !P.ch.visible || P.where === 'gone'){ SH.side(); return; }
  if(P.where === 'box'){ toward(P, ST.P[ST.lastCounsel] ? head(ST.P[ST.lastCounsel]) : HEAD.judge(), { dist:2.3, side:0.4, dy:0.1 }); return; }
  if(P.where === 'dock'){ toward(P, HEAD.judge(), { dist:2.1, side:0.35, dy:0.12 }); return; }
  if(P.where === 'gallery'){ toward(P, V3(P.ch.position.x + 0.6, 1.3, P.ch.position.z - 3), { dist:1.6, side:0.25, dy:0.1 }); return; }
  if(P.where === 'conf' || P.where === 'corridor'){ const o = partner(P); toward(P, o ? head(o) : HEAD.gallery(), { dist:1.5, side:0.42 }); return; }
  if(P.where === 'registrar'){ toward(P, V3(4.0, 1.4, -1.5), { dist:2.0, side:0.3, dy:0.12 }); return; }
  if(P.where === 'bench'){ SH.judge(); return; }
  toward(P, HEAD.judge(), { dist:2.3, side:P.id === 'danladi' ? -0.4 : 0.4, dy:0.1 });
}
/* two people talking away from the bar: a two-shot from beside them */
function twoShot(){
  const a = ST.P.kelechi, b = partner(a || {}); if(!a || !b){ SH.est(); return; }
  const ha = head(a), hb = head(b), mid = ha.clone().add(hb).multiplyScalar(0.5);
  const d = V3(hb.x - ha.x, 0, hb.z - ha.z).normalize(), n = V3(-d.z, 0, d.x);
  // of the two sides, stand on the one toward the middle of the room (never out past a wall)
  const p1 = mid.clone().addScaledVector(n, 2.6), p2 = mid.clone().addScaledVector(n, -2.6);
  const pos = Math.hypot(p1.x, p1.z) <= Math.hypot(p2.x, p2.z) ? p1 : p2;
  shot(pos.add(V3(0, 0.12, 0)), mid.clone().add(V3(0, -0.25, 0)));
}
function narrate(text){
  if(ST.mode === 'conf' || ST.mode === 'corridor'){ twoShot(); return; }
  let best = null, at = 1e9;
  for(const [re, fn] of NARR){ const m = re.exec(text); if(m && m.index < at){ at = m.index; best = fn; } }
  if(best && at < 90) best(); else if(!ST.base) SH.est(); else SH.side();
}

/* ---------- who speaks: talk, then settle back ---------- */
function onLine(line){
  if(!RT().court) return;
  try{ storyCues(line); }catch(e){}
  const who = line._who, P = ST.P[WHO2ID[who]];
  if(ST.talking && ST.talking !== P){ clip(ST.talking, ST.talking.base); ST.talking = null; }
  // counsel on their feet is whoever addressed the court last; the others sit
  if(P && P.where === 'bar' && COUNSEL.includes(P.id) && ST.mode === 'court'){
    P.base = 'idle';
    COUNSEL.forEach(id => { const Q = ST.P[id]; if(Q && Q !== P && Q.where === 'bar' && Q.base !== 'sit'){ Q.base = 'sit'; clip(Q, 'sit'); } });
  }
  if(P && P.ch.visible && who !== 'NACECA SYSTEM'){
    clip(P, seated(P) ? 'sit_talk' : 'talk'); ST.talking = P;
  }
  frame(line);
  if(who && who !== 'NACECA SYSTEM') ST.lastSpeaker = who;
}
function onChoices(p){
  if(!RT().court) return;
  const k = ST.P.kelechi;
  if(ST.talking){ clip(ST.talking, ST.talking.base); ST.talking = null; }
  if(!k) return;
  if(p.type === 'note') frameP(k);
  else if(k.where === 'box') toward(k, ST.P[ST.lastCounsel] ? head(ST.P[ST.lastCounsel]) : HEAD.judge(), { dist:1.75, side:-0.32, dy:0.06 });
  else if(k.where === 'conf') toward(k, ST.P.danladi ? head(ST.P.danladi) : HEAD.well(), { dist:1.4, side:-0.3 });
}
/* small things the text asks for */
function storyCues(line){
  const t = line.text || '';
  if(line._who === 'NACECA SYSTEM' && /dark agbada/i.test(t) && ST.P.agbada && ST.P.agbada.ch.visible){
    const a = ST.P.agbada, p = a.ch.position;
    walk('agbada', [[p.x, 0, p.z - 0.55], [1.15, 0, p.z - 0.55], [0.4, 0, 11.4], [0.2, 0, 12.6]], { speed:1.2 }).then(()=>hide('agbada'));
  }
  if(line._who === 'NACECA SYSTEM' && /winning ticket/i.test(t) && ST.P.lucky) V13.once(ST.P.lucky.ch, 'yes', ST.P.lucky.base);
  if(line._who === 'NACECA SYSTEM' && /waves at the gallery/i.test(t) && ST.P.lucky) V13.once(ST.P.lucky.ch, 'yes', ST.P.lucky.base);
}

/* ---------- populating the room ---------- */
function gallerySeats(){
  const G = V13.list(KEY, 'gallery');
  return G.filter(g => !(Math.abs(g[1] - 3.8) < 0.1 && g[0] < -1.5 && g[0] > -4.2) && !(Math.abs(g[1] - 2.5) < 0.1 && g[0] > -2.9 && g[0] < -1.3));
}
function fillGallery(n, standing){
  const seats = gallerySeats();
  ST.gallery.forEach(c => { c.visible = false; });
  let k = 0;
  seats.forEach((g, i)=>{
    if(n < seats.length && (i * 7) % seats.length >= n) return;
    let ch = ST.gallery[k];
    if(!ch){ ch = V13.person(Object.assign(V13.crowdLook(i + 3), { res:256 }), { x:g[0], y:0, z:g[1], rot:g[2] }, { clip:'sit', solid:false }); ST.gallery.push(ch); }
    ch.visible = true; ch.position.set(g[0], 0, g[1]); ch.rotation.y = g[2]; ch.userData._galBase = 'sit'; V13.play(ch, 'sit', { fade:0 });
    k++;
  });
  const back = [[-7.7, 11.25, PI], [-6.8, 11.35, PI + 0.2], [6.6, 11.3, PI - 0.15], [7.6, 11.15, PI]];
  back.forEach((b, i)=>{
    let ch = ST.back[i];
    if(!standing){ if(ch) ch.visible = false; return; }
    if(!ch){ ch = V13.person(Object.assign(V13.crowdLook(i + 17), { res:256 }), { x:b[0], y:0, z:b[1], rot:b[2] }, { clip:i % 2 ? 'folded' : 'idle', solid:false }); ST.back.push(ch); }
    ch.visible = true;
  });
}
function galleryClip(c){
  ST.gallery.forEach((ch, i)=>{ if(ch.visible) setTimeout(()=>V13.play(ch, c, { fade:0.35 }), fast() ? 0 : (i % 7) * 70); });
}
function populate(day){
  const R = RT();
  ST.movers.length = 0;
  // the bench and its officers
  put('judge', P0.judge, 'sit', { where:'bench' }); hide('judge');
  put('registrar', P0.registrar, 'sit', { where:'registrar' });
  put('usher', P0.usher, 'idle', { where:'usher' });
  // the bar: everyone seated until it is their turn
  put('danladi', P0.danladi, 'sit', { where:'bar' }); put('okoro', P0.okoro, 'sit', { where:'bar' });
  put('san', P0.san, 'sit', { where:'bar' }); put('akande', P0.akande, 'sit', { where:'bar' }); put('abara', P0.abara, 'sit', { where:'bar' });
  put('bello', P0.bello, 'idle', { where:'bar' }); put('nwosu', P0.nwosu, 'folded', { where:'bar' });
  // the dock
  put('lucky', P0.dock1, 'sit', { where:'dock' }); put('felix', P0.dock2, 'sit', { where:'dock' }); put('sotonye', P0.dock3, 'sit', { where:'dock' });
  // the second row: the investigating officer and his sergeant
  const k = ST.P.kelechi; k.ch.visible = true;
  if(day === 2) place(k, P0.box, 'idle', 'box'); else place(k, P0.kelSeat, 'sit', 'gallery');
  if(!ST.P.uche) ST.P.uche = { id:'uche', ch:V13.person({}, P0.ucheSeat, { kind:'uche', clip:'sit', solid:false }), base:'sit', h:1.66, where:'gallery' };
  place(ST.P.uche, P0.ucheSeat, 'sit', 'gallery'); ST.P.uche.ch.visible = true;
  ['tobi', 'igbinosa', 'ikpe', 'ejiro'].forEach(hide);
  // the gallery fills up as the reporters hear about it
  fillGallery(day === 1 ? 22 : 99, day >= 4);
  if(day === 3 || day === 1){
    const a = put('agbada', { x:5.99, y:0, z:10.3, rot:PI }, 'sit', { where:'gallery' }); a.ch.visible = true;
  } else hide('agbada');
  ST.talking = null; ST.lastCounsel = 'danladi'; ST.lastSpeaker = null; ST.mode = 'court';
  SH.est();
  R.court = true;
}

/* ---------- the trial's cues ---------- */
const stage = {
  onLine, onChoices,
  cue(name, arg){
    switch(name){
      case 'day': populate(arg); return;
      case 'allrise':
        SH.rise(); galleryClip('idle');
        ['danladi', 'okoro', 'san', 'akande', 'abara', 'lucky', 'felix', 'sotonye', 'kelechi', 'uche'].forEach(id => { const P = ST.P[id]; if(P && P.ch.visible && P.where !== 'box' && P.where !== 'gone') clip(P, 'idle'); });
        return;
      case 'judge_in': {
        const J = ST.P.judge; if(!J || J.ch.visible) return;
        J.ch.visible = true; J.where = 'bench'; J.base = 'sit'; J.ch.position.set(JUDGE_IN[0][0], JUDGE_IN[0][1], JUDGE_IN[0][2]);
        if(!fast()) SH.benchWide();
        return walk('judge', JUDGE_IN.slice(1), { speed:1.7, end:'sit', face:0 });
      }
      case 'sitdown': {
        const J = ST.P.judge;
        if(J && walking(J)){ ST.movers = ST.movers.filter(m => m.P !== J); place(J, P0.judge, 'sit', 'bench'); }
        galleryClip('sit');
        Object.values(ST.P).forEach(P => { if(P.ch.visible && P !== ST.talking) clip(P, P.base); });
        return;
      }
      case 'rise_out': {
        galleryClip('idle');
        const J = ST.P.judge; if(J && J.ch.visible){ J.base = 'idle'; walk('judge', JUDGE_IN.slice(0, -1).reverse(), { speed:1.5 }).then(()=>hide('judge')); }
        return;
      }
      case 'dock': {
        ['lucky', 'felix', 'sotonye'].forEach((id, i)=>{ const P = ST.P[id]; if(!P || P.where !== 'dock') return; P.base = (arg && arg.stand && arg.d === i + 1) ? 'idle' : 'sit'; clip(P, P.base); });
        return;
      }
      case 'pw1_in': return toBox('kelechi', 'gallery');
      case 'pw1_out': return fromBox('kelechi');
      case 'witness_in': {
        const w = arg || {};
        if(w.from === 'dock') return toBox(w.id, 'dock');
        put(w.id, { x:BOX_IN[0][0], y:0, z:BOX_IN[0][2], rot:PI / 2 }, 'idle', { where:'floor' });
        return toBox(w.id, 'near');
      }
      case 'witness_out': return fromBox((arg || {}).id);
      case 'twt_in': return toBox(arg === 'car' ? 'kelechi' : 'lucky', arg === 'car' ? 'gallery' : 'dock');
      case 'uche_in': return fromBox('lucky').then(()=>toBox('uche', 'gallery'));
      case 'uche_out': return fromBox('uche');
      case 'twt_out': { const b = inBox(); return b ? fromBox(b.id) : null; }
      case 'defence_in': return toBox('lucky', 'dock');
      case 'defence_out': return fromBox('lucky');
      case 'verdict': {
        const P = ST.P[{ d1:'lucky', d2:'felix', d3:'sotonye' }[arg.d]];
        if(P && P.where === 'dock'){ P.base = 'idle'; clip(P, 'idle'); setTimeout(()=>V13.once(P.ch, arg.guilty ? 'no' : 'yes', 'idle'), 900); }
        return;
      }
      case 'corridor': return corridor('san');
      case 'close': return corridor('danladi');
      case 'interlude': return interlude(arg);
      case 'end': return end();
    }
  },
};
/* into the witness box: a few steps where they are, a cut, the last steps into the box */
async function toBox(id, from){
  const P = ST.P[id]; if(!P) return;
  ST.movers = ST.movers.filter(m => m.P !== P);
  if(typeof cinematic === 'function') cinematic(true);
  if(from === 'gallery'){
    const p = P.ch.position;
    clip(P, 'idle'); SH.aisle();
    await wait(250);
    await Promise.race([walk(id, [[p.x, 0, p.z - 0.55], [-1.0, 0, p.z - 0.55], [-0.45, 0, 1.25], [-0.9, 0, 0.2]], { speed:1.6 }), wait(2600)]);
  } else if(from === 'dock'){
    const p = P.ch.position;
    SH.dockAll();
    await wait(200);
    await Promise.race([walk(id, [[p.x, 0, -1.0], [7.75, 0, -0.85], [7.8, 0, 0.1]], { speed:1.4 }), wait(2300)]);
  }
  // the last steps, seen from the well
  P.ch.position.set(BOX_IN[0][0], BOX_IN[0][1], BOX_IN[0][2]); P.where = 'box';
  SH.boxWide();
  await walk(id, BOX_IN.slice(1), { speed:1.3, end:'idle', face:PI / 2 });
  P.base = 'idle'; P.where = 'box';
  toward(P, HEAD.well(), { dist:2.2, side:0.38, dy:0.08 });
  await wait(350);
}
async function fromBox(id){
  const P = ST.P[id]; if(!P) return;
  ST.movers = ST.movers.filter(m => m.P !== P);
  await Promise.race([walk(id, BOX_OUT.slice(0, 2), { speed:1.5 }), wait(1200)]);
  if(id === 'kelechi'){ place(P, P0.kelSeat, 'sit', 'gallery'); return; }
  if(id === 'uche'){ place(P, P0.ucheSeat, 'sit', 'gallery'); return; }
  if(id === 'lucky' || id === 'felix' || id === 'sotonye'){ place(P, P0['dock' + (id === 'lucky' ? 1 : id === 'felix' ? 2 : 3)], 'sit', 'dock'); return; }
  hide(id);
}
/* after the sitting: the room empties; two people talk by the door */
function corridor(other){
  const k = ST.P.kelechi, o = ST.P[other]; if(!k || !o) return;
  ST.gallery.forEach(c => { c.visible = false; }); ST.back.forEach(c => { c.visible = false; });
  hide('judge'); hide('agbada');
  place(k, { x:-0.55, y:0, z:9.6, rot:faceTo(-0.55, 9.6, 0.65, 10.35) }, 'idle', 'corridor');
  place(o, { x:0.65, y:0, z:10.35, rot:faceTo(0.65, 10.35, -0.55, 9.6) }, other === 'san' ? 'folded' : 'idle', 'corridor');
  ST.corridorWith = other; ST.mode = 'corridor';
  twoShot();
}
const faceTo = (x, z, tx, tz)=>Math.atan2(tx - x, tz - z);
/* between sittings: the courtroom gives way to wherever the evening is */
function interlude(arg){
  let el = document.getElementById('court-interlude');
  if(!arg){ if(el) el.classList.remove('show'); return; }
  if(!el){ el = V13.el('div', '', '<div class="ci-k"></div>'); el.id = 'court-interlude'; document.getElementById('game-root').appendChild(el); }
  el.querySelector('.ci-k').textContent = arg.label || '';
  el.classList.add('show');
}
function end(){
  const R = RT(); if(R) R.court = false;
  interlude(null);
  TPCAM.override = null; TPCAM.cur = null;
  ENGINE.sceneAlways = null;
}

/* ---------- every frame: walks, the camera, the fans ---------- */
function always(dt){
  moveStep(dt);
  if(TPCAM.override && ST.base){
    ST.t += dt;
    const dir = ST.look.clone().sub(ST.base); const L = dir.length();
    if(L > 0.01){ dir.divideScalar(L); TPCAM.override.pos.copy(ST.base).addScaledVector(dir, Math.min(ST.t, 12) * ST.drift * Math.min(1, L / 3)); }
  }
  const playing = ENGINE.movementEnabled && !(typeof isOverlayOpen === 'function' && isOverlayOpen());
  if(!playing){
    if(V13.world && V13.world.update) V13.world.update(dt);
    if(TPCAM.override && typeof updateCamera === 'function') updateCamera();
  }
}

/* ---------- the case ---------- */
V13.defCase('m14', {
  title:'FRN v. Edafe & 2 Ors', region:'FCT', sub:'Federal High Court · Court 5', evMax:0, xp:420, ambient:'hq',
  objectives:()=>[
    { id:'o14_conf', text:'Pre-trial conference with Barrister Danladi' },
    { id:'o14_day1', text:'Day 1 — arraignment and your evidence-in-chief' },
    { id:'o14_cross', text:'Day 2 — survive cross-examination' },
    { id:'o14_day2', text:'Day 2 — the prosecution closes its case' },
    { id:'o14_day3', text:'The defence, and judgment' },
  ],
  reset(){
    if(V13.court && V13.court.resetFixes) V13.court.resetFixes();
    V13.s2().trial = {};
  },
  build(){
    ST.P = {}; ST.movers = []; ST.gallery = []; ST.back = []; ST.base = null; ST.look = null; ST.talking = null;
    V13.scene(KEY, { start:'start', player:suit });
    if(ENGINE.player) ENGINE.player.position.z = Math.min(ENGINE.player.position.z, 7.4);   // a few steps in, so the camera isn't out in the doorway
    ENGINE.sceneAlways = always;
    const R = RT();
    ST.P.kelechi = { id:'kelechi', ch:ENGINE.player, base:'idle', h:1.66, where:'floor' };
    // Friday evening: the court has risen; Danladi has borrowed the room
    const D = put('danladi', { x:P0.confDan.x, y:0, z:P0.confDan.z, rot:faceTo(P0.confDan.x, P0.confDan.z, 0, 6) }, 'folded', { where:'conf' });
    R.itDan = V13.talk(D.ch, 'Talk to Barrister Danladi', it => {
      V13.drop(it);
      conference();
    }, { range:3.2 });
  },
  start(){
    ENGINE.movementEnabled = false; showHUD(false);
    titleCard(['COURT 5', 'FRIDAY · 18:40'], fast() ? 500 : 2400, ()=>{
      showHUD(true); ENGINE.movementEnabled = true;
      V13.toast('FEDERAL HIGH COURT', 'Barrister Danladi is waiting for you at the bar.', 2600);
    });
  },
});
/* the conference begins where Danladi stands; then the trial runs to its end */
function conference(){
  const R = RT(), k = ST.P.kelechi, D = ST.P.danladi;
  ENGINE.movementEnabled = false; showHUD(false);
  place(k, { x:P0.conf.x, y:0, z:P0.conf.z, rot:faceTo(P0.conf.x, P0.conf.z, P0.confDan.x, P0.confDan.z) }, 'idle', 'conf');
  place(D, { x:P0.confDan.x, y:0, z:P0.confDan.z, rot:faceTo(P0.confDan.x, P0.confDan.z, P0.conf.x, P0.conf.z) }, 'idle', 'conf');
  R.court = true; ST.mode = 'conf';
  twoShot();
  V13.court.run(stage).then(()=>{
    ['o14_conf', 'o14_day1', 'o14_cross', 'o14_day2', 'o14_day3'].forEach(V13.done);
    end();
    V13.finish('m14');
  }).catch(e => { console.error('[m14]', e); end(); V13.finish('m14'); });
}
V13.court.stageOf = ()=>stage;
})();
