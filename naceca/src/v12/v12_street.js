/* =========================================================================
   NACECA · v12 Phase 2 — stories hiding in the street
   Each district has one person with a story the objective list never
   mentions. You find them by noticing: a voice calling out a deal that is
   too good, a driver arguing about a levy, a student staring at a frozen
   account. Each teaches a real tell, ends on a small choice, and comes back
   later — on your phone at HQ, in the papers, or at the back gate.
   ========================================================================= */
(function(){
'use strict';
const V12 = window.V12;

/* ---------- a person on the street ---------- */
function spawn(kind, x, z, yaw, idle){
  const sc = ENGINE.scene; if(!sc || typeof makeExtra !== 'function') return null;
  const g = makeExtra(kind);
  g.position.set(x, 0, z); g.rotation.y = yaw || 0;
  if(g.userData) g.userData._idle = idle || 'idle';
  sc.add(g); ENGINE.npcs.push(g);
  if(typeof addObstacle === 'function') addObstacle(x, z, 0.75, 0.75);
  return g;
}
const near = (g, r)=>ENGINE.player && g && Math.hypot(ENGINE.player.position.x - g.position.x, ENGINE.player.position.z - g.position.z) < r;
/* case-adjacent things you hear about go in the file without counting toward the operation */
V12.logEvidence = function(ev){
  if(V12.hasEv(ev.id)) return;
  S.game.evidence.push({ id:ev.id, name:ev.name, t:Date.now() });
  if(typeof awardXP === 'function') awardXP(ev.xp || 30);
  if(typeof evidenceFlash === 'function') evidenceFlash();
  toast('IN THE FILE', ev.name.toUpperCase(), 2000);
};

/* a sober portrait for people who have no painted face: a silhouette in their colours */
const STREET_LOOK = {
  ngozi:  { cloth:'#7a2f8f', head:'gele', tag:'TRADER' },
  sani:   { cloth:'#1a78b8', head:'cap',  tag:'TANKER DRIVER' },
  ikenna: { cloth:'#5a4a2a', head:'cap',  tag:'PALM-WINE TAPPER' },
  efe:    { cloth:'#c9bd9b', head:'bare', tag:'UNIBEN STUDENT' },
  blessing:{ cloth:'#c8341c', head:'gele', tag:'BREAD SELLER' },
};
V12.wrap('drawPortrait', orig => function(kind, speaker, mood){
  if(typeof kind === 'string' && kind.indexOf('street:') === 0){
    const L = STREET_LOOK[kind.slice(7)] || { cloth:'#4a5a7a', head:'bare', tag:'' };
    const headPath = L.head === 'gele' ? '<path d="M30 30 Q50 6 72 26 Q78 34 70 38 L30 38 Q24 34 30 30Z" fill="#141a26"/>'
      : L.head === 'cap' ? '<path d="M33 30 Q50 16 67 30 L67 34 L33 34Z" fill="#141a26"/>' : '';
    const wrap = document.getElementById('dialogue-portrait');
    if(wrap){ wrap.innerHTML = `<div class="portrait-frame street-card"><svg viewBox="0 0 100 100" aria-hidden="true">
      <defs><radialGradient id="stbg" cx="50%" cy="38%" r="70%"><stop offset="0" stop-color="#26324a"/><stop offset="1" stop-color="#070b14"/></radialGradient>
      <linearGradient id="strim" x1="0" x2="1"><stop offset="0" stop-color="#d8a64a" stop-opacity="0"/><stop offset="1" stop-color="#f0c878" stop-opacity=".9"/></linearGradient></defs>
      <rect width="100" height="100" fill="url(#stbg)"/>
      <path d="M14 100 Q16 70 50 66 Q84 70 86 100Z" fill="${L.cloth}" opacity=".55"/>
      <path d="M14 100 Q16 70 50 66 Q84 70 86 100Z" fill="#0c111c" opacity=".55"/>
      <ellipse cx="50" cy="44" rx="16" ry="19" fill="#0c111c"/>
      <rect x="44" y="58" width="12" height="10" fill="#0c111c"/>
      ${headPath}
      <path d="M64 30 Q70 44 63 58" stroke="url(#strim)" stroke-width="1.6" fill="none"/>
      <path d="M80 92 Q78 74 58 68" stroke="url(#strim)" stroke-width="1.4" fill="none"/>
      </svg><div class="street-tag">${V12.esc(L.tag)}</div><div class="portrait-vignette"></div></div>`; }
    return;
  }
  return orig.apply(this, arguments);
});
/* painted faces are matched by name: match whole words, so a TOBI line never finds OBI's face */
V12.wrap('paintedPortrait', orig => function(speaker, mood){
  if(typeof PORTRAIT_ART === 'undefined' || !speaker) return null;
  const S_ = ' ' + speaker.toUpperCase().replace(/[^A-Z0-9 ]+/g, ' ') + ' ';
  const hit = SPEAKER_ART.find(([k]) => S_.includes(' ' + k.replace(/[^A-Z0-9 ]+/g, ' ').trim() + ' '));
  if(!hit) return null;
  const id = hit[1];
  return PORTRAIT_ART[`${id}_${mood || 'neutral'}`] || PORTRAIT_ART[`${id}_neutral`]
      || PORTRAIT_ART[Object.keys(PORTRAIT_ART).find(k => k.startsWith(id + '_'))] || null;
});

/* ======================= the five stories ======================= */

/* --- Case 02 · Ikeja: a cooperative that pays thirty percent --- */
DIALOGUE.st_ponzi = [
  { speaker:'SISTER NGOZI', portrait:'street:ngozi',
    text:"Brother! Officer, even you fit join. Grace Divine Cooperative — drop twenty thousand today, collect twenty-six in four weeks. Thirty percent!",
    textEn:"Brother! Officer, even you can join. Grace Divine Cooperative — put in twenty thousand today, collect twenty-six in four weeks. Thirty percent!" },
  { speaker:'AGENT KELECHI', portrait:'kelechi', text:"Thirty percent a month. What does the cooperative do to make that?" },
  { speaker:'SISTER NGOZI', portrait:'street:ngozi',
    text:"Business now! Poultry, crypto, importation… Our founder na man of God. Everybody wey join first don collect their money, ask anybody.",
    textEn:"Business! Poultry, crypto, importing… Our founder is a man of God. Everyone who joined first has been paid, ask anyone.",
    choices:[
      { text:"And who pays the people who joined first?", next:'st_ponzi_warn' },
      { text:"Give me one of those flyers.", next:'st_ponzi_flag' },
      { text:"Not today, ma.", next:'st_ponzi_pass' },
    ] },
];
DIALOGUE.st_ponzi_warn = [
  { speaker:'SISTER NGOZI', portrait:'street:ngozi', mood:'evasive', text:"…The new members' contributions. But that one na how cooperative dey work!",
    textEn:"…The new members' contributions. But that's how a cooperative works!" },
  { speaker:'AGENT KELECHI', portrait:'kelechi', effect:{ publicTrust:+3 },
    text:"If your profit is the next person's deposit, it ends the day people stop joining — and the last ones in lose everything. That's a Ponzi, ma. Whoever runs it knows." },
  { speaker:'NACECA SYSTEM', text:'The man beside her folds his form in half and puts it back in her hand.' },
];
DIALOGUE.st_ponzi_flag = [
  { speaker:'SISTER NGOZI', portrait:'street:ngozi', text:"Take two! Bring your people. Office dey for Allen Avenue, second floor.",
    textEn:"Take two! Bring your people. The office is on Allen Avenue, second floor." },
  { speaker:'AGENT KELECHI', portrait:'kelechi', text:"(Allen Avenue. A founder, a bank account, thirty percent a month. I'll pass this to the fraud desk.)" },
];
DIALOGUE.st_ponzi_pass = [ { speaker:'SISTER NGOZI', portrait:'street:ngozi', text:"Your loss o! Twenty thousand today, twenty-six for four weeks!" } ];

/* --- Case 04 · Benin Bypass: a levy with no receipt --- */
DIALOGUE.st_levy = [
  { speaker:'ALHAJI SANI · TANKER DRIVER', portrait:'street:sani', mood:'angry',
    text:"Officer, see wahala. One boy with ID card collect five thousand from every truck for 'union levy'. No receipt. Him say na new government rule.",
    textEn:"Officer, look at this trouble. A boy with an ID card took five thousand from every truck for a 'union levy'. No receipt. He says it's a new government rule." },
  { speaker:'AGENT KELECHI', portrait:'kelechi', text:"Show me what he gave you." },
  { speaker:'ALHAJI SANI · TANKER DRIVER', portrait:'street:sani',
    text:"This card. 'Edo Transport Revenue Agent'. E get hologram and everything.", textEn:"This card. 'Edo Transport Revenue Agent'. It even has a hologram." },
  { speaker:'AGENT KELECHI', portrait:'kelechi',
    text:"The hologram is a sticker — it lifts at the corner. No revenue code, and the number is a mobile line. A real levy comes with an official receipt.",
    choices:[
      { text:"Describe him. AKS can pick him up before the next truck.", effect:{ agencyFavour:+2 }, next:'st_levy_report' },
      { text:"Pay nobody without an official receipt — and tell the other drivers.", effect:{ publicTrust:+3 }, next:'st_levy_warn' },
      { text:"I can't take this on today, Alhaji.", next:'st_levy_pass' },
    ] },
];
DIALOGUE.st_levy_report = [
  { speaker:'ALHAJI SANI · TANKER DRIVER', portrait:'street:sani', text:"Yellow shirt, Bajaj okada, him dey work the queue from the filling station side. God bless you." },
  { speaker:'AGENT KELECHI', portrait:'kelechi', text:"(Inspector Chidi will want this. Fake officials on his bypass make his men look like thieves.)" },
];
DIALOGUE.st_levy_warn = [
  { speaker:'ALHAJI SANI · TANKER DRIVER', portrait:'street:sani', text:"Receipt or nothing. I go tell everybody for the queue. You be correct officer.",
    textEn:"A receipt or nothing. I'll tell everyone in the queue. You're a good officer." },
];
DIALOGUE.st_levy_pass = [ { speaker:'ALHAJI SANI · TANKER DRIVER', portrait:'street:sani', mood:'angry', text:"Hmm. Na so una dey talk every time." } ];

/* --- Case 05 · Ozalla: an old man who saw the cars --- */
DIALOGUE.st_tapper = [
  { speaker:'PAPA IKENNA · PALM-WINE TAPPER', portrait:'street:ikenna', text:"You people came for the shrine. I know. Sit, drink small… No? Duty. Hm.",
    choices:[
      { text:"Good morning, Papa. How is the tapping this season?", next:'st_tapper_greet' },
      { text:"Have you seen vehicles on this path at night?", next:'st_tapper_blunt' },
    ] },
];
DIALOGUE.st_tapper_greet = [
  { speaker:'PAPA IKENNA · PALM-WINE TAPPER', portrait:'street:ikenna',
    text:"Ah. Somebody still greets. The wine is sweet this year — the rain was good to us." },
  { speaker:'PAPA IKENNA · PALM-WINE TAPPER', portrait:'street:ikenna', effect:{ intel:+8 },
    text:"Two nights ago, three big vehicles, no headlights, came by the bush road. Asaba plates. One carried a generator and plenty cartons. They paid my son to keep his mouth closed." },
  { speaker:'AGENT KELECHI', portrait:'kelechi', text:"Asaba plates. Thank you, Papa. Your son did nothing wrong by talking to me." },
];
DIALOGUE.st_tapper_blunt = [
  { speaker:'PAPA IKENNA · PALM-WINE TAPPER', portrait:'street:ikenna', mood:'evasive', effect:{ intel:+2 },
    text:"I see plenty things, young man. My eyes are tired at night. Big tyres, maybe. Big tyres." },
];

/* --- Case 07 · UNIBEN gate: a side job that froze an account --- */
DIALOGUE.st_mule = [
  { speaker:'EFE · UNIBEN STUDENT', portrait:'street:efe', mood:'afraid',
    text:"Officer, please — my account is frozen. The bank says 'suspicious inflows'. I only did my side job." },
  { speaker:'AGENT KELECHI', portrait:'kelechi', text:"What side job?" },
  { speaker:'EFE · UNIBEN STUDENT', portrait:'street:efe',
    text:"Data entry for a payroll company. They pay money into my account, I transfer it to the 'staff' on their list, I keep ten percent. My friend Osas got me the job." },
  { speaker:'AGENT KELECHI', portrait:'kelechi', text:'__OSAS__' },
  { speaker:'EFE · UNIBEN STUDENT', portrait:'street:efe', mood:'afraid',
    text:"He stopped coming to lectures last week. He said one of the payrolls had a name on it that 'should not be there'.",
    choices:[
      { text:"Come and give a statement. You're a witness, not a suspect.", next:'st_mule_witness' },
      { text:"Stop moving that money today. Go to your bank with a lawyer.", effect:{ publicTrust:+2 }, next:'st_mule_advise' },
      { text:"Later. We have a tower to get back online.", next:'st_mule_pass' },
    ] },
];
DIALOGUE.st_mule_witness = [
  { speaker:'AGENT KELECHI', portrait:'kelechi', effect:{ intel:+10 },
    text:"Money in, money out, ten percent for you — that's money muling. They use your name so theirs never shows. Write down every transfer you remember." },
  { speaker:'EFE · UNIBEN STUDENT', portrait:'street:efe', text:"I have the screenshots. All of them. And the company's WhatsApp number." },
];
DIALOGUE.st_mule_advise = [
  { speaker:'AGENT KELECHI', portrait:'kelechi',
    text:"Receiving money and passing it on for a cut is laundering, and the account in your name is the one the law sees. Stop now, and tell the bank everything." },
];
DIALOGUE.st_mule_pass = [ { speaker:'EFE · UNIBEN STUDENT', portrait:'street:efe', mood:'afraid', text:"…Okay. Okay." } ];

/* --- Case 08 · Akintola Close: the bread seller sees everything --- */
DIALOGUE.st_bread = [
  { speaker:'MAMA BLESSING · BREAD SELLER', portrait:'street:blessing',
    text:"Agege bread, hot! Butter bread! …You're not from this street.",
    choices:[
      { text:"Just hungry, ma. Two loaves, please.", next:'st_bread_buy' },
      { text:"NACECA. Who lives behind the blue gate?", next:'st_bread_badge' },
    ] },
];
DIALOGUE.st_bread_buy = [
  { speaker:'MAMA BLESSING · BREAD SELLER', portrait:'street:blessing', text:"Two hundred. God bless your hand." },
  { speaker:'MAMA BLESSING · BREAD SELLER', portrait:'street:blessing', mood:'evasive',
    text:"That blue-gate house — quiet tenants. They pay cash every Friday and greet nobody. Their generator boy opens the back gate at nine when he goes to buy fuel. Every night, like clock." },
  { speaker:'AGENT KELECHI', portrait:'kelechi', text:"(Nine o'clock. The back gate.)" },
];
DIALOGUE.st_bread_badge = [
  { speaker:'MAMA BLESSING · BREAD SELLER', portrait:'street:blessing', mood:'evasive',
    text:"Me? I no know anybody. I dey sell bread. You wan buy or you wan go?", textEn:"Me? I don't know anybody. I sell bread. Are you buying or going?" },
];

const STORIES = {
  m2: { id:'ponzi', name:'SISTER NGOZI', kind:'gele_purple', pos:[-6.4, -13.2], yaw:Math.PI*0.62, idle:'talk', label:'Listen to the flyer woman', range:2.6,
        extra:{ kind:'cap_guy', pos:[-5.1, -14.4], yaw:-0.9, idle:'idle' },
        bark:{ r:9, who:'SISTER NGOZI · ON THE STREET', text:'Twenty thousand today, twenty-six in four weeks! Grace Divine Cooperative — God don bless am!' },
        start:'st_ponzi',
        done:{ st_ponzi_warn:'warned', st_ponzi_flag:'flagged', st_ponzi_pass:'ignored' },
        after:{ warned:'"Thirty percent… God don bless am, abi?" She is folding her flyers away.', flagged:'Allen Avenue, second floor. The fraud desk has the flyer.', ignored:'"Twenty thousand today, twenty-six in four weeks!"' } },
  m4: { id:'levy', name:'ALHAJI SANI', kind:'fila_man', pos:[-17.6, 6.9], yaw:2.06, idle:'talk', label:'Ask the tanker driver what\'s wrong', range:2.6,
        bark:{ r:8, who:'ALHAJI SANI · ON THE STREET', text:'Five thousand for every truck and no receipt! Which kind levy be this?' },
        start:'st_levy',
        done:{ st_levy_report:'reported', st_levy_warn:'warned', st_levy_pass:'ignored' },
        after:{ reported:'"Yellow shirt, Bajaj okada."', warned:'"Receipt or nothing."', ignored:'He is counting what he has left.' } },
  m5: { id:'tapper', name:'PAPA IKENNA', kind:'fila_man', pos:[3.6, 5.6], yaw:-Math.PI/2, idle:'sit', seat:true, label:'Greet the palm-wine tapper', range:2.4,
        start:'st_tapper',
        done:{ st_tapper_greet:'respect', st_tapper_blunt:'brusque' },
        after:{ respect:'"Asaba plates. Big tyres. Go well, my son."', brusque:'"Big tyres, maybe."' } },
  m7: { id:'mule', name:'EFE', kind:'student', pos:[-4.8, 14.3], yaw:Math.PI, idle:'phone', label:'Talk to the worried student', range:2.4,
        bark:{ r:8, who:'A STUDENT · ON THE PHONE', text:'…Frozen? Since morning? But I only did the data-entry job!' },
        start:'st_mule',
        done:{ st_mule_witness:'witness', st_mule_advise:'advised', st_mule_pass:'ignored' },
        after:{ witness:'"I\'ll bring the screenshots to your office."', advised:'"I\'m going to the bank now."', ignored:'He is still on the phone to the bank.' } },
  m8: { id:'bread', name:'MAMA BLESSING', kind:'bread_seller', reuse:[4.6, 4.1], pos:[4.6, 4.1], yaw:Math.PI, idle:'idle', label:'Buy bread from Mama Blessing', range:2.4,
        bark:{ r:7, who:'MAMA BLESSING · ON THE STREET', text:'Agege bread! Hot hot! Butter bread!' },
        start:'st_bread',
        done:{ st_bread_buy:'friendly', st_bread_badge:'badge' },
        after:{ friendly:'"Nine o\'clock. Like clock."', badge:'"You wan buy or you wan go?"' } },
};
V12.STORIES = STORIES;

function outcomeOf(st){
  // the branch the conversation ended on tells us what Kelechi chose
  const seen = V12.mem().seen;
  for(const k in st.done) if(seen[k]) return st.done[k];
  return null;
}
/* which branch a conversation took: choices swap DLG.script without a new
   startDialogue, so recognise the branch by the script object itself */
const SCRIPT_KEY = new Map();
V12.trackScripts = function(prefixRe){ for(const k in DIALOGUE){ if(prefixRe.test(k) && Array.isArray(DIALOGUE[k])) SCRIPT_KEY.set(DIALOGUE[k], k); } };
V12.trackScripts(/^st_/);
V12.wrap('renderDialogueLine', orig => function(){
  try{ const k = DLG.script && SCRIPT_KEY.get(DLG.script); if(k) V12.mem().seen[k] = 1; }catch(e){}
  return orig.apply(this, arguments);
});

function consequences(st, out){
  if(st.id === 'mule' && out === 'witness') V12.logEvidence({ id:'efe_statement', name:'Efe\'s Statement — Students Paid to Move "Payroll" Money', xp:60 });
  if(st.id === 'bread' && out === 'friendly'){ S.game.flags.backgate_tip = true; if(!S.game.flags.backgate_src) S.game.flags.backgate_src = 'bread'; toast('THE BACK GATE', 'Nine o\'clock: the generator boy leaves it open', 2600); }
  if(st.id === 'levy' && out === 'reported') S.game.intelScore = (S.game.intelScore || 0) + 5;
  if(st.id === 'tapper' && out === 'respect') S.game.flags.tapper_asaba = true;
}

function place(mid){
  const st = STORIES[mid]; if(!st || !ENGINE.scene) return;
  let g = null;
  if(st.reuse){
    const m = n => (n && n.isObject3D) ? n : (n && n.mesh);
    g = (ENGINE.npcs || []).map(m).find(o => o && o.position && Math.hypot(o.position.x - st.reuse[0], o.position.z - st.reuse[1]) < 0.6) || null;
  }
  if(!g) g = spawn(st.kind, st.pos[0], st.pos[1], st.yaw, st.idle);
  if(!g) return;
  if(g.userData) g.userData._idle = st.idle || g.userData._idle;
  if(st.seat){
    // a palm-trunk log to sit on, and his gourd
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 1.3, 10), new THREE.MeshStandardMaterial({ color:'#4a3420', roughness:0.95 }));
    log.rotation.z = Math.PI/2; log.rotation.y = st.yaw; log.position.set(st.pos[0], 0.2, st.pos[1]); ENGINE.scene.add(log);
    const gourd = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), new THREE.MeshStandardMaterial({ color:'#b08a4a', roughness:0.8 }));
    gourd.position.set(st.pos[0] + 0.45, 0.14, st.pos[1] + 0.25); ENGINE.scene.add(gourd);
  }
  if(st.extra) spawn(st.extra.kind, st.extra.pos[0], st.extra.pos[1], st.extra.yaw, st.extra.idle);
  const done = ()=>V12.street(st.id) != null;
  ENGINE.interactables.push({
    mesh:g, label:st.label, verb:'talk', range:st.range || 2.4, labelY:1.6, optional:true, _street:st.id,
    onInteract:()=>{
      if(done()){ toast(st.name, st.after[V12.street(st.id)] || '…', 2200); return; }
      if(st.id === 'mule'){
        const line = DIALOGUE.st_mule[3];
        line.text = V12.who.heardOsas() ? 'Osas? Osas Ehigie? He left a voicemail at our office about a payroll.'
          : (V12.who.metEhigie() ? 'Osas Ehigie? His mother is at that gate right now.' : 'Osas who?');
      }
      for(const k in st.done) delete V12.mem().seen[k];
      V12.log('street_open', { id:st.id, m:mid });
      startDialogue(st.start, ()=>{
        const out = outcomeOf(st) || 'ignored';
        V12.street(st.id, out);
        consequences(st, out);
        if(out !== 'ignored' && out !== 'brusque' && out !== 'badge' && typeof sfxEvidence === 'function') sfxEvidence();
      });
    },
  });
  st._g = g; st._barked = false;
}

/* scenes are ready when the side quests are set up */
V12.wrap('sideSetup', orig => function(mid){
  const r = orig.apply(this, arguments);
  try{ place(mid); }catch(e){ console.warn('[v12] street story', e); }
  return r;
});
/* overheard: walk past and you hear the pitch */
V12.wrap('sideTick', orig => function(dt){
  const r = orig.apply(this, arguments);
  try{
    const st = STORIES[S.game.currentMission];
    if(st && st.bark && st._g && !st._barked && V12.street(st.id) == null && near(st._g, st.bark.r) && !isOverlayOpen()){
      st._barked = true; V12.say(st.bark.who, st.bark.text, Math.max(3000, st.bark.text.length * 52));
    }
  }catch(e){}
  return r;
});

})();
