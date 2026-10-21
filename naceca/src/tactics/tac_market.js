/* =========================================================================
   NACECA · src/tactics/tac_market.js — the Ikeja market (M2): KC looks up, interception,
   Uche on the ground, Tunde buys the route.
   Owner: Team B. DESIGN-tactics.md §1, §2.2, §3, §4, §5.3; market.md (+ its critique).

   Everything here is a V12.wrap, a property wrap or an in-layer mutation of data. No existing file
   is edited; deleting this file (and its build.py line) gives today's market back.
   · KC's watcher (TAC.sight): the phone / look-up cycle, Heat and wariness, the alarm rules
     (before the scan an alarm never sends him running; after it, within 6 m he bolts).
   · Tunde: one sight model for the meeting (TAC.sight.probe, range 15), the bark, the inserted
     habit / "he's seen us" line, the quiet choice buys KC's route, the loud one makes him look.
   · The scan: exposure at the press (his attention at the hand, or your body in plain view),
     HE SAW YOU and the bolt 0.8 s after the document closes; a fumble or a forced bypass raises him.
   · The confront router (legacy / seen / range bolt / soft / cold); CAUGHT COLD captures the
     original confront and opens the canon market_runner with no chase.
   · The chase: CUT HIM OFF, Uche's post (corner / back gate / van), the moving-Uche rule, the veer,
     the grab and its takedown beat, BOXED IN, the van callouts, Pursuit Lines, the lane bump copy.
   · Telemetry through V12.log only (§4): enc m2_tunde, enc m2_kc, order, ally_done, m2_summary.
   TAC.m2 is exposed for tests: cfg, run(), kc(), uche(), post(id), setPhase(name, secs).
   ========================================================================= */
