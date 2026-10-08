/* =========================================================================
   NACECA · v12 Night Shift — Lagos HQ, 23:40, after Lekki
   Half the office is dark. Uche is eating cold jollof at his desk. The
   Commander is on the phone to Abuja, and she uses a phrase the Voice will
   use on the ransom calls. A voicemail from a UNIBEN student is waiting.
   At the operations table, Obi's notebook lines up with the courier's
   phone — click — and a new suspect appears: "Madam".
   ========================================================================= */
(function(){
'use strict';
const V12 = window.V12;
ENV_FOR.m3n = 'hq';
SAFETY_TIPS.m3n = SAFETY_TIPS.m3n || '';

DIALOGUE.night_uche = [
  { speaker:'SGT. UCHE', portrait:'sergeant', text:'Jollof from the canteen. Cold, but it\'s jollof. Sit down before you fall down, sir.' },
  { speaker:'SGT. UCHE', text:'__RAID__' },
  { speaker:'SGT. UCHE', mood:'evasive', text:'Funny thing. Abuja calls her every night this week. Same time. She takes it with the lights off.',
    choices:[
      { text:'How long have you worked for her?', next:'night_uche_a' },
      { text:'Go home, Uche. Your wife will think you\'ve run away.', next:'night_uche_b' },
    ] },
];
DIALOGUE.night_uche_a = [
  { speaker:'SGT. UCHE', portrait:'sergeant', text:'Eleven years. She signed my transfer to Lagos. She signs everybody\'s transfer.' },
  { speaker:'SGT. UCHE', text:'Thursday we go to the Benin Bypass. The Anti-Kidnapping Squad is lending us Inspector Chidi. Sleep first.' },
];
DIALOGUE.night_uche_b = [
  { speaker:'SGT. UCHE', portrait:'sergeant', text:'She knows where to find me. Here.' },
  { speaker:'SGT. UCHE', text:'Thursday we go to the Benin Bypass. The Anti-Kidnapping Squad is lending us Inspector Chidi. Sleep first.' },
];
DIALOGUE.night_voicemail = [
  { speaker:'NACECA SYSTEM', text:'One voicemail. Unknown number. Today, 14:02.' },
  { speaker:'CALLER · VOICEMAIL', text:'Hello? Is this NACECA? My name is Osas — Osas Ehigie. I\'m a student at UNIBEN. I do data entry for a payroll firm in Benin.' },
  { speaker:'CALLER · VOICEMAIL', text:'There\'s a name on one of the payrolls that — [static] — your agency. I don\'t want to say it on the phone. Please call me back. Please.',
    choices:[ { text:'Call him back.', next:'night_callback' }, { text:'Save it. Try him in the morning.', next:'night_save' } ] },
];
DIALOGUE.night_callback = [
  { speaker:'NACECA SYSTEM', text:'"The number you are calling is switched off. Please try again later."' },
  { speaker:'AGENT KELECHI', portrait:'kelechi', text:'I\'ll try him in the morning.' },
];
DIALOGUE.night_save = [ { speaker:'AGENT KELECHI', portrait:'kelechi', text:'Osas Ehigie. UNIBEN. Morning.' } ];
DIALOGUE.night_adaeze = [
  { speaker:'COMMANDER ADAEZE', mood:'evasive', text:'Agent. It\'s nearly midnight.' },
  { speaker:'AGENT KELECHI', portrait:'kelechi', text:'Paperwork from Lekki, ma.' },
  { speaker:'COMMANDER ADAEZE', text:'Good work tonight. Go home, Kelechi. Whatever is on that table will still be there tomorrow.' },
];

function raidLine(){
  const m = S.game.moralChoices || {}, f = S.game.flags || {};
  if(m.arrest === 'bribe') return 'I saw the drawer, sir. I\'m not going to say anything. Tonight.';
  if(m.arrest === 'forceful') return 'Obi\'s lawyers are already saying "knee on his back". Expect that in the papers.';
  if(f.child_gentle) return 'The girl\'s aunty called the desk. Said to thank the officer with the kind face.';
  return 'Clean arrest. The kind that holds in court.';
}

V12.wrap('loadMission', orig => function(id){
  if(id !== 'm3n') return orig.apply(this, arguments);
  S.game.currentMission = 'm3n'; S.game.alertLevel = 0;
  showHUD(false); ENGINE.movementEnabled = false; showOverlay(null);
  titleCard(['NIGHT SHIFT', 'LAGOS HQ · 23:40'], 2800, ()=>beginMission('m3n'));
});
V12.wrap('beginMissionCore', orig => function(id){
  if(id !== 'm3n') return orig.apply(this, arguments);
  S.game._opEv = [];
  S.game._opStart = { arrests:S.game.arrests||0, civ:S.game.civiliansRescued||0, force:S.game.forceUsed||0, intel:S.game.intelScore||0, xp:S.player.xp||0, rep:Object.assign({}, S.player.reputation) };
  S.game._opBumps = 0;
  if(typeof fadeIn === 'function') fadeIn();
  if(typeof resetGuidance === 'function') resetGuidance();
  S.game.currentMission = 'm3n'; S.game.flags = S.game.flags || {};
  ['_nightUche','_nightMail','_nightCall','_nightClick'].forEach(k => delete S.game[k]);
  showOverlay(null); showHUD(true); ENGINE.movementEnabled = true;
  setMissionTitle('Night Shift');
  setObjectives([
    { id:'n1_uche',  text:'Check in with Uche' },
    { id:'n2_desk',  text:'Your desk — one new voicemail' },
    { id:'n3_table', text:'Work the operations table' },
    { id:'n4_home',  text:'Go home' },
  ]);
  setEvidenceMax(1);   // tonight's one new piece: the voicemail
  buildSceneHQ();
  try{ nightDress(); }catch(e){ console.warn('[v12] night dress', e); }
  startAmbient('rain');
  if(typeof playMusic === 'function') playMusic('investigation', { volume:0.32 });
  // the two halves of tonight's click have to exist, even on saves from older builds
  setTimeout(()=>{
    if(!V12.hasEv('co_madam')) collectEvidence({ id:'co_madam', name:"Courier's Dropped Phone — 'Tell Madam it's clean'", xp:20 });
    if(!V12.hasEv('obi_notebook')) collectEvidence({ id:'obi_notebook', name:"Obi's Notebook — Initials and Amounts", xp:20 });
    // backfilled files are old business, not tonight's haul
    S.game._opEv = (S.game._opEv || []).filter(x => x !== 'co_madam' && x !== 'obi_notebook');
    if(typeof refreshEvidenceCount === 'function') refreshEvidenceCount();
  }, 1800);
});

function nightDress(){
  const sc = ENGINE.scene; if(!sc) return;
  // half the office is dark: dim live lights and the baked light in the room
  sc.traverse(o => {
    if(o.isLight){ o.intensity *= o.isAmbientLight ? 0.6 : 0.42; }
    const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    for(const m of ms){ if(m && m.lightMap && m.lightMapIntensity != null && !m._v12dim){ m._v12dim = true; m.lightMapIntensity *= 0.42; } }
  });
  sc.background = new THREE.Color('#03050a');
  if(sc.fog) sc.fog.color = new THREE.Color('#05080f');
  // the analysts have gone home; Uche takes one of their chairs
  const seats = (ENGINE.extraSkinned || []).slice();
  let seat = seats[0] ? { p:seats[0].position.clone(), r:seats[0].rotation.y } : { p:new THREE.Vector3(-5.2, 0, -2.4), r:Math.PI/2 };
  seats.forEach(ch => { if(ch.parent) ch.parent.remove(ch); });
  ENGINE.extraSkinned = [];
  ENGINE.npcs = (ENGINE.npcs || []).filter(n => { const m = n && n.isObject3D ? n : n && n.mesh; return !m || !seats.includes(m); });
  let uche;
  if(typeof PEOPLE !== 'undefined' && PEOPLE.make && ART.ready){
    uche = PEOPLE.make('uche'); uche.position.copy(seat.p); uche.rotation.y = seat.r; sc.add(uche);
    uche.userData.anim.play(PEOPLE.clips && PEOPLE.clips.sit ? 'sit' : 'idle', { fade:0 });
    ENGINE.extraSkinned.push(uche);
  } else {
    uche = buildNPCMesh('#5a3818', '#1a2a18', '#1a2a18', '#0a0a08', { hair:'crop', beard:true, longSleeve:true });
    uche.position.copy(seat.p); uche.rotation.y = seat.r; sc.add(uche); ENGINE.npcs.push(uche);
  }
  const lamp = new THREE.PointLight('#ffc27a', 1.1, 5.5, 2); lamp.position.set(seat.p.x + Math.sin(seat.r) * 0.6, 1.6, seat.p.z + Math.cos(seat.r) * 0.6); sc.add(lamp);
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.07, 0.07, 14), new THREE.MeshStandardMaterial({ color:'#f2efe8', roughness:0.5 }));
  bowl.position.set(seat.p.x + Math.sin(seat.r) * 0.55, 0.8, seat.p.z + Math.cos(seat.r) * 0.55); sc.add(bowl);
  const rice = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.02, 14), new THREE.MeshStandardMaterial({ color:'#d4641e', roughness:0.8 }));
  rice.position.copy(bowl.position); rice.position.y += 0.036; sc.add(rice);
  // the Commander: back to the room, on the phone to Abuja
  const npcMesh = n => (n && n.isObject3D) ? n : (n && n.mesh);
  const cmd = (ENGINE.npcs || []).map(npcMesh).find(m => m && m.userData && m.userData._proxy) || (ENGINE.npcs || []).map(npcMesh).find(m => m && m.position && Math.abs(m.position.z + 8) < 0.6);
  if(cmd){ cmd.position.set(0.6, 0, -8.6); cmd.rotation.y = Math.PI; }
  const cold = new THREE.PointLight('#7a9cff', 0.7, 6, 2); cold.position.set(0.6, 2.2, -8.8); sc.add(cold);
  // replace the daytime interactables with tonight's
  const old = ENGINE.interactables || [];
  const pick = re => old.find(i => re.test(i.label || ''));
  const table = pick(/^Approach Commander/), phone = pick(/^Read your phone/), door = pick(/^Deploy to Ikeja/);
  ENGINE.interactables = [];
  ENGINE.interactables.push({ mesh:uche, label:'Talk to Uche', verb:'talk', range:2.4, labelY:1.55, onInteract:()=>{
    if(S.game._nightUche){ toast('SGT. UCHE', '"Go home, sir. I mean it."', 1800); return; }
    DIALOGUE.night_uche[1].text = raidLine();
    startDialogue('night_uche', ()=>{ S.game._nightUche = true; completeObjective('n1_uche'); });
  }});
  if(phone) ENGINE.interactables.push({ mesh:phone.mesh, label:'Play the voicemail', verb:'inspect', range:2.4, onInteract:()=>{
    if(S.game._nightMail){ toast('VOICEMAIL', 'Osas Ehigie · UNIBEN · "your agency"', 2000); return; }
    startDialogue('night_voicemail', ()=>{ S.game._nightMail = true; completeObjective('n2_desk'); collectEvidence({ id:'osas_voicemail', name:'Voicemail — a UNIBEN Student, a Payroll, "Your Agency"', xp:40 }); });
  }});
  if(table) ENGINE.interactables.push({ mesh:table.mesh, label:'Work the operations table', verb:'inspect', range:3.2, onInteract:()=>{
    if(S.game._nightClick){ V12.openOps('lagos'); return; }
    theClick();
  }});
  if(cmd) ENGINE.interactables.push({ mesh:cmd, label:'Speak to the Commander', verb:'talk', range:2.4, optional:true, onInteract:()=>{
    if(!S.game._nightCall){ overhear(); return; }
    toast('COMMANDER ADAEZE', '"Go home, Kelechi."', 1600);
  }});
  if(door) ENGINE.interactables.push({ mesh:door.mesh, label:'Go home', verb:'exit', range:3, onInteract:()=>{
    if(!(V12.objDone('n1_uche') && V12.objDone('n2_desk') && V12.objDone('n3_table'))){ toast('NOT YET', 'Uche, your voicemail and the table first.', 2000); return; }
    completeObjective('n4_home');
    completeMission('m3n', { silent:true });
    V12.log('mission_end', { m:'m3n' });
    showHUD(false); ENGINE.movementEnabled = false; stopAmbient();
    titleCard(['BENIN BYPASS', 'TWO DAYS LATER'], 2600, ()=>loadMission('m4'));
  }});
  // overhearing the call: walk near her office
  const prev = ENGINE.sceneUpdate;
  ENGINE.sceneUpdate = dt => {
    if(prev) prev(dt);
    if(!S.game._nightCall && cmd && ENGINE.player && Math.hypot(ENGINE.player.position.x - cmd.position.x, ENGINE.player.position.z - cmd.position.z) < 6.2) overhear();
  };
  if(ENGINE.player){ ENGINE.player.position.set(0, 0, 7.4); ENGINE.player.rotation.y = Math.PI; ENGINE.cameraYaw = ENGINE.playerYaw = Math.PI; }
  S.game.currentSubregion = 'NACECA HQ · 23:40'; refreshHUD();
  if(typeof MINIMAP !== 'undefined' && MINIMAP.pois){ MINIMAP.pois.length = 0; MINIMAP.pois.push({ x:seat.p.x, z:seat.p.z, color:'#5dd07a', r:1.2 }, { x:0, z:0, color:'#d8a64a', r:1.6 }, { x:0, z:9.9, color:'#5dd07a', r:1.4 }); }
}

