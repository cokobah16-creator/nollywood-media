/* =========================================================================
   NACECA · v13 Case 09 — The Evidence Room (Benin Zonal Command, 21:40)
   Abuja has ordered exhibit 14 — Osas's drive — flown to headquarters on
   the 06:00 flight. Commander Okundaye gives Kelechi the night. How the
   drive leaves the cage, how it is read, and what is handed over at dawn
   decide whether it survives the courtroom in Case 14.
   ========================================================================= */
(function(){
'use strict';
const V13 = window.V13, MC = V13.mc;

/* ---------- the office at night (shared with the Season 2 hubs) ---------- */
V13.retint = function(look){
  const sc = ENGINE.scene; if(!sc) return;
  const P = { night:{ k:0.6, col:'#d8ecff', bg:'#04060c' }, late:{ k:0.5, col:'#c8d8ff', bg:'#03050a' }, dawn:{ k:0.72, col:'#ffd8b8', bg:'#0a0a14' },
              day:{ k:1.0, col:'#fff1dc', bg:'#0b1220' }, dusk:{ k:0.78, col:'#ffc890', bg:'#080a12' }, evening:{ k:0.85, col:'#ffd9b0', bg:'#070a12' } }[look] || { k:1, col:'#ffffff', bg:'#05080f' };
  const tint = new THREE.Color(P.col);
  sc.traverse(o => {
    if(o.isLight && !o.userData._v13tint){ o.userData._v13tint = true; o.intensity *= (o.isAmbientLight || o.isHemisphereLight) ? Math.max(0.6, P.k) : P.k; if(o.color && !o.isHemisphereLight) o.color.lerp(tint, 0.35); }
    const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    for(const m of ms){ if(m && m.lightMap && m.lightMapIntensity != null && !m._v13tint){ m._v13tint = P.k; m.lightMapIntensity *= P.k; } }
  });
  sc.background = new THREE.Color(P.bg); if(sc.fog) sc.fog.color = new THREE.Color(P.bg);
  // the office windows show a night city: by day (and at dawn or dusk) paint a city in daylight instead
  const D = ENGINE._dress && ENGINE._dress.D;
  if(D && D.Skyline && (look === 'day' || look === 'dawn' || look === 'dusk' || look === 'evening')){
    D.Skyline.traverse(o => {
      if(!o.material || !o.material.map || o.material._v13sky) return;
      const old = o.material.map, img = old.image || {}, w = img.width || 1024, h = img.height || 256;
      const tex = new THREE.CanvasTexture(daySkyline(look, w, h)); tex.encoding = THREE.sRGBEncoding;
      tex.wrapS = old.wrapS; tex.wrapT = old.wrapT; tex.repeat.copy(old.repeat); tex.offset.copy(old.offset); tex.flipY = old.flipY;
      const m = o.material.clone(); m.map = tex; m._v13sky = true; if(m.color) m.color.set('#ffffff'); o.material = m;
    });
  }
};
/* a city by daylight for the office windows: sky, haze, two rows of blocks, windows catching the light */
function daySkyline(look, w, h){
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  let s = 7; const r = ()=>{ s = (s * 16807) % 2147483647; return s / 2147483647; };
  const sky = { day:['#7fb0dc', '#cfe0ec'], dawn:['#5a6c96', '#f2c49a'], dusk:['#4a5a86', '#f0a868'], evening:['#3a4a76', '#e8a070'] }[look];
  const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, sky[0]); g.addColorStop(0.75, sky[1]); g.addColorStop(1, sky[1]);
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  const rows = look === 'day' ? [['#9aacbe', 0.42, 0.5], ['#6a7c90', 0.6, 0.85]] : [['#4a5068', 0.42, 0.5], ['#2a3044', 0.6, 0.85]];
  for(const [col, top, dark] of rows){
    let px = 0;
    while(px < w){
      const bw = w * (0.03 + r() * 0.06), bh = h * (top * (0.35 + r() * 0.65));
      x.fillStyle = col; x.fillRect(px, h - bh, bw, bh);
      for(let wy = h - bh + 6; wy < h - 4; wy += 7) for(let wx = px + 3; wx < px + bw - 3; wx += 6){
        const lit = look === 'day' ? r() < 0.25 : r() < 0.12;
        x.fillStyle = look === 'day' ? (lit ? 'rgba(230,240,250,0.55)' : 'rgba(40,52,70,0.35)') : (lit ? 'rgba(255,214,150,0.7)' : 'rgba(10,14,24,0.4)');
        x.fillRect(wx, wy, 3, 4);
      }
      px += bw + w * 0.004;
    }
    x.fillStyle = `rgba(${look === 'day' ? '220,232,242' : '240,190,150'},${0.18 * dark})`; x.fillRect(0, 0, w, h);   // haze
  }
  return c;
}
V13.plaque = function(text, pos, rotY, w){
  const c = document.createElement('canvas'); c.width = 512; c.height = 128; const x = c.getContext('2d');
  x.fillStyle = '#0b1426'; x.fillRect(0, 0, 512, 128); x.strokeStyle = '#d8a64a'; x.lineWidth = 6; x.strokeRect(8, 8, 496, 112);
  x.fillStyle = '#f0c878'; x.font = '700 34px Oswald, "Arial Narrow", sans-serif'; x.textAlign = 'center'; x.fillText(text, 256, 77, 470);
  const tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w || 2.4, (w || 2.4) / 4), new THREE.MeshBasicMaterial({ map:tex }));
  m.position.set(pos.x, pos.y, pos.z); m.rotation.y = rotY || 0; ENGINE.scene.add(m); return m;
};
/* the HQ room, emptied of Season 1's people and buttons, ready to be dressed as another office */
V13.office = function(look, plaqueText){
  buildSceneHQ();
  const prev = ENGINE.sceneUpdate;
  ENGINE.sceneUpdate = dt => { if(prev){ try{ prev(dt); }catch(e){} } V13.update(dt); };
  // Commander Adaeze is not in this room any more
  const npcMesh = n => (n && n.isObject3D) ? n : (n && n.mesh);
  for(const n of (ENGINE.npcs || [])){ const m = npcMesh(n); if(m && m.position && Math.abs(m.position.z + 8) < 1.3) m.visible = false; }
  (ENGINE.extraSkinned || []).forEach(ch => { if(ch.parent) ch.parent.remove(ch); });
  ENGINE.extraSkinned = [];
  ENGINE.interactables = [];
  if(typeof clearMarkers === 'function') clearMarkers();
  V13.retint(look);
  if(plaqueText) V13.plaque(plaqueText, { x:0, y:2.75, z:-9.42 }, 0, 2.6);
  if(ENGINE.player){ ENGINE.player.position.set(0, 0, 6.6); ENGINE.player.rotation.y = Math.PI; ENGINE.cameraYaw = ENGINE.playerYaw = Math.PI; }
};
/* a wire-mesh evidence cage with a counter and the register */
function cage(x, z){
  const sc = ENGINE.scene, g = new THREE.Group(); g.position.set(x, 0, z);
  const metal = new THREE.MeshStandardMaterial({ color:'#5a5f66', roughness:0.6, metalness:0.4 });
  const mesh = new THREE.MeshBasicMaterial({ color:'#8a9098', wireframe:true, transparent:true, opacity:0.55 });
  for(const [px, pz] of [[-0.9, -0.7], [0.9, -0.7], [-0.9, 0.7], [0.9, 0.7]]){ const p = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.3, 0.06), metal); p.position.set(px, 1.15, pz); g.add(p); }
  for(const [w, d, px, pz] of [[1.8, 0.02, 0, -0.7], [0.02, 1.4, -0.9, 0], [0.02, 1.4, 0.9, 0]]){ const p = new THREE.Mesh(new THREE.BoxGeometry(w, 2.2, d, 6, 8, 1), mesh); p.position.set(px, 1.12, pz); g.add(p); }
  const shelf = new THREE.MeshStandardMaterial({ color:'#3a3d42', roughness:0.8 });
  for(let k = 0; k < 3; k++){ const s = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.04, 0.5), shelf); s.position.set(0, 0.5 + k * 0.6, -0.4); g.add(s);
    for(let b = 0; b < 4; b++){ const bx = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.26, 0.36), new THREE.MeshStandardMaterial({ color:['#a8865a', '#c9b48a', '#8a6a4a', '#d8c8a0'][(b + k) % 4], roughness:0.9 })); bx.position.set(-0.6 + b * 0.4, 0.66 + k * 0.6, -0.4); g.add(bx); } }
  const counter = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.95, 0.55), new THREE.MeshStandardMaterial({ color:'#4a2e1c', roughness:0.7 })); counter.position.set(0, 0.475, 1.1); g.add(counter);
  const book = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.05, 0.3), new THREE.MeshStandardMaterial({ color:'#1b2a4c', roughness:0.8 })); book.position.set(0.2, 0.98, 1.1); g.add(book);
  const bag = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.22), new THREE.MeshStandardMaterial({ color:'#e8e2d0', roughness:0.6 })); bag.position.set(-0.35, 0.97, 1.08); g.add(bag);
  sc.add(g);
  if(typeof addObstacle === 'function'){ addObstacle(x, z, 2.0, 1.6); addObstacle(x, z + 1.1, 1.5, 0.6); }
  return { g, book, bag };
}