(function(){
'use strict';
const TAC = window.TAC;
if(!TAC || !TAC.v || TAC.m2) return;
if(typeof buildSceneMarket !== 'function') return;
const V = () => window.V12 || null;
const wrap = (name, make) => (V() && V12.wrap) ? V12.wrap(name, make) : false;
const eng = () => (typeof ENGINE !== 'undefined') ? ENGINE : null;
const G = () => (typeof S !== 'undefined' && S && S.game) ? S.game : {};
const MC = () => G().moralChoices || {};
const FL = () => { const g = G(); if(!g.flags || typeof g.flags !== 'object') g.flags = {}; return g.flags; };
const hyp = Math.hypot, PI = Math.PI;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const r1 = x => Math.round((+x || 0) * 10) / 10;
const isM2 = () => TAC.mission() === 'm2';
const kcMesh = () => { const e = eng(); return e ? e._marketKC : null; };
const english = () => typeof SETTINGS !== 'undefined' && SETTINGS.lang === 'english';
const trust = () => { try{ return S.player.reputation.publicTrust; }catch(e){ return 0; } };
const heat = () => { try{ return V() && V12.heat ? +V12.heat() || 0 : 20; }catch(e){ return 20; } };
const has = id => !!(V() && V12.has && V12.has(id));
const log = (type, d) => { try{ if(V() && V12.log) V12.log(type, d); }catch(e){ TAC._err(e); } };
const sayUche = (text, ms, o) => { try{ if(typeof radioLine === 'function') radioLine('SGT. UCHE', text, ms, o); }catch(e){ TAC._err(e); } };
const overlay = () => typeof isOverlayOpen === 'function' && isOverlayOpen();
const puzzleOpen = () => { const p = document.getElementById('screen-puzzle'); return !!(p && p.classList.contains('show')); };
const miniOpen = () => typeof miniIsOpen === 'function' && miniIsOpen();
const curObj = () => { try{ const o = (G().objectives || []).find(x => !x.done); return o ? o.id : null; }catch(e){ return null; } };
const reduced = () => typeof SETTINGS !== 'undefined' && SETTINGS.reduceMotion === 'on';
const hapt = p => { try{ if(typeof haptic === 'function') haptic(p); }catch(e){} };

/* ---------- the numbers (DESIGN §5.3; tuning constants confirmed by tac_m2_matrix) ---------- */
const CFG = {
  off:false,                 // tests: TODAY (the router and every chase hook pass straight through)
  ribbonCut:'off',           // M-B1: the cut ribbon ships off in Build 1
  kc:{ eyeH:1.5, range:{ lit:12, dark:6 }, hearing:0.6, phone:[4.6, 5.4, 4.2, 5.0], phoneAtt:0.35, look:1.8, sweep:0.15,
       heat:{ from:50, to:100, phone:0.75, look:0.4 }, wary:{ phone:0.75, look:0.4 },
       calmAfter:4.0, calmTo:50, boltRange:6.0, scanBolt:0.8, legacy:1.0, seenAtt:0.9, exposedDist:3.0 },
  open:{ gap:2.5, soft:20 },
  tunde:{ meet:3.0, range:15, bark:4.0, body:0.3, seen:40, loud:20 },
  uche:{ start:[-2.4, 11.6], yaw:2.3, range:2.4, jog:3.0, run:3.6, veer:4.5, veerCos:0.5, sameWay:0.5, grab:1.9, boxR:5, boxScore:-1,
         calls:4, callLos:14, beat:1.4, beatFar:6, place:1.6, crouch:0.8, kneel:0.9, near:4 },
  cut:{ r:3.5, cos:Math.cos(40 * PI / 180), vmax:1.0, win:0.2, t0:1.5 },
  gate:[12.6, -20.5],
};
// the minimap fills tac_market.css keys on (scoped to body.tac-m2): Uche's own dot (not the van's #5dd07a), his post ring,
// the back gate Tunde named
const UCHE_DOT = '#5dd07b', POST_RING = '#0b6e4f', GATE_RING = '#6b6b63';
// Uche's chain: the van → round the north end → down the back lane → the corner → the back gate (DESIGN §5.3).
// Every post is a point on it, so a re-post (even mid-jog) just walks the chain forward or back.
const CHAIN = [[-2.4, 11.6], [-2.0, 17.2], [7.6, 17.5], [11.43, 17.5], [11.43, 11.4], [12.6, 7.4], [13.3, -2.0], [13.3, -6.4], [12.6, -7.5],
  [13.0, -12.5], [13.4, -16.0], [13.4, -18.4], [12.1, -19.9]];
const POST_AT = { van:0, corner:8, back:12 };
const POST_YAW = { van:CFG.uche.yaw, corner:0, back:0 };
const ARC = (() => { const a = [0]; for(let i = 1; i < CHAIN.length; i++) a.push(a[i - 1] + hyp(CHAIN[i][0] - CHAIN[i - 1][0], CHAIN[i][1] - CHAIN[i - 1][1])); return a; })();
const chainAt = s => {
  s = clamp(s, 0, ARC[ARC.length - 1]);
  for(let i = 1; i < ARC.length; i++) if(s <= ARC[i] + 1e-9){
    const a = CHAIN[i - 1], b = CHAIN[i], k = (s - ARC[i - 1]) / Math.max(1e-9, ARC[i] - ARC[i - 1]);
    return { x:a[0] + (b[0] - a[0]) * k, z:a[1] + (b[1] - a[1]) * k, dx:b[0] - a[0], dz:b[1] - a[1] };
  }
  const L = CHAIN[CHAIN.length - 1]; return { x:L[0], z:L[1], dx:0, dz:1 };
};

/* ---------- copy ---------- */
const T_ARRIVAL = "I'm at my spot across the road from him.";
const BARK = { pg:'Oga, the boy fit see you for road.', en:'Sir, the boy can see you out in the road.' };
const WHY_TUNDE = 'He saw you talking to Tunde in the road';
const WHY_SCAN = "He saw you lift his phone. He's running.";
// the opening toasts say why he ran, not what to do (today's canon toast keeps its own "Sprint")
const TOAST_SOFT = "He'd clocked you — no time to grab a tray.";
const TOAST_BOLT = 'He made you from his counter.';
const T = {
  seenLine:{ speaker:'INFORMANT — TUNDE', mood:'afraid', text:'He dey look this way, oga! E don see us. But e no fit hear wetin we dey talk.',
             textEn:"He's looking this way, sir! He's seen us. He can't hear what we're saying, though.", _tac:'seen' },
  habitLine:{ speaker:'INFORMANT — TUNDE', text:'That boy dey watch the road. Im back? E no dey look am at all.',
              textEn:'That boy watches the road. He never looks behind his stand.', _tac:'habit' },
};
const DLG_NEW = {
  market_intro_quiet:[{ speaker:'INFORMANT — TUNDE',
    text:'God bless you, oga. If he run, he go take the lane behind im stall, cut through the second gap, then make for the back gate. Okada dey park for front of am.',
    textEn:"God bless you, sir. If he runs, he'll take the lane behind his stall, cut through the second gap and make for the back gate. There's an okada parked across it." }],
  market_intro_loud:[{ speaker:'INFORMANT — TUNDE', mood:'afraid',
    text:'Ehn! Oga, you wan make dem kill me? Look am — e don see me dey look am.',
    textEn:'Sir, do you want them to kill me? Look — he saw me looking at him.' }],
  market_uche:[
    { speaker:'SQUAD LEAD — SGT. UCHE', portrait:'sergeant', text:"There's a lane behind his stall. It turns in at the second gap and runs down to a gate at the far end." },
    { speaker:'SQUAD LEAD — SGT. UCHE', text:'Where do you want me when he runs, sir?', choices:[
      { text:'The back-lane corner. Let him see you there.', effect:{ flag:{ m2_post:'corner' } }, next:null },
      { text:'The back gate. Stay out of sight.', _base:'The back gate. Stay out of sight.', effect:{ flag:{ m2_post:'back' } }, next:null },
      { text:'Stay with the van. Call it on the radio.', effect:{ flag:{ m2_post:'van' } }, next:null },
    ] },
  ],
};
const UCHE_AT_VAN = "I'm with the van, sir.";
const POST_ANSWER = { corner:"Back-lane corner. He'll see me if he comes down that lane.", back:"Back gate. He won't see me till he's on top of me.",
  van:"I'll stay on the van and call it." };
const PURSUIT_LINE = "I'm cutting through the back — push him towards me!";
const PURSUIT_POST = { corner:'Coming up the back lane — push him towards me!', back:"I'm holding the back gate — drive him down to me!",
  van:'Cutting across from the van — push him towards me!' };
const HINTS = {
  post:['m2_post', "Post Sgt. Uche before you move — he's by the van.", "Post Sgt. Uche before you move — he's by the van."],
  side:['m2_side', 'Come at his counter from the side or from behind — he watches the road.', 'Come at his counter from the side or from behind — he watches the road.'],
  bump:['m2_bump', 'Cut across, not down the lanes — the traders stand in the lanes.', 'Cut across, not down the lanes — the traders stand in the lanes.'],
};

/* ---------- dialogue data (in-layer mutation; config/dialogue.js is untouched) ---------- */
let PRISTINE = null;
try{
  if(typeof DIALOGUE !== 'undefined' && DIALOGUE.market_intro && DIALOGUE.market_intro.length >= 2){
    PRISTINE = DIALOGUE.market_intro.slice(0, 2);
    const ch = PRISTINE[1].choices || [];
    // the choice buys the route: effect.flag is assigned by applyEffect without the two-tap arming
    if(ch[0]){ ch[0].effect = Object.assign({}, ch[0].effect, { flag:{ m2_tunde:'quiet' } }); ch[0].next = 'market_intro_quiet'; }
    if(ch[1]){ ch[1].effect = Object.assign({}, ch[1].effect, { flag:{ m2_tunde:'loud' } }); ch[1].next = 'market_intro_loud'; }
    for(const k of Object.keys(DLG_NEW)) DIALOGUE[k] = DLG_NEW[k];
  }
}catch(e){ TAC._err(e); }
// Pursuit Lines: the capability's text says what you will see (CAPS is private: SKILLS.fieldcraft holds the same objects)
try{
  const pu = (typeof SKILLS !== 'undefined' && Array.isArray(SKILLS.fieldcraft)) ? SKILLS.fieldcraft.find(s => s && s.id === 'pursuit') : null;
  if(pu) pu.desc = 'Uche cuts corners in foot chases — in Ikeja you see him run the lanes for the runner. Runners lose ground.';
}catch(e){ TAC._err(e); }

/* ---------- this run (rebuilt at every market build) ---------- */
let R = null, runN = 0;
function freshRun(){
  return { id:++runN, kcW:null, kcIt:null, origConfront:null, awake:false, awakeAt:null, clock:0, watchSecs:0,
    phase:'phone', phaseT:0, phaseLen:1, cyc:0, wary:false, unseenAlarm:0, lastLevel:'calm',
    bolt:null, opening:null, capture:false, capCfg:null, resolving:false, scan:null, scanSeen:false,
    press:null, approach:null, how:null, outcome:null,
    tunde:{ mesh:null, tested:false, side:'far', seen:false, dist:null, ang:null, crowd:false, bark:false, choice:null, tip:false, habit:false, wary:false },
    uche:{ mesh:null, it:null, poi:null, ring:null, post:'van', posted:false, s:0, target:0, moving:false, arrived:true, crouched:false,
      orderT:null, pursue:false, role:null, goal:null, poiT:0, kneel:false, dir:null, lastCall:null, veerMoving:false,
      tasks:{ arrive:0, veer:0, act:0, callout:0 } },
    chase:null, stats:{ alarms:0, notices:0, suspPeak:0, eyeSecs:0, crouchNear:0, trust0:trust() },
    logged:{ kc:false, sum:false, tunde:false }, hint:{ post:false, side:false, bump:false }, text:false,
    gatePoi:null, subs:[], beat:null, beatCam:false };
}

/* ---------- KC: phases, attention, facing ---------- */
const H = () => clamp((heat() - CFG.kc.heat.from) / (CFG.kc.heat.to - CFG.kc.heat.from), 0, 1);
const phoneMul = () => { let m = 1 - (1 - CFG.kc.heat.phone) * H(); if(R && R.wary) m = Math.min(m, CFG.kc.wary.phone); return m; };
const lookAdd = () => { let a = CFG.kc.heat.look * H(); if(R && R.wary) a = Math.max(a, CFG.kc.wary.look); return a; };
function startPhase(name, secs){
  if(name === 'phone'){ R.phase = 'phone'; R.phaseLen = R.phaseT = secs != null ? secs : CFG.kc.phone[R.cyc % CFG.kc.phone.length] * phoneMul(); R.cyc++; }
  else { R.phase = 'lookup'; R.phaseLen = R.phaseT = secs != null ? secs : CFG.kc.look + lookAdd(); }
}
const level = () => (R && R.kcW) ? R.kcW.state.level : 'calm';
function attention(){
  if(!R) return 1;
  if(level() !== 'calm') return 1;                      // noticed: phone down, watching, until he is calm again
  return R.phase === 'phone' ? CFG.kc.phoneAtt : 1;
}
const sweep = () => (R && R.phase === 'lookup') ? CFG.kc.sweep * Math.sin(2 * PI * (1 - R.phaseT / Math.max(1e-6, R.phaseLen))) : 0;
const facing = () => -PI / 2 + sweep();
const exposedNow = st => !!st && (!!st.seen || (!!st.inCone && !!st.inRange && st.los === 'clear' && st.dist != null && st.dist < CFG.kc.exposedDist));
function watchedActive(){
  if(!R || !R.awake || !isM2()) return false;
  if(typeof CHASE !== 'undefined' && CHASE.active) return false;
  if(MC().market_runner || R.resolving) return false;
  return true;
}
function setArms(m, l, r){ const u = m && m.userData; if(!u) return; if(u.armL && l != null) u.armL.rotation.x = l; if(u.armR && r != null) u.armR.rotation.x = r; }
const raiseHands = m => setArms(m, -2.6, -2.6);
function faceKC(){
  const K = kcMesh(), P = ENGINE.player && ENGINE.player.position; if(!K || !P) return;
  // the canon onCaught turns him by π (market.js:163): set it so he ends facing Kelechi
  K.rotation.y = Math.atan2(P.x - K.position.x, P.z - K.position.z) - PI;
}
// the bearing of Kelechi off KC's BASE facing (−x): front inside his 100° cone, behind past 135°
function sideOf(){
  const K = kcMesh(), P = ENGINE.player && ENGINE.player.position; if(!K || !P) return null;
  const dx = P.x - K.position.x, dz = P.z - K.position.z, d = hyp(dx, dz); if(d < 1e-3) return 'front';
  const a = Math.acos(clamp(-dx / d, -1, 1)) * 180 / PI;
  return a <= 50 ? 'front' : a < 135 ? 'side' : 'behind';
}

/* ---------- the build ---------- */
function setup(){
  const e = eng(), K = kcMesh(); if(!e || !K) return;
  const g = G(), fresh = !g._marketTunde;
  if(fresh){ const f = FL(); delete f.m2_tunde; delete f.m2_met; delete f.m2_post; delete f.m2_how; }
  R = freshRun();
  const run = R;
  R.awake = !fresh;                               // a run restored after Tunde: awake, calm, no history
  if(R.awake){
    // ...but what the meeting decided is kept: seen there, he stays wary for the rest of the run (DESIGN M-M8)
    const met = FL().m2_met || {}, tu = R.tunde;
    R.wary = tu.wary = !!met.seen;
    tu.choice = FL().m2_tunde || null; tu.tip = tu.choice === 'quiet'; tu.habit = !!met.habit;
    R.awakeAt = 0; startPhase('phone'); places();
  }
  if(K.userData) K.userData._idle = 'idle';      // art_pass_v8.js:2019 randomises it to 'talk'
  try{ document.body.classList.add('tac-m2'); }catch(err){}      // tac_market.css's minimap marks apply in the market only
  R.tunde.mesh = ((e.interactables || []).find(i => i.label === 'Speak with Informant Tunde') || {}).mesh || null;
  // the watcher (DESIGN §5.3)
  const traders = (e._marketCrowd || []).filter(m => m && !(m.userData && m.userData.target));
  if(TAC.sight && TAC.sight.watch){
    R.kcW = TAC.sight.watch({ id:'kc', enc:'m2_kc', mesh:K, he:'He', eyeH:CFG.kc.eyeH, fov:100, range:{ lit:CFG.kc.range.lit, dark:CFG.kc.range.dark },
      hearing:CFG.kc.hearing, surface:'on the street', crowd:() => traders, facing, attention, active:() => run === R && watchedActive(),
      onLevel:(lv) => { if(run !== R) return; if(lv === 'notice' && R.lastLevel === 'calm') R.stats.notices++; if(lv === 'alarm') R.stats.alarms++; R.lastLevel = lv; },
      logExtra:() => ({ phase:run.phase, scanned:!!G()._marketScanned, post:run.uche.post }) });
  }
  // the confront router replaces KC's onInteract; the original stays as origConfront
  const it = (e.interactables || []).find(i => i.label === 'Confront teen suspect' && i.mesh === K);
  if(it && !it._tacRouter){
    R.origConfront = it.onInteract;
    it._tacRouter = true;
    it.onInteract = function(self){ return confront(this, self, null); };
    it._tacOrig = R.origConfront;
  } else if(it){ R.origConfront = it._tacOrig; }
  R.kcIt = it || null;
  buildUche(fresh);
  // spent (DESIGN §3.4, final owner B)
  TAC.interact.spent('Confront teen suspect', () => isM2() && (!G()._marketScanned || !!MC().market_runner || !!(R && R.resolving)));
  TAC.interact.spent('Post Sgt. Uche', () => isM2() && (!G()._marketTunde || !!(typeof CHASE !== 'undefined' && CHASE.active) || !!MC().market_runner || !!(R && R.resolving)));
  // 10 Hz decisions after the sight step; movement every frame; dropped at the next scene
  R.subs.push(TAC.onTick(dt => { if(run === R) tick(dt); }, { order:5 }));
  R.subs.push(TAC.onFrame(dt => { if(run === R) frame(dt); }, { order:5 }));
  R.subs.push(TAC.onScene(() => teardown(run), { order:10 }));
  if(!fresh && FL().m2_tunde === 'quiet') gateRing();
}
// the why-line's places (market.md §3.1), set when KC wakes: he is the only watcher in the market, and until Tunde has
// pointed him out nobody is watching. The zone name carries its preposition (the grammar puts it straight after the verb);
// the road is not an `open` zone, so a player standing still on it reads "He can see you on the open road, standing".
function places(){
  if(!TAC.sight || !TAC.sight.zones) return;
  TAC.sight.zones([
    { name:'by the van', rect:[-2, 3.5, 9, 17] },
    { name:"at Tunde's spot", rect:[-9, -4, -5, 1] },
    { name:'on the open road', rect:[-4, 4, -23.5, 23.5] },
    { name:'by his counter', rect:[5.2, 9.2, 2.2, 5.8] },
    { name:'on the stall fronts', rect:[4, 9, -23.5, 23.5] },
    { name:'in the back lane', rect:[11.2, 14.6, -23.5, 23.5] },
  ]);
  if(TAC.sight.lights) TAC.sight.lights({ ambient:'lit' });
}
function teardown(run){
  if(!run) return;
  try{ document.body.classList.remove('tac-m2'); }catch(e){}
  for(const off of run.subs) try{ off(); }catch(e){}
  run.subs.length = 0;
  if(run.beat){ clearTimeout(run.beat); run.beat = null; }
  if(run.beatCam){ try{ if(typeof TPCAM !== 'undefined') TPCAM.override = null; }catch(e){} run.beatCam = false; }
  if(R === run) R = null;
}

/* ---------- Uche: the mesh, the post, the chain ---------- */
function buildUche(fresh){
  const e = ENGINE, U = R.uche;
  if(typeof buildNPCMesh !== 'function' || !e.scene) return;
  const m = buildNPCMesh('#5a3818', '#1a2a18', '#1a2a18', '#0a0a08', { hair:'crop', beard:true, longSleeve:true });
  try{ if(typeof addVest === 'function') addVest(m, '#0b1a3a'); }catch(err){ TAC._err(err); }
  m.position.x = CFG.uche.start[0]; m.position.z = CFG.uche.start[1]; m.rotation.y = CFG.uche.yaw;
  if(m.userData) m.userData._idle = 'idle';
  e.scene.add(m);                                 // not in ENGINE.npcs, not an obstacle, not crowd
  U.mesh = m;
  U.it = { mesh:m, label:'Post Sgt. Uche', verb:'talk', range:CFG.uche.range, optional:true, onInteract:() => ucheTalk() };
  e.interactables.push(U.it);
  U.poi = { x:m.position.x, z:m.position.z, color:UCHE_DOT, r:1.2 };
  if(typeof MINIMAP !== 'undefined' && Array.isArray(MINIMAP.pois)) MINIMAP.pois.push(U.poi);
  // a run restored after posting him: he is at his post at once
  const p = !fresh ? FL().m2_post : null;
  if(p && POST_AT[p] != null){ U.post = p; U.posted = true; placeAt(POST_AT[p] != null ? ARC[POST_AT[p]] : 0, p); postRing(p); }
}
function placeAt(s, post){
  const U = R.uche, q = chainAt(s);
  U.s = U.target = s; U.mesh.position.x = q.x; U.mesh.position.z = q.z;
  U.moving = false; U.arrived = true; U.dir = null; U.mesh.rotation.y = POST_YAW[post] != null ? POST_YAW[post] : U.mesh.rotation.y;
  setCrouch(post === 'back');
  syncPoi(true);
}
function setCrouch(on){ const U = R.uche; if(!U.mesh) return; U.crouched = !!on; U.mesh.scale.y = on ? CFG.uche.crouch : 1; }
function syncPoi(force){
  const U = R.uche; if(!U.poi || !U.mesh) return;
  const x = Math.round(U.mesh.position.x * 5) / 5, z = Math.round(U.mesh.position.z * 5) / 5;
  if(force || x !== U.poi.x || z !== U.poi.z){ U.poi.x = x; U.poi.z = z; }
}
function postRing(post){
  const U = R.uche;
  if(typeof MINIMAP === 'undefined' || !Array.isArray(MINIMAP.pois)) return;
  if(U.ring){ const i = MINIMAP.pois.indexOf(U.ring); if(i >= 0) MINIMAP.pois.splice(i, 1); U.ring = null; }
  if(post === 'van') return;
  const q = CHAIN[POST_AT[post]];
  U.ring = { x:q[0], z:q[1], color:POST_RING, r:1.6 };
  MINIMAP.pois.push(U.ring);
}
function gateRing(){
  if(R.gatePoi || typeof MINIMAP === 'undefined' || !Array.isArray(MINIMAP.pois)) return;
  R.gatePoi = { x:CFG.gate[0], z:CFG.gate[1], color:GATE_RING, r:1.4 };
  MINIMAP.pois.push(R.gatePoi);
}
function ucheTalk(){
  if(!R) return;
  const U = R.uche, P = ENGINE.player && ENGINE.player.position;
  if(P && U.mesh) U.mesh.rotation.y = Math.atan2(P.x - U.mesh.position.x, P.z - U.mesh.position.z);   // he isn't in ENGINE.npcs: turn him here
  if(!G()._marketTunde){ toast('SGT. UCHE', "I'll hold the van, sir."); return; }
  if((typeof CHASE !== 'undefined' && CHASE.active) || MC().market_runner || R.resolving){ toast('SGT. UCHE', "Van's ready when you are, sir."); return; }
  startDialogue('market_uche');
}
// post him: log the order only when the post changes, answer on the radio, walk the chain
function post(p, o){
  o = o || {};
  if(!R || !R.uche.mesh) return false;
  if(p === 'gate') p = 'back';
  if(POST_AT[p] == null) return false;
  const U = R.uche, prev = U.posted ? U.post : null, changed = !U.posted || U.post !== p;
  FL().m2_post = p;
  if(!changed && !o.arrive) return true;
  U.post = p; U.posted = true;
  if(changed) log('order', { who:'uche', order:'post', post:p, prev, withTip:FL().m2_tunde === 'quiet', src:o.src || 'talk', ok:true, def:false, obj:curObj(), t:r1(R.clock) });
  postRing(p);
  if(o.arrive){ placeAt(ARC[POST_AT[p]], p); return true; }
  U.target = ARC[POST_AT[p]]; U.orderT = R.clock; U.arrived = Math.abs(U.target - U.s) < 1e-6; U.moving = !U.arrived; U.dir = null;
  setCrouch(false);
  if(o.quiet !== true) sayUche(POST_ANSWER[p]);
  if(U.arrived) arrive();
  return true;
}
function arrive(){
  const U = R.uche;
  U.moving = false; U.arrived = true;
  if(U.mesh) U.mesh.rotation.y = POST_YAW[U.post];
  setCrouch(U.post === 'back');                  // crouched by the okada: hidden (scale.y 0.8 plays the crouch clip)
  syncPoi(true);
  if(U.post !== 'van' || U.s > 0.01){
    sayUche('In position.');
    if(U.tasks.arrive < 1){ U.tasks.arrive++; log('ally_done', { who:'uche', task:'arrive', outcome:'done', post:U.post, secs:r1(R.clock - (U.orderT || 0)) }); }
  }
}
const ucheGround = () => { const U = R && R.uche; return !!(U && U.mesh && (U.pursue || U.moving || U.post !== 'van')); };
const canVeer = () => { const U = R.uche; return !!(U.mesh && (U.pursue || U.moving || U.post === 'corner')); };

/* ---------- the Tunde meeting: one sight model (DESIGN M-M8) ---------- */
function tundeBody(P){
  const Tm = R.tunde.mesh, K = kcMesh(); if(!Tm || !K) return false;
  const ax = K.position.x, az = K.position.z, dx = P.x - ax, dz = P.z - az, L2 = dx * dx + dz * dz; if(L2 < 1e-9) return false;
  const t = ((Tm.position.x - ax) * dx + (Tm.position.z - az) * dz) / L2;
  if(t <= 0 || t >= 1) return false;
  return Math.abs((Tm.position.x - ax) * dz - (Tm.position.z - az) * dx) / Math.sqrt(L2) < CFG.tunde.body;
}
function meetProbe(P){
  if(!TAC.sight || !TAC.sight.probe || !R.kcW) return null;
  const pr = TAC.sight.probe('kc', P.x, P.z, { gait:TAC.player.gait(), crouch:TAC.player.crouch(), range:CFG.tunde.range });
  if(!pr) return null;
  const body = tundeBody(P);
  return { pr, seen:!!pr.seen && !body, body };
}
function rebuildIntro(){
  if(!PRISTINE) return;
  const lines = [PRISTINE[0]];
  const P = ENGINE.player && ENGINE.player.position, Tm = R && R.tunde.mesh, K0 = kcMesh();
  if(R){
    R.tunde.tested = false;
    // where the conversation happened, tested or not (enc m2_tunde.dist / ang)
    if(P && K0){ const dx = P.x - K0.position.x, dz = P.z - K0.position.z, d = hyp(dx, dz);
      R.tunde.dist = r1(d); R.tunde.ang = d > 1e-3 ? Math.round(Math.acos(clamp(-dx / d, -1, 1)) * 180 / PI) : 0; }
  }
  if(R && P && Tm && isM2() && hyp(P.x - Tm.position.x, P.z - Tm.position.z) <= CFG.tunde.meet){
    const m = meetProbe(P), K = kcMesh();
    if(m){
      const tu = R.tunde, dK = hyp(P.x - K.position.x, P.z - K.position.z), dT = hyp(Tm.position.x - K.position.x, Tm.position.z - K.position.z);
      tu.tested = true; tu.seen = m.seen; tu.dist = r1(dK); tu.ang = m.pr.angle; tu.crowd = !!m.pr.crowd; tu.side = dK < dT ? 'road' : 'stall';
      lines.push(m.seen ? T.seenLine : T.habitLine);
    }
  }
  lines.push(PRISTINE[1]);
  DIALOGUE.market_intro = lines;
}
function barkCheck(){
  const tu = R.tunde, P = ENGINE.player && ENGINE.player.position, Tm = tu.mesh;
  if(tu.bark || !P || !Tm || G()._marketTunde || overlay()) return;
  if(hyp(P.x - Tm.position.x, P.z - Tm.position.z) > CFG.tunde.bark) return;
  const m = meetProbe(P); if(!m || !m.seen) return;
  tu.bark = true;
  try{ TAC.radio.say('TUNDE', english() ? BARK.en : BARK.pg, { pri:3, ttl:4000, key:'tunde_bark' }); }catch(e){ TAC._err(e); }
}
function tundeEnd(){
  const tu = R.tunde, w = R.kcW;
  R.awake = true; R.awakeAt = R.clock; R.cyc = 0;
  places();
  tu.choice = FL().m2_tunde || null; tu.tip = tu.choice === 'quiet'; tu.habit = tu.tested && !tu.seen;
  if(tu.tested && tu.seen){ R.wary = true; tu.wary = true; }
  startPhase('phone');                              // the first look-up comes 4.6 s after the conversation (×0.75 when wary)
  FL().m2_met = { seen:!!(tu.tested && tu.seen), habit:tu.habit, tip:tu.tip };
  if(w){
    if(tu.tested && tu.seen){
      w.reset(CFG.tunde.seen, { cause:'tunde', why:WHY_TUNDE, quiet:true });
      toast('HE SAW YOU', WHY_TUNDE + ". He'll be watching.", 2800);
    }
    if(tu.choice === 'loud') w.reset(Math.max(w.state.susp, CFG.tunde.loud), { cause:'tunde_glance', quiet:true });
  }
  if(tu.tip) gateRing();
  if(!R.logged.tunde){
    R.logged.tunde = true;
    log('enc', { enc:'m2_tunde', side:tu.tested ? tu.side : 'far', seen:!!(tu.tested && tu.seen), dist:tu.dist, ang:tu.ang, bark:tu.bark,
      choice:tu.choice, tip:tu.tip, habit:tu.habit, wary:tu.wary });
  }
  if(!R.uche.posted){
    const run = R;
    // a report of where he is, on every difficulty; the advice to post him first is the Recruit chip (tac_m2_post)
    setTimeout(() => { if(run === R && !R.uche.posted && isM2() && !MC().market_runner) sayUche(UCHE_AT_VAN, undefined, { pri:1 }); }, 1500);
  }
}

/* ---------- the scan: exposure at the press (DESIGN M-M9) ---------- */
function forcedNow(){ const m = G()._mg && G()._mg.m2_unlock; return !!(m && m.forced); }
function scanPress(){
  if(!R || CFG.off || !G()._marketTunde || G()._marketScanned) return null;
  const w = R.kcW, st = w ? w.state : null;
  const live = !!(w && st && st.active && R.watchSecs >= CFG.kc.legacy);
  const att = attention(), exposed = live && exposedNow(st);
  return { seen:live && (att >= CFG.kc.seenAtt || exposed), exposed, att, forced0:forcedNow(), t:R.clock };
}
function hookPhone(){
  const it = (ENGINE.interactables || []).find(i => i.label === 'Scan suspect phone');
  if(!it || it._tacScan || typeof it.onInteract !== 'function') return;
  it._tacScan = true;
  const inner = it.onInteract;                      // already wrapped by the m2_unlock hook (mqAttach): ours is outside it
  it.onInteract = function(){
    const pre = scanPress();
    const r = inner.apply(this, arguments);
    try{ if(pre && R && (miniOpen() || puzzleOpen())) R.scan = pre; }catch(e){ TAC._err(e); }
    return r;
  };
}
function scanResolve(){
  const s = R.scan; R.scan = null;
  const w = R.kcW; if(!w) return;
  const scanned = !!G()._marketScanned, forced = !s.forced0 && forcedNow();
  if(scanned && s.seen){
    R.scanSeen = true;
    w.reset(100, { cause:'scan', why:WHY_SCAN });
    toast('HE SAW YOU', WHY_SCAN, 2600);
    R.bolt = { t:CFG.kc.scanBolt };
  } else if(!scanned && s.seen){
    w.reset(Math.max(w.state.susp, 60), { cause:'fumble', why:'He saw you handling his phone' });
  } else if(forced){
    w.reset(Math.max(w.state.susp, 60), { cause:'noise', why:'He heard you forcing his phone' });
  }
}

/* ---------- the confront router (DESIGN §5.3; first match wins) ---------- */
function origCall(it, self){ const f = R && R.origConfront; return typeof f === 'function' ? f.call(it, self) : undefined; }
function confront(it, self, o){
  o = o || {};
  if(!R) return;
  if(CFG.off) return origCall(it, self);
  if(R.resolving) return;                           // the cold grab's dialogue or Uche's takedown: nothing starts
  if(!G()._marketScanned || MC().market_runner || (typeof CHASE !== 'undefined' && CHASE.active)) return origCall(it, self);
  const w = R.kcW, st = w ? w.state : null, K = kcMesh(), P = ENGINE.player.position;
  const gap = hyp(P.x - K.position.x, P.z - K.position.z);
  const exposed = exposedNow(st);
  let row;
  if(o.force) row = o.force;
  else if(R.bolt || o.scan) row = 'scan';
  else if(!w || !st || R.watchSecs < CFG.kc.legacy) row = 'legacy';
  else if((exposed || st.level === 'alarm') && gap <= CFG.open.gap) row = 'seen';
  else if(o.auto && gap > CFG.open.gap) row = 'bolt';
  else if(st.level !== 'calm' || st.susp >= CFG.open.soft) row = 'soft';
  else row = 'cold';
  R.bolt = null;
  R.press = { row, susp:st ? Math.round(st.susp) : 0, level:st ? st.level : 'calm', exposed, gap:r1(gap), side:sideOf(),
    scanSeen:R.scanSeen, auto:!!(o.auto || row === 'scan'), t:R.clock };
  R.approach = (o.auto || row === 'scan' || row === 'bolt') ? 'bolt' : row;
  if(row === 'cold') return coldGrab(it, self);
  R.opening = row;
  try{ return origCall(it, self); } finally { R.opening = null; }
}
function autoBolt(){ if(R && R.kcIt && !R.resolving && !CFG.off) confront(R.kcIt, R.kcIt, { auto:true }); }
function fireBolt(){ R.bolt = null; if(R.kcIt) confront(R.kcIt, R.kcIt, { scan:true }); }
// CAUGHT COLD: the original confront runs in capture mode (no chase, no HE'S RUNNING, no chase music), then the canon onCaught
function coldGrab(it, self){
  R.capture = true; R.capCfg = null;
  try{ origCall(it, self); } finally { R.capture = false; }
  const cfg = R.capCfg; R.capCfg = null;
  ENGINE._stagger = 0;
  if(!cfg){ R.approach = null; return; }
  const K = kcMesh();
  raiseHands(K); faceKC();
  toast('CAUGHT COLD', 'He never saw you coming. Quiet arrest · +2 Public Trust', 2600);
  try{ applyEffect({ publicTrust:+2 }); }catch(e){ TAC._err(e); }
  hapt([40, 30, 80]);
  kcResolved({ how:'cold', by:'player', bumps:0, tac:{ row:'cold', t0:R.clock, trust0:trust() - 2, lane:0 } }, 'caught');
  kcUnlock(G()._opBumps || 0);                     // no chase: nobody was knocked over unless an earlier chase did it
  if(typeof cfg.onCaught === 'function') cfg.onCaught();      // market.js:162-170: KC turns by π; market_runner opens at once
}

/* ---------- KC resolved: written once, logged once ---------- */
// the KC achievements: every catch unlocks what today's tackle unlocks (pressure.js:181): "Faster Than Computer Village",
// and "Not One Bystander" with nobody knocked over. Today every catch is a tackle; here a cold grab, CUT HIM OFF, UCHE HAS HIM
// and BOXED IN are catches too, so none of them may cost the player an achievement the tackle gives.
function kcUnlock(bumps){ try{ if(typeof unlock === 'function'){ unlock('faster'); if(!bumps) unlock('not_one'); } }catch(e){ TAC._err(e); } }
function kcResolved(c, outcome){
  if(!R || R.logged.kc) return;
  R.logged.kc = true;
  R.resolving = true;                               // until market_runner is set by the dialogue
  const how = outcome === 'escaped' ? 'escaped' : (c.how || 'tackle');
  R.how = how; R.outcome = outcome;
  FL().m2_how = how;
  const t = c.tac || {}, p = R.press || {}, U = R.uche, tu = R.tunde;
  t.end = R.clock;
  log('enc', { enc:'m2_kc', approach:R.approach || 'legacy', intent:intent(), wary:R.wary, susp:p.susp != null ? p.susp : null, level:p.level || null,
    exposed:!!p.exposed, gap:p.gap != null ? p.gap : null, scanSeen:R.scanSeen, side:p.side || null, outcome, how,
    secs:how === 'cold' ? 0 : r1(R.clock - (t.t0 != null ? t.t0 : R.clock)), bumps:c.bumps || 0, bumpsLane:t.lane || 0,
    trust:trust() - (t.trust0 != null ? t.trust0 : trust()), cutReached:false, ribbon:CFG.ribbonCut,
    prep:{ tip:tu.tip, habit:tu.habit, post:U.post, posted:U.posted, pursuit:has('pursuit'), tier:V() && V12.intelTier ? V12.intelTier() : 0,
      greyman:has('greyman'), sources:has('sources') },
    uche:{ post:U.post, arrived:!!U.arrived, role:U.role } });
}
function intent(){
  const a = R.approach, p = R.press || {};
  return (a === 'cold' || a === 'soft' || R.stats.crouchNear >= 2 || (p.side && p.side !== 'front')) ? 'stealth' : 'direct';
}

/* ---------- 10 Hz decisions ---------- */
function tick(dt){
  if(!isM2() || TAC.frozen()) return;
  R.clock += dt;
  const w = R.kcW, st = w ? w.state : null;
  if(!G()._marketTunde) barkCheck();
  if(st && st.active){
    R.watchSecs += dt;
    if(st.level !== 'calm') R.phase = 'watching';
    else {
      if(R.phase === 'watching') startPhase('phone');
      R.phaseT -= dt;
      if(R.phaseT <= 1e-6) startPhase(R.phase === 'phone' ? 'lookup' : 'phone');
    }
    R.stats.suspPeak = Math.max(R.stats.suspPeak, st.susp);
    if(st.susp > 0.5) R.stats.eyeSecs += dt;
    if(st.crouch && st.dist != null && st.dist <= 8) R.stats.crouchNear += dt;
    // the alarm: before the scan he never runs; after it, within 6 m he bolts; otherwise he settles at 50 after 4 s unseen
    if(st.level === 'alarm' && !R.bolt){
      if(G()._marketScanned && st.dist != null && st.dist <= CFG.kc.boltRange){ autoBolt(); return; }
      R.unseenAlarm = st.seen ? 0 : R.unseenAlarm + dt;
      if(R.unseenAlarm >= CFG.kc.calmAfter - 1e-6){ R.unseenAlarm = 0; w.reset(CFG.kc.calmTo, { quiet:true }); }
    } else R.unseenAlarm = 0;
    if(!R.hint.side && st.inCone && st.dist != null && st.dist <= 6){ R.hint.side = true; TAC.hint(HINTS.side[0], HINTS.side[1], HINTS.side[2]); }
  }
  if(R.bolt){ R.bolt.t -= dt; if(R.bolt.t <= 1e-6){ fireBolt(); return; } }
  if(R.awake && R.awakeAt != null && !R.hint.post && !R.uche.posted && R.clock - R.awakeAt >= 20 && !(typeof CHASE !== 'undefined' && CHASE.active) && !MC().market_runner){
    R.hint.post = true; TAC.hint(HINTS.post[0], HINTS.post[1], HINTS.post[2]);
  }
  if(R.uche.pursue) pursueGoal();
  syncPoi(false);
}

/* ---------- every frame: KC's pose, the scan's outcome, Uche's legs ---------- */
function frame(dt){
  if(!isM2()) return;
  const K = kcMesh(), w = R.kcW;
  if(!TAC.frozen()){
    if(!R.text && !R.awake && !G()._marketTunde){
      R.textT = (R.textT || 0) + dt;
      if(R.textT >= 1.5){ R.text = true; try{ if(V() && V12.text) V12.text('TUNDE', T_ARRIVAL); }catch(e){ TAC._err(e); } }
    }
    if(R.scan && !miniOpen() && !puzzleOpen()) scanResolve();
  }
  // KC is ours while he is watched: rotation = his facing + the module's glance; head down on his phone
  if(K && w && w.state.active && watchedActive()){
    K.rotation.y = facing() + (w.state.glance || 0);
    setArms(K, null, R.phase === 'phone' ? -2.0 : 0);
  }
  if(!TAC.frozen()) moveUche(dt);
}

/* ---------- Uche's legs: the chain at 3.0 m/s (3.6 in a chase), or the lanes with Pursuit Lines ---------- */
function moveUche(dt){
  const U = R.uche, m = U.mesh; if(!m || U.kneel) return;
  if(U.moving && (R.resolving || MC().market_runner)){ U.moving = false; U.dir = null; }     // KC is in custody: he stops
  const c = (typeof CHASE !== 'undefined' && CHASE.active && CHASE.active.tac) ? CHASE.active : null;
  const sp = (c ? CFG.uche.run : CFG.uche.jog) * dt;
  let moved = 0;
  if(U.pursue && c && U.goal){
    moved = stepToward(m, U.goal, sp);
  } else if(U.moving){
    const dir = Math.sign(U.target - U.s), s1 = U.s + dir * sp;
    const done = dir > 0 ? s1 >= U.target : s1 <= U.target;
    U.s = done ? U.target : s1;
    const q = chainAt(U.s), x0 = m.position.x, z0 = m.position.z;
    m.position.x = q.x; m.position.z = q.z; moved = hyp(q.x - x0, q.z - z0);
    if(moved > 1e-4){ m.rotation.y = Math.atan2(q.x - x0, q.z - z0); U.dir = { x:(q.x - x0) / moved, z:(q.z - z0) / moved }; }
    if(done) arrive();
  }
  // the fallback rig has no clips: swing its limbs while he moves
  const u = m.userData;
  if(u && !u._skinned && u.legL){
    if(moved > 1e-4){ u.walkPhase = (u.walkPhase || 0) + dt * 12; const sw = Math.sin(u.walkPhase) * 0.6;
      if(u.armL) u.armL.rotation.x = sw; if(u.armR) u.armR.rotation.x = -sw; u.legL.rotation.x = -sw * 0.9; if(u.legR) u.legR.rotation.x = sw * 0.9; }
    else if(u.legL.rotation.x !== 0){ u.legL.rotation.x = 0; if(u.legR) u.legR.rotation.x = 0; if(u.armL) u.armL.rotation.x = 0; if(u.armR) u.armR.rotation.x = 0; }
  }
}
function stepToward(m, goal, sp){
  const x0 = m.position.x, z0 = m.position.z, dx = goal.x - x0, dz = goal.z - z0, d = hyp(dx, dz);
  if(d < 0.05) return 0;
  const s = Math.min(d, sp), nx = x0 + dx / d * s, nz = z0 + dz / d * s;
  const blk = (x, z) => typeof blockedAt === 'function' && blockedAt(x, z, 0.3);
  if(!blk(nx, z0)) m.position.x = nx;
  if(!blk(m.position.x, nz)) m.position.z = nz;
  const mv = hyp(m.position.x - x0, m.position.z - z0);
  if(mv > 1e-4) m.rotation.y = Math.atan2(m.position.x - x0, m.position.z - z0);
  return mv;
}
// Pursuit Lines: run for the next node on KC's route (straight at him inside 4 m), round the stalls on the lane graph
function pursueGoal(){
  const c = (typeof CHASE !== 'undefined' && CHASE.active && CHASE.active.tac) ? CHASE.active : null; if(!c) return;
  const U = R.uche, m = U.mesh, K = c.runner.position;
  let tgt = (hyp(K.x - m.position.x, K.z - m.position.z) < CFG.uche.near) ? { x:K.x, z:K.z } : null;
  if(!tgt){ const nx = c.path[Math.min(c.path.length - 1, c.seg + 1)]; tgt = nx ? { x:nx[0], z:nx[1] } : { x:K.x, z:K.z }; }
  U.goal = plan({ x:m.position.x, z:m.position.z }, tgt);
}
function plan(a, b){
  const blocked = (p, q) => typeof WAY !== 'undefined' && WAY.segBlocked ? WAY.segBlocked(p.x, p.z, q.x, q.z, 0.3) : false;
  if(!blocked(a, b)) return b;
  const D = TAC.lanes.DATA, N = D.nodes.map(n => ({ x:n[0], z:n[1] }));
  const n = N.length, A = n, B = n + 1, P = N.concat([a, b]);
  const adj = P.map(() => []);
  for(const [i, j] of D.edges){ const w = hyp(P[i].x - P[j].x, P[i].z - P[j].z); adj[i].push([j, w]); adj[j].push([i, w]); }
  for(let i = 0; i < n; i++){
    if(!blocked(a, P[i])) adj[A].push([i, hyp(a.x - P[i].x, a.z - P[i].z)]);
    if(!blocked(P[i], b)) adj[i].push([B, hyp(b.x - P[i].x, b.z - P[i].z)]);
  }
  const dist = P.map(() => Infinity), prev = P.map(() => -1), done = P.map(() => false);
  dist[A] = 0;
  for(;;){
    let u = -1, best = Infinity;
    for(let i = 0; i < P.length; i++) if(!done[i] && dist[i] < best){ best = dist[i]; u = i; }
    if(u < 0 || u === B) break;
    done[u] = true;
    for(const [v, w] of adj[u]) if(dist[u] + w < dist[v]){ dist[v] = dist[u] + w; prev[v] = u; }
  }
  if(!isFinite(dist[B])) return b;
  let v = B; while(prev[v] !== A && prev[v] >= 0) v = prev[v];
  return P[v];
}

/* ---------- the chase ---------- */
const isKCChase = c => !!(c && R && !CFG.off && isM2() && c.runner && c.runner === kcMesh());
function chaseBegin(c, row){
  if(row === 'soft' || row === 'bolt') ENGINE._stagger = 0;
  c.how = 'tackle'; c.by = 'player'; c._tacT = 0;
  c.tac = { row, t0:R.clock, trust0:trust(), lane:0, hist:[], ping:c.fx ? c.fx.ping : 0, veered:false };
  R.chase = c.tac;
  R.bolt = null;
  const oc = c.onCaught, oe = c.onEscaped;
  c.onCaught = function(){ try{ kcResolved(c, 'caught'); }catch(e){ TAC._err(e); } return typeof oc === 'function' ? oc.apply(this, arguments) : undefined; };
  c.onEscaped = function(){ c.how = 'escaped'; c.by = null; try{ kcResolved(c, 'escaped'); }catch(e){ TAC._err(e); } return typeof oe === 'function' ? oe.apply(this, arguments) : undefined; };
  // Uche's chase role: Pursuit Lines runs the lanes (the gate post holds the gate); a posted Uche keeps going at 3.6 m/s
  const U = R.uche;
  U.pursue = has('pursuit') && !!U.mesh && U.post !== 'back';
  if(U.pursue){ U.moving = false; U.dir = null; setCrouch(false); }        // the role is what he does (§4): tackle, box, veer, callout
}
function chasePre(c, dt){
  c._tacT = (c._tacT || 0) + dt;
  const T = c.tac, P = ENGINE.player.position;
  T.hist.push([c._tacT, P.x, P.z]);
  while(T.hist.length > 2 && c._tacT - T.hist[1][0] >= CFG.cut.win) T.hist.shift();
  const burstT = c.burstT == null ? (c.burst ? c.burst[0] : 0) : c.burstT;
  const opened = burstT <= 0 && c.headStart <= 0;
  if(opened && c.pause <= 0 && c._tacT >= CFG.cut.t0 - 1e-9 && cutCheck(c)){ endCut(c); return true; }
  return ucheChase(c, opened);
}
function headingOf(c){
  const K = c.runner.position;
  for(let k = c.seg + 1; k < c.path.length; k++){
    const n = c.path[k], hx = n[0] - K.x, hz = n[1] - K.z, hl = hyp(hx, hz);
    if(hl > 1e-3) return { x:hx / hl, z:hz / hl };
  }
  return null;
}
function cutCheck(c){
  const k = CFG.cut, K = c.runner.position, P = ENGINE.player.position;
  const h = headingOf(c); if(!h) return false;
  const dx = P.x - K.x, dz = P.z - K.z, d = hyp(dx, dz);
  if(d > k.r || d < 1e-3) return false;
  if((dx * h.x + dz * h.z) / d < k.cos) return false;
  if(typeof WAY !== 'undefined' && WAY.segBlocked && WAY.segBlocked(P.x, P.z, K.x, K.z, 0)) return false;
  const H0 = c.tac.hist, a = H0[0], b = H0[H0.length - 1], tt = b[0] - a[0];
  const v = tt > 1e-3 ? ((b[1] - a[1]) * h.x + (b[2] - a[2]) * h.z) / tt : 0;
  return v <= k.vmax;
}
function endCut(c){
  c.how = 'cutoff'; c.by = 'player';
  const cb = c.onCaught;
  stopChase();
  raiseHands(c.runner); faceKC();
  toast('CUT HIM OFF', 'You got in front of him. No tackle, nobody hurt · +2 Public Trust', 2600);
  try{ applyEffect({ publicTrust:+2 }); }catch(e){ TAC._err(e); }
  kcUnlock(c.bumps);
  hapt([40, 30, 80]);
  if(typeof cb === 'function') cb(c);              // synchronously: the caught scene opens at once (wayfind_catch reads it)
}
function ucheChase(c, opened){
  const U = R.uche, m = U.mesh; if(!m) return false;
  const K = c.runner.position, Up = m.position, d = hyp(K.x - Up.x, K.z - Up.z);
  // the grab: from the end of the head start, as the player's catch (market.md §1.7), so a dash can't pass through him
  if(c.headStart <= 0 && ucheGround() && d <= CFG.uche.grab){ takedown(c); return true; }
  if(!opened) return false;
  if(!c.ended && !c.tac.veered && canVeer() && d <= CFG.uche.veer){
    const h = headingOf(c);
    if(h && ((Up.x - K.x) * h.x + (Up.z - K.z) * h.z) / Math.max(d, 1e-3) > CFG.uche.veerCos && !sameWay(h)) veer(c);
  }
  return false;
}
// the moving-Uche rule (DESIGN M-M4): a Uche jogging to his post, ahead of KC and going KC's way, shows KC his back. KC
// doesn't turn off for him: he runs on, gains on him (4.1 against 3.6 m/s) and runs into the grab. Coming towards KC (a
// re-post back up the lane), or standing at the corner, Uche turns him as before.
function sameWay(h){
  const U = R.uche;
  return !!(U.moving && !U.pursue && U.dir && U.dir.x * h.x + U.dir.z * h.z > CFG.uche.sameWay);
}
// he sees Uche ahead and takes the lanes: no DOUBLING BACK pause (c.ended is set before his path runs out)
function veer(c){
  const K = c.runner.position, U = R.uche;
  c.tac.veered = true; c.ended = true;
  c.path.length = c.seg + 1; c.path.push([K.x, K.z]);
  c.gNode = null; c.gPrev = null;
  U.veerMoving = !!U.moving;                       // (tests: the veer came from a Uche still on his way)
  U.role = U.role || 'veer';
  if(U.tasks.veer < 1){ U.tasks.veer++; log('ally_done', { who:'uche', task:'veer', outcome:'done', post:U.post, secs:r1(c._tacT), d:r1(hyp(K.x - U.mesh.position.x, K.z - U.mesh.position.z)) }); }
}
function placeName(x, z){
  if(z <= -17.5 && x >= 10.5) return ['at the back gate', 'Back gate'];
  if(x >= 11.0) return ['in the back lane', 'Back lane'];
  const gaps = [[0, 'first gap'], [-7.5, 'second gap'], [-12.5, 'third gap'], [7.4, 'north gap']];
  if(x > 8.3 && x < 11.8) for(const [gz, nm] of gaps) if(Math.abs(z - gz) < 1.2) return ['in the ' + nm, nm.charAt(0).toUpperCase() + nm.slice(1)];
  if(z >= 11) return ['at the north end', 'North end'];
  if(z <= -17.5) return ['at the south end', 'South end'];
  return ['on the stall fronts', 'Stall fronts'];
}
// UCHE HAS HIM: KC goes down, Uche kneels, a 1.4 s camera beat when Kelechi is far (skipped under reduced motion)
function takedown(c){
  const U = R.uche, m = U.mesh, Kr = c.runner, K = Kr.position, P = ENGINE.player.position;
  c.how = 'uche'; c.by = 'uche';
  const cb = c.onCaught;
  const d = hyp(K.x - m.position.x, K.z - m.position.z);
  stopChase();
  if(typeof knockDown === 'function') knockDown(Kr);
  // the lunge: he ends at KC's side, kneeling (scale.y 0.9 plays the kneel clip)
  if(d > 0.6){ const k = (d - 0.6) / d; m.position.x += (K.x - m.position.x) * k; m.position.z += (K.z - m.position.z) * k; }
  m.rotation.y = Math.atan2(K.x - m.position.x, K.z - m.position.z);
  U.moving = false; U.pursue = false; U.kneel = true; m.scale.y = CFG.uche.kneel;
  syncPoi(true);
  const pl = placeName(K.x, K.z);
  toast('UCHE HAS HIM', 'Sgt. Uche took him down ' + pl[0] + ' · +2 Public Trust', 2600);
  try{ applyEffect({ publicTrust:+2 }); }catch(e){ TAC._err(e); }
  hapt([40, 30, 80]);
  sayUche('Got him! ' + pl[1] + ', sir.');
  kcUnlock(c.bumps);
  U.role = 'tackle';
  if(U.tasks.act < 1){ U.tasks.act++; log('ally_done', { who:'uche', task:'tackle', outcome:'done', post:U.post, secs:r1(c._tacT), d:r1(d) }); }
  R.resolving = true;
  const run = R;
  const finish = () => {
    if(run !== R) return;
    if(overlay()){ run.beat = setTimeout(finish, 200); return; }
    run.beat = null;
    // the caught scene is a conversation at arm's length: Kelechi walks up under the beat
    const Pp = ENGINE.player.position;
    if(hyp(Pp.x - K.x, Pp.z - K.z) > 3) placeNear(K, CFG.uche.place);
    if(typeof cb === 'function') cb(c);
  };
  const far = hyp(P.x - K.x, P.z - K.z) > CFG.uche.beatFar;
  if(far && !reduced() && typeof TPCAM !== 'undefined' && typeof THREE !== 'undefined'){
    const ux = (P.x - K.x) / Math.max(1e-3, hyp(P.x - K.x, P.z - K.z)), uz = (P.z - K.z) / Math.max(1e-3, hyp(P.x - K.x, P.z - K.z));
    try{
      const pos = new THREE.Vector3(K.x + ux * 4, 2.4, K.z + uz * 4), look = new THREE.Vector3(K.x, 0.6, K.z);
      pos.x = K.x + ux * 4; pos.y = 2.4; pos.z = K.z + uz * 4; look.x = K.x; look.y = 0.6; look.z = K.z;
      TPCAM.override = { pos, look }; R.beatCam = true;
    }catch(e){ TAC._err(e); }
    ENGINE.movementEnabled = false;
    R.beat = setTimeout(() => {
      if(run !== R) return;
      try{ if(TPCAM.override) TPCAM.override = null; }catch(e){}
      run.beatCam = false;
      ENGINE.movementEnabled = true;
      finish();
    }, CFG.uche.beat * 1000);
  } else finish();
}
function placeNear(K, dist){
  const P = ENGINE.player.position;
  const base = Math.atan2(P.x - K.x, P.z - K.z);
  for(let i = 0; i < 16; i++){
    const a = base + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * PI / 8;
    const x = K.x + Math.sin(a) * dist, z = K.z + Math.cos(a) * dist;
    if(typeof blockedAt === 'function' && blockedAt(x, z)) continue;
    P.x = x; P.z = z; ENGINE.player.rotation.y = Math.atan2(K.x - x, K.z - z); ENGINE.playerYaw = ENGINE.player.rotation.y;
    return true;
  }
  return false;
}
function endBoxed(c){
  const P = ENGINE.player.position, K = c.runner.position, U = R.uche;
  const dP = hyp(P.x - K.x, P.z - K.z), dU = U.mesh ? hyp(U.mesh.position.x - K.x, U.mesh.position.z - K.z) : Infinity;
  c.how = 'boxed'; c.by = dP <= dU ? 'player' : 'uche';
  const cb = c.onCaught;
  stopChase();
  raiseHands(c.runner); faceKC();
  toast('BOXED IN', 'Nowhere left to run. He puts his hands up · +2 Public Trust', 2600);
  try{ applyEffect({ publicTrust:+2 }); }catch(e){ TAC._err(e); }
  kcUnlock(c.bumps);
  hapt([40, 30, 80]);
  U.role = U.role === 'tackle' ? U.role : 'box';
  if(U.tasks.act < 1){ U.tasks.act++; log('ally_done', { who:'uche', task:'box', outcome:'done', post:U.post, secs:r1(c._tacT), d:r1(dU) }); }
  if(typeof cb === 'function') cb(c);
}
// the lane walk with two officers (Kelechi and a Uche on the ground), and BOXED IN (pressure.js:77-114 plus the officers)
function extend(c){
  const r = c.runner.position;
  if(!c.ended){
    c.ended = true;
    if(c.endPause > 0){ c.pause = c.endPause; if(c.endLine) toast('DOUBLING BACK', c.endLine, 2000); }
  }
  const L = c.lanes, N = L.nodes, P = ENGINE.player ? ENGINE.player.position : r, Um = R.uche.mesh.position;
  const officers = [P, Um];
  const away = n => Math.min(hyp(n[0] - P.x, n[1] - P.z), hyp(n[0] - Um.x, n[1] - Um.z)) - hyp(n[0] - r.x, n[1] - r.z);
  if(c.gNode == null){
    let bi = -1, bs = -Infinity;
    if(c.tac.veered){
      N.forEach((n, i) => {
        const d = hyp(n[0] - r.x, n[1] - r.z); if(d < 0.3 || d > 9) return;
        if(typeof WAY !== 'undefined' && WAY.segBlocked && WAY.segBlocked(r.x, r.z, n[0], n[1], 0.3)) return;
        const s = away(n) + Math.random() * 0.6; if(s > bs){ bs = s; bi = i; }
      });
    }
    if(bi < 0){ let bd = Infinity; N.forEach((n, i) => { const d = hyp(n[0] - r.x, n[1] - r.z); if(d < bd){ bd = d; bi = i; } }); }
    c.gNode = bi;
    if(hyp(N[bi][0] - r.x, N[bi][1] - r.z) > 0.05){ c.path.push([N[bi][0], N[bi][1]]); return true; }
  }
  const nb = [];
  for(const e of (L.edges || [])){ if(e[0] === c.gNode) nb.push(e[1]); else if(e[1] === c.gNode) nb.push(e[0]); }
  if(!nb.length) return false;
  let best = nb[0], bs = -Infinity, det = -Infinity;
  for(const j of nb){
    const a = away(N[j]); det = Math.max(det, a);
    let sc = a; if(j === c.gPrev) sc -= 4; sc += Math.random() * 0.6;
    if(sc > bs){ bs = sc; best = j; }
  }
  // every way out is closer to an officer than to him, and one is within 5 m: he puts his hands up
  if(det < CFG.uche.boxScore && Math.min(...officers.map(o => hyp(o.x - r.x, o.z - r.z))) <= CFG.uche.boxR){ c.tac.boxed = true; return false; }
  c.gPrev = c.gNode; c.gNode = best;
  c.path.push([N[best][0], N[best][1]]);
  return true;
}
function chasePost(c){
  // BOXED IN, decided inside the lane walk, ends here (after the original frame, so nothing runs twice)
  if(c.tac.boxed && CHASE.active === c){ endBoxed(c); return; }
  const f = c.fx;
  if(f && f.ping !== c.tac.ping){ c.tac.ping = f.ping; if(CHASE.active === c && f.mode === 'lastseen') callout(c); }
}
// the van callouts: where he is and which way he is going (the back gate only when the route is known)
function laneOf(x, z, dx, dz){
  const known = FL().m2_tunde === 'quiet';
  const south = dz < -0.2, north = dz > 0.2;
  if(z <= -17.5 && x >= 10.5) return { lane:'back_gate', text:known ? "He's at the back gate!" : "He's at the south end of the back lane!" };
  if(x >= 11.0) return { lane:'back_lane', text:"He's in the back lane, heading " + (south ? (known ? 'for the back gate!' : 'south!') : north ? 'north!' : 'across!') };
  const gaps = [[0, 'the first gap'], [-7.5, 'the second gap'], [-12.5, 'the third gap'], [7.4, 'the north gap']];
  if(x > 8.3 && x < 11.8) for(const [gz, nm] of gaps) if(Math.abs(z - gz) < 1.2) return { lane:'gap', text:"He's cut through " + nm + '!' };
  if(z >= 11) return { lane:'north_end', text:"He's at the north end, heading " + (dx > 0.2 ? 'east!' : dx < -0.2 ? 'west!' : south ? 'south!' : 'north!') };
  return { lane:'stall_fronts', text:"He's on the stall fronts, heading " + (south ? 'south!' : north ? 'north!' : 'across!') };
}
function callout(c){
  const U = R.uche; if(!U.mesh || U.tasks.callout >= CFG.uche.calls) return;
  const K = c.runner.position, Up = U.mesh.position, d = hyp(K.x - Up.x, K.z - Up.z);
  const atVan = U.post === 'van' && !U.pursue && !U.moving;
  if(!atVan){
    if(d > CFG.uche.callLos) return;
    const L = TAC.sight && TAC.sight.los ? TAC.sight.los(Up.x, Up.z, 1.6, K.x, K.z, 1.45) : { clear:true };
    if(!L.clear) return;
  }
  const h = headingOf(c) || { x:0, z:0 };
  const l = laneOf(K.x, K.z, h.x, h.z);
  if(U.lastCall && U.lastCall.lane === l.lane && U.lastCall.text === l.text) return;
  U.lastCall = { lane:l.lane, text:l.text };
  U.tasks.callout++;
  U.role = U.role || 'callout';
  try{ TAC.radio.say('SGT. UCHE', l.text, { pri:3, ttl:3000, key:'uche_call' }); }catch(e){ TAC._err(e); }
  log('ally_done', { who:'uche', task:'callout', outcome:'done', post:U.post, secs:r1(c._tacT), lane:l.lane });
}

/* ---------- wraps (outermost: this file loads after every other layer but the mansion) ---------- */
wrap('buildSceneMarket', orig => function(){
  const r = orig.apply(this, arguments);
  try{ setup(); }catch(e){ TAC._err(e); }
  return r;
});
wrap('sideSetup', orig => function(mid){
  const r = orig.apply(this, arguments);
  try{ if(mid === 'm2' && R) hookPhone(); }catch(e){ TAC._err(e); }
  return r;
});
wrap('startDialogue', orig => function(key){
  try{
    if(key === 'market_intro') rebuildIntro();
    if(key === 'market_uche' && DIALOGUE.market_uche){
      const ch = DIALOGUE.market_uche[1].choices[1];
      ch.text = ch._base + (FL().m2_tunde === 'quiet' ? " Tunde says that's where he runs." : '');
    }
  }catch(e){ TAC._err(e); }
  return orig.apply(this, arguments);
});
wrap('endDialogue', orig => function(){
  const key = (typeof DLG !== 'undefined') ? DLG.scriptKey : null;
  const r = orig.apply(this, arguments);
  try{
    if(R && isM2()){
      if(key === 'market_intro') tundeEnd();
      else if(key === 'market_uche'){ const p = FL().m2_post; if(p) post(p); }
      else if(key === 'market_runner' || key === 'market_runner_escaped'){
        const K = kcMesh(); if(K && !(K.userData && K.userData._down)) setArms(K, 0, 0);
        const U = R.uche; if(U.mesh && U.kneel){ U.kneel = false; U.mesh.scale.y = U.crouched ? CFG.uche.crouch : 1; }
        if(MC().market_runner) R.resolving = false;
      }
    }
  }catch(e){ TAC._err(e); }
  return r;
});
wrap('startChase', orig => function(cfg){
  if(!(cfg && R && !CFG.off && isM2() && cfg.runner && cfg.runner === kcMesh())) return orig.apply(this, arguments);
  if(R.capture){ R.capCfg = cfg; return null; }     // the cold grab: the chase never starts
  const row = R.opening || 'legacy';
  if(row === 'bolt'){ cfg.burst = null; cfg.headStart = 0; }
  const c = orig.apply(this, arguments);
  if(c) try{ chaseBegin(c, row); }catch(e){ TAC._err(e); }
  return c;
});
wrap('updateChase', orig => function(dt){
  const c = (typeof CHASE !== 'undefined') ? CHASE.active : null;
  const ours = isKCChase(c) && c.tac && dt > 0 && ENGINE.player && !overlay();
  if(ours){ try{ if(chasePre(c, dt)) return; }catch(e){ TAC._err(e); } }
  const r = orig.apply(this, arguments);
  if(ours){ try{ chasePost(c); }catch(e){ TAC._err(e); } }
  return r;
});
// an escape carries its how before any onEscaped wrapper runs (pressure.js:117 calls c.onEscaped itself)
wrap('chaseEscape', orig => function(c){
  try{ if(isKCChase(c) && c.tac){ c.how = 'escaped'; c.by = null; } }catch(e){ TAC._err(e); }
  return orig.apply(this, arguments);
});
wrap('chaseExtend', orig => function(c){
  if(!(isKCChase(c) && c.tac && ucheGround() && c.lanes && c.lanes.nodes && c.lanes.nodes.length)) return orig.apply(this, arguments);
  return extend(c);
});
wrap('toast', orig => function(big, small){
  try{
    if(R && !CFG.off && isM2()){
      const b = String(big || '');
      if(R.capture && b === "HE'S RUNNING") return;            // the cold grab: no chase to announce
      if(R.opening && b === "HE'S RUNNING"){
        const a = Array.prototype.slice.call(arguments);
        if(R.opening === 'soft') a[1] = TOAST_SOFT;
        else if(R.opening === 'bolt') a[1] = TOAST_BOLT;
        else if(R.opening === 'scan'){ a[0] = 'HE SAW YOU'; a[1] = 'He saw you lift his phone. He shoves a tray and runs.'; }
        return orig.apply(this, a);
      }
      const c = (typeof CHASE !== 'undefined') ? CHASE.active : null;
      if(b === 'BYSTANDER DOWN' && isKCChase(c) && c.tac){
        if(!R.hint.bump){ R.hint.bump = true; TAC.hint(HINTS.bump[0], HINTS.bump[1], HINTS.bump[2]); }
        const P = ENGINE.player.position;
        if(P.x >= 6.6 && P.x <= 13.8 && P.z >= -21 && P.z <= 18){
          // where it happened is feedback (both difficulties); the chip above is the Recruit-only advice
          c.tac.lane++;
          const a = Array.prototype.slice.call(arguments);
          a[1] = /full sprint/.test(String(small || '')) ? 'You flattened a trader at full sprint in the trader lane. −3 Public Trust' : 'You clipped a trader in the trader lane. −1 Public Trust';
          return orig.apply(this, a);
        }
      }
    }
  }catch(e){ TAC._err(e); }
  return orig.apply(this, arguments);
});
wrap('musicForScene', orig => function(){
  if(R && R.capture) return;                        // a cold grab never flicks to the chase cue
  return orig.apply(this, arguments);
});
wrap('completeMission', orig => function(id){
  try{ if(id === 'm2' && R && !R.logged.sum) summary(); }catch(e){ TAC._err(e); }
  return orig.apply(this, arguments);
});
// v12's 900 ms Pursuit Lines line (v12_core.js:269) is rewritten to be true for the post: M2 and KC's chase only
try{
  if(V() && typeof V12.say === 'function' && !V12.say._tacM2){
    const say0 = V12.say;
    const f = function(speaker, text, ms){
      try{
        const c = (typeof CHASE !== 'undefined') ? CHASE.active : null;
        if(text === PURSUIT_LINE && R && isM2() && c && c.runner === kcMesh()) text = PURSUIT_POST[R.uche.post] || text;
      }catch(e){ TAC._err(e); }
      return say0.call(this, speaker, text, ms);
    };
    f._tacM2 = true; f._orig = say0;
    V12.say = f;
  }
}catch(e){ TAC._err(e); }

function summary(){
  R.logged.sum = true;
  const t = R.chase || {}, U = R.uche, tu = R.tunde, mc = MC();
  const kc = mc.market_runner === 'caught' || mc.market_runner === 'escaped' ? mc.market_runner : null;
  log('m2_summary', { kc, how:R.how, approach:R.approach, scanSeen:R.scanSeen, alarms:R.stats.alarms, notices:R.stats.notices,
    suspPeak:Math.round(R.stats.suspPeak), eyeSecs:r1(R.stats.eyeSecs), crouchNearSecs:r1(R.stats.crouchNear), watchSecs:r1(R.watchSecs),
    tunde:{ side:tu.tested ? tu.side : 'far', seen:!!(tu.tested && tu.seen), choice:tu.choice, tip:tu.tip, habit:tu.habit },
    post:U.post, posted:U.posted, ucheArrived:!!(U.posted && U.arrived), ucheRole:U.role,
    chase:{ secs:t.t0 != null && R.how && R.how !== 'cold' ? r1((t.end != null ? t.end : R.clock) - t.t0) : 0, bumps:G()._opBumps || 0, bumpsLane:t.lane || 0,
      trust:t.trust0 != null ? trust() - t.trust0 : 0, cutsShown:0, cutReached:false, cutoff:R.how === 'cutoff', ribbon:CFG.ribbonCut },
    trust:trust() - R.stats.trust0, secs:r1(R.clock),
    caps:{ pursuit:has('pursuit'), greyman:has('greyman'), sources:has('sources'), tier:V() && V12.intelTier ? V12.intelTier() : 0 },
    diff:{ casework:typeof isRecruit === 'function' && isRecruit() ? 'recruit' : 'senior', pace:(typeof SETTINGS !== 'undefined' && SETTINGS.difficulty) || 'standard' },
    hints:(TAC.hintsShown || []).filter(h => /^tac_m2_|^tac_sight/.test(h)), build:((window.NACECA_BUILD || {}).src) || null,
    intent:R.approach ? intent() : null, wary:R.wary, ribbon:CFG.ribbonCut });
}

/* ---------- for tests ---------- */
TAC.m2 = {
  cfg:CFG,
  run:() => R,
  kc:() => R ? R.kcW : null,
  uche:() => R ? R.uche : null,
  post:(id, o) => post(id, o),
  setPhase:(name, secs) => { if(!R) return false; if(name === 'lookup' || name === 'phone') startPhase(name, secs); else R.phase = name; return true; },
  chain:() => CHAIN.map(p => p.slice()),
  arc:() => ARC.slice(),
  // the matrix: confront with a forced opening row ('legacy'|'seen'|'soft'|'bolt'|'scan'|'cold'), and reset this run in place
  _confront:(row, o) => R && R.kcIt ? confront(R.kcIt, R.kcIt, Object.assign({ force:row || null }, o || {})) : null,
  // (in place: the tick, frame and watcher closures hold this run object)
  _reset:(o) => {
    if(!R) return false;
    o = o || {};
    const old = R;
    if(old.beat){ clearTimeout(old.beat); old.beat = null; }
    if(old.beatCam){ try{ TPCAM.override = null; }catch(e){} old.beatCam = false; }
    const keep = { kcW:old.kcW, kcIt:old.kcIt, origConfront:old.origConfront, subs:old.subs, gatePoi:old.gatePoi, id:old.id };
    const tm = old.tunde.mesh, U = old.uche;
    const n = freshRun(); runN--;
    Object.assign(old, n, keep);
    old.tunde.mesh = tm;
    Object.assign(U, { pursue:false, kneel:false, goal:null, role:null, orderT:null, dir:null, lastCall:null, veerMoving:false, tasks:{ arrive:0, veer:0, act:0, callout:0 } });
    old.uche = U;
    if(U.mesh && !o.keepUche){ U.post = 'van'; U.posted = false; placeAt(0, 'van'); postRing('van'); }
    else if(U.mesh) U.mesh.scale.y = U.crouched ? CFG.uche.crouch : 1;
    old.awake = o.awake != null ? !!o.awake : !!G()._marketTunde; old.awakeAt = 0; old.cyc = 0; startPhase('phone');
    if(old.kcW) old.kcW.reset(0);
    return true;
  },
  _place:(id, s) => { if(!R || !R.uche.mesh) return false; const p = id === 'gate' ? 'back' : id; R.uche.post = p; R.uche.posted = true; placeAt(s != null ? s : ARC[POST_AT[p]], p); postRing(p); return true; },
};
})();