function overhear(){
  if(S.game._nightCall) return;
  S.game._nightCall = true;
  V12.say('COMMANDER ADAEZE · ON THE PHONE', '…Yes, sir. Lekki is done. Obi is in custody.', 3200);
  V12.say('COMMANDER ADAEZE · ON THE PHONE', 'No. Nobody needs to be a hero, sir. It will be handled quietly. My way.', 4200);
  V12.say('COMMANDER ADAEZE · ON THE PHONE', '…Good night, sir.', 2200);
  setTimeout(()=>{ if(S.game.currentMission === 'm3n' && !isOverlayOpen()) startDialogue('night_adaeze'); }, 10200);
  V12.log('overheard', {});
}

/* the click: Obi's notebook against the courier's phone
   Senior Agent reads the page plain; Recruit gets the red/green highlights. */
function theClick(){
  const hl = typeof V12.opsRecruit === 'function' ? V12.opsRecruit() : false;
  const paint = (cls, t) => hl ? `<span class="${cls}">${t}</span>` : t;
  const tick = typeof icon === 'function' ? icon('check') : '';
  const spec = {
    key:'night_click', title:'OBI\'S NOTEBOOK · THE COURIER\'S PHONE',
    screen:[
      '<span class="label">[ OBI\'S NOTEBOOK · SPIRAL, RULED · SEIZED AT LEKKI ]</span>',
      'FRI 11 SEP    C.A.  .............   2,500,000',
      'FRI 18 SEP    C.A.  .............   2,500,000',
      'FRI 25 SEP    C.A.  .............   2,500,000',
      'TUE 29 SEP    POS ×3  ...........  15,400,000',
      'FRI 02 OCT    C.A.  .............   2,500,000',
      'SAT 03 OCT    ENGR  .............     400,000',
      'MON 05 OCT    C.A.  .............   2,500,000   ' + tick,
      '',
      '<span class="label">[ COURIER\'S PHONE · UNSENT DRAFT ]</span>',
      paint('red', '"Tell Madam it\'s clean."'),
      'draft saved MON 05 OCT · 23:14 · battery 4%',
      'last call: ' + paint('green', 'ENGR') + ' · 22:51',
    ].join('\n'),
    ask:'The courier was told to report to "Madam" the night of the Mushin drop. Who is Madam in Obi\'s books? Pick it, then tap the line that proves it.',
    options:[
      { text:'Madam is "C.A." — Obi pays her', correct:true },
      { text:'Madam is "ENGR" — the Engineer' },
      { text:'Madam is one of the three POS agents' },
      { text:'Madam is Ada, Obi\'s wife' },
    ],
    proof:['MON 05 OCT    C.A.'], look:['MON 05 OCT', 'SAT 03 OCT', 'last call'],
    fail:{ mode:'continue', note:'You\'re too tired to see it tonight. The notebook and the phone go on the table as they are: link them yourself.' },
    onCorrect:{ intel:10 },
    onSolved:()=>{ S.game.flags.v12_madam = true; S.game._nightClickGood = true; },
    onFailed:()=>{ S.game._nightClickGood = false; },   // Madam is earned at the table, not handed over
  };
  V12.openDoc(spec, ()=>{
    S.game._nightClick = true;
    completeObjective('n3_table');
    if(S.game._nightClickGood){
      // only what the page proved goes in ink: the notebook's ticked Monday and the courier's draft are one night
      V12.inkLinks([['e_notebook','e_madam']], true);
      if(typeof unlock === 'function') unlock('night_shift');
      if(typeof playMusic === 'function') playMusic('stealth', { volume:0.4 });
      if(typeof evidenceFlash === 'function') evidenceFlash();
    }
    const good = !!S.game._nightClickGood;
    setTimeout(()=>{
      if(good) toast('A NEW SUSPECT', '"MADAM" — on the operations table', 2600);
      else toast('THE TABLE', 'The notebook and the courier\'s phone are on it. Make the link yourself.', 2800);
      V12.openOps('lagos');
    }, 700);
  });
}
V12.nightClick = theClick;

})();

/* an overheard call is not radio traffic */
V12.wrap('_radioNext', orig => function(){
  const r = orig.apply(this, arguments);
  try{
    const w = document.querySelector('#radio-sub .rs-who');
    const m = w && / · (ON THE [A-Z ]+?)\s*·\s*RADIO\s*$/.exec(w.textContent);
    if(m){ const name = w.textContent.split(' · ')[0]; w.innerHTML = `${name} <span class="rs-tag">· OVERHEARD · ${m[1]}</span>`; }
  }catch(e){}
  return r;
});