/* ---------- the case ---------- */
const RT = ()=>V13.rt;
// this case's flags, exhibits and documents: a replay starts clean (as Case 12's reset)
const FLAGS = ['s2_custody', 's2_method', 's2_abuja_call', 's2_original'];
const EVIDS = ['drive_image', 'upstream_ledger', 'evidence_register'];
const DOCKEYS = ['m9_hash', 'm9_ledger'];
const tobiAlive = ()=>V13.tobiAlive ? V13.tobiAlive() : (m => m.asaba === 'rescue' || (m.asaba === 'chase' && !S.game._asabaHostageLost))(MC());
/* a document closed without an answer (backed off): the bench comes back so the player can take it up again.
   (A pause held over the document is not a close: V13.ovShown.) */
function watchDoc(key, done){
  const R = RT();
  V13.every(()=>{
    if(RT() !== R || done()) return false;
    const open = V13.ovShown ? V13.ovShown('screen-puzzle') : !!document.querySelector('#screen-puzzle.show');
    if(!open){ if(R.itBench) R.itBench._used = false; return false; }
  });
}
V13.defCase('m9', {
  title:'The Evidence Room', region:'Edo', sub:'Benin Zonal Command · 21:40', evMax:3, xp:320, ambient:'hq',
  objectives:()=>[
    { id:'o9_osagie', text:'Report to Commander Okundaye' },
    { id:'o9_register', text:'Get the drive out of the evidence cage' },
    { id:'o9_examine', text:'Examine the drive at the forensic bench' },
    { id:'o9_ledger', text:'Read the rest of the ledger' },
    { id:'o9_call', text:'Take the call from Abuja' },
    { id:'o9_transfer', text:'05:10 — the transfer team' },
  ],
  reset(){
    const m = MC(), f = S.game.flags || {};
    for(const k of FLAGS){ delete m[k]; delete f[k]; }
    S.game.evidence = (S.game.evidence || []).filter(e => !e || !EVIDS.includes(e.id));
    if(S.game.evQ) for(const id of EVIDS) delete S.game.evQ[id];
    for(const store of ['_docMiss', '_docFree', '_docLocked']) if(S.game[store]) for(const k of DOCKEYS) delete S.game[store][k];
    delete V13.s2().cert_drive;
  },
  build(){
    V13.office('night', 'NACECA · BENIN ZONAL COMMAND');
    const R = RT();
    // the people in the room tonight
    R.osagie = V13.person('osagie', { x:0.6, z:-7.2, rot:0 }, { clip:'folded', id:'osagie' });
    R.uche = V13.person({}, { x:-2.4, z:4.6, rot:2.4 }, { kind:'uche', clip:'folded' });
    R.cage = cage(-5.6, -4.4);
    R.ikpe = V13.person('ikpe', { x:-5.3, z:-3.05, rot:0.2 }, { clip:'idle', id:'ikpe' });
    // Mr. Igbinosa runs the bench, hashes and certifies in every save (canon review CN06)
    R.analyst = V13.person('igbinosa', { x:6.45, z:-6.6, rot:Math.PI / 2 }, { clip:'sit', id:'analyst', solid:false });
    R.speak = 'igbinosa';
    // Tobi, if he came out of Asaba alive: Zonal took him on to read the payroll; he stands in at the bench
    // (Season 1's look: CAST.tobi; a clean shirt tonight)
    R.tobi = tobiAlive();
    if(R.tobi){
      R.tobiMesh = V13.person(V13.look('tobi', { torso:'#d9dde6', armA:'#d9dde6', armB:'#d9dde6', armC:'#d9dde6', gear:['Gear_Glasses'] }),
        { x:6.0, z:-5.3, rot:0 }, { clip:'folded', id:'tobi', solid:false });
      V13.face(R.tobiMesh, 2.5, -3.5);
    }
    // what you can do
    R.itOsagie = V13.talk(R.osagie, 'Report to Commander Okundaye', it => {
      if(V13.objDone('o9_osagie')){ V13.toast('COMMANDER OKUNDAYE', '"The night is yours, Kelechi. Use it."', 1800); return; }
      const key = V13.s1fate() === 'unproven' ? V13.pick('m9_osagie_unproven', 'm9_osagie') : 'm9_osagie';
      V13.say(key, ()=>{ V13.used(it); V13.done('o9_osagie'); });
    });
    R.itIkpe = V13.talk(R.ikpe, 'Sign for exhibit 14', it => {
      if(!V13.objDone('o9_osagie')){ V13.toast('SGT. IKPE', '"Commander first, sir. Then my book."', 1800); return; }
      if(MC().s2_custody){ V13.toast('SGT. IKPE', MC().s2_custody === 'signed' ? '"It is in the book, sir."' : '"I didn\'t see anything, sir."', 1800); return; }
      V13.say('m9_ikpe', ()=>{
        V13.used(it); V13.done('o9_register');
        if(MC().s2_custody === 'signed') V13.ev('evidence_register', 'Evidence register — exhibit 14', 'good', 40);
        R.cage.bag.visible = false;
        V13.toast('EXHIBIT 14', 'Osas\'s drive, sealed bag BZ-0447.', 1800);
      });
    });
    R.itBench = V13.talk(R.analyst, 'Examine the drive', it => {
      if(!MC().s2_custody){ V13.toast('MR. IGBINOSA', '"Bring me the drive first."', 1600); return; }
      // the image is made but the hash check isn't on record yet (a back-off): the bench opens it again
      if(MC().s2_method === 'image' && !V13.objDone('o9_examine')){ if(!R.hashDone) R.openHash(); return; }
      if(MC().s2_method){ examineNext(); return; }
      const bench = ()=>V13.say('m9_forensic_igbinosa', ()=>{ V13.used(it); afterMethod(); });
      // Tobi says hello first (text: m9_tobi_bench; V13.say warns and carries on if it's missing)
      if(R.tobi && !R.tobiMet){ R.tobiMet = true; V13.say(V13.pick('m9_tobi_bench') || 'm9_tobi_bench', bench); }
      else bench();
    }, { verb:'inspect', range:2.8 });
    /* the hash check on the image: kept here so the bench can reopen it after a back-off */
    R.openHash = ()=>{
      V13.used(R.itBench);
      V13.doc('m9_hash', ok => {
        if(R.hashDone) return; R.hashDone = true;
        if(!V13.hasEv('drive_image')) V13.ev('drive_image', 'Forensic image of exhibit 14', ok ? 'good' : 'contested', 60);
        else S.game.evQ.drive_image = ok ? (S.game.evQ.drive_image || 'good') : 'contested';
        V13.say('m9_cert_' + R.speak, ()=>{ V13.done('o9_examine'); V13.s2().cert_drive = 1; examineNext(); });
      });
      watchDoc('m9_hash', ()=>R.hashDone);
    };
  },
  start(){ V13.say('m9_intro'); },
});

/* after the analyst and Kelechi pick a method */
function afterMethod(){
  const m = MC().s2_method, R = RT();
  if(m === 'image'){
    V13.skip(['00:40', 'THE IMAGE FINISHES'], ()=>R.openHash());
  } else {
    V13.ev('drive_image', m === 'photo' ? 'Photographs of exhibit 14\'s screens' : 'Exhibit 14, read directly', m === 'photo' ? 'weak' : 'contested', 40);
    V13.done('o9_examine'); setTimeout(examineNext, 400);
  }
}
/* the ledger: Tobi reads ledger codes (accountancy) when he is alive, else Mr. Igbinosa */
function examineNext(){
  const R = RT();
  if(V13.objDone('o9_ledger')){ if(!V13.objDone('o9_call')) V13.toast('TONIGHT', 'Wait for Abuja to call. They will.', 1800); return; }
  if(R.ledgerDone) return;
  V13.used(R.itBench);
  V13.doc('m9_ledger', ok => {
    if(R.ledgerDone) return; R.ledgerDone = true;
    if(!V13.hasEv('upstream_ledger')) V13.ev('upstream_ledger', 'The UPSTREAM ledger', ok ? 'good' : 'contested', 80);
    else S.game.evQ.upstream_ledger = ok ? (S.game.evQ.upstream_ledger || 'good') : 'contested';
    const reader = R.tobi ? V13.pick('m9_ledger_tobi', 'm9_ledger_igbinosa') : V13.pick('m9_ledger_igbinosa');
    V13.run('m9_ledger_run', [reader, 'm9_dgo'], ()=>{ V13.done('o9_ledger'); setTimeout(theCall, 900); });
  });
  watchDoc('m9_ledger', ()=>R.ledgerDone);
}
/* 02:30 — Abuja on the Commander's desk phone */
function theCall(){
  const R = RT();
  V13.skip(['02:30', 'THE DESK PHONE'], ()=>{
    if(typeof sfxAlert === 'function') sfxAlert();
    V13.toast('PHONE', 'The Commander\'s desk phone is ringing.', 2200);
    R.phone = V13.spot({ x:0.9, y:1.0, z:-6.9 }, 'Answer the Commander\'s phone', it => {
      V13.drop(it);
      V13.call(/KUTI/, 'm9_call_kuti', ()=>{
        const caught = MC().s2_abuja_call === 'lie' && MC().s2_custody === 'signed';
        const next = ()=>{ V13.done('o9_call'); if(!backed()) leaves(); setTimeout(transfer, 800); };
        if(caught && V13.has('m9_call_kuti_caught')) V13.call(/KUTI/, 'm9_call_kuti_caught', next); else next();
      });
    }, { verb:'talk', range:2.6 });
  });
}
/* will the Commander back a retention order at 05:10? */
function backed(){ const r = S.player.reputation; return MC().s2_custody === 'signed' && MC().s2_abuja_call !== 'lie' && r.integrity >= 50; }
/* she won't: she goes home after the call, so her office is dark when the escort comes (m9_transfer) */
function leaves(){
  const R = RT(); if(!R.osagie || R.osagieGone) return;
  R.osagieGone = true;
  if(R.itOsagie) V13.drop(R.itOsagie);
  V13.walk(R.osagie, [[0.6, -4.0], [0.4, 4.0], [0.4, 9.6]], { speed:1.5 }).then(()=>{ if(R.osagie) R.osagie.visible = false; });
}
/* 05:10 — the escort arrives early */
function transfer(){
  const R = RT();
  const isBacked = backed();
  V13.skip(['05:10', 'THEY ARE EARLY'], ()=>{
    R.escort = V13.person('escort', { x:0.4, z:8.8, rot:Math.PI }, { id:'escort', solid:false });
    R.suit = V13.person(V13.look('kuti', { torso:'#1c1e24', armA:'#1c1e24', armB:'#1c1e24', armC:'#1c1e24' }), { x:-0.6, z:9.3, rot:Math.PI }, { solid:false });
    V13.walk(R.escort, [[0.4, 3.4]], { face:Math.PI }); V13.walk(R.suit, [[-0.7, 4.0]], { face:Math.PI });
    if(isBacked) V13.walk(R.osagie, [[1.6, 1.6]], { face:Math.PI * 0.85 });   // she is on the steps in yesterday's uniform
    else if(R.osagie){ R.osagie.visible = false; R.osagieGone = true; }       // gone home hours ago: the office is dark
    setTimeout(()=>{
      V13.talk(R.escort, 'Meet the transfer team', it => {
        V13.drop(it);
        V13.say(isBacked ? 'm9_transfer_backed' : 'm9_transfer', ()=>{
          V13.done('o9_transfer');
          if(!MC().s2_original) V13.setFlag('s2_original', 'handed');
          if(MC().s2_original === 'handed'){ V13.walk(R.escort, [[0.4, 9.6]]); V13.walk(R.suit, [[-0.6, 9.8]]); }
          setTimeout(()=>V13.say('m9_end', ()=>V13.finish('m9')), 1400);
        });
      }, { range:3.0 });
    }, 2600);
  });
}
})();
