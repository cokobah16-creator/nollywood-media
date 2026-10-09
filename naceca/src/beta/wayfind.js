/* =========================================================================
   NACECA · beta/wayfind.js — friends-beta pass (see docs/SYNC-2026-10-08-beta.md)
   "I can't find the mission." One answer to "where next?", shared by every
   piece of guidance:
     · WAY.current()   the objective that is really next (OR-alternatives fixed)
     · WAY.resolve()   that objective as a place in the world:
                         catch-chase suspect (or his last-seen point) first,
                         then OBJ_TARGETS[mission][objective], then a label
                         match, then the old guideTarget()
     · HUD tracker     "Speak with informant Tunde · 42 m" in the mission panel
     · guide marker    over the target when on screen (SETTINGS.marker)
     · edge arrow      always on when the target is off screen, kept clear of
                         the HUD clusters, with the distance under it
     · minimap         streets move with the player; objective blip, pointed
                         player arrow, red suspect blip during a chase
   guideTarget() is wrapped, so the marker, arrow, opening camera and the
   60 s hint all agree with the HUD text. Stealth tails (TAIL, the cold-open
   courier, the car) keep the targeting they always had.
   ========================================================================= */
(function(){
'use strict';
const WAY = window.WAY = window.WAY || {};
const wrap = (name, make)=>{
  if(typeof V12 !== 'undefined' && V12.wrap) return V12.wrap(name, make);
  const orig = window[name]; if(typeof orig !== 'function') return false;
  const f = make(orig); f._v12orig = orig; window[name] = f; return true;
};
const now = ()=>performance.now();
const hyp = Math.hypot;
const lc = s => String(s == null ? '' : s).trim().toLowerCase();
const inCar = ()=>document.body.classList.contains('v12-car');

/* the player mesh belongs to the scene on screen (ENGINE.player goes stale in the car mission) */
WAY.playerOk = function(){
  const P = ENGINE.player, sc = ENGINE.scene;
  if(!P || !sc || !P.position || inCar()) return false;
  return P.parent === sc || window.__THREE_STUB__ === true;   // the headless test harness has no scene graph
};

/* ---------- 1 · the objective that is really next ---------- */
// "OR —" objectives are alternatives: once one is done the others are no longer current
function orGroups(objs){
  const groups = []; let g = null;
  objs.forEach(o=>{
    if(/^\s*OR\b/i.test(o.text || '')){ if(!g){ g = []; groups.push(g); } g.push(o); }
    else g = null;
  });
  return groups.filter(x=>x.length > 1);
}
// is an alternative still possible? (M6: the runner can be gone, Tobi can be lost)
const ALT_OK = {
  m6: id => {
    if(id === 'o2_runner'){ const rn = ENGINE._asabaRunner; return !(rn && rn.userData && rn.userData._escaped); }
    if(id === 'o3_hostage') return !S.game._asabaHostageLost;
    return true;
  },
};
// mission beats where the first unfinished objective isn't the next thing to do
const CURRENT_OVERRIDE = {
  // cold open: the courier is in the alley and the gate is chained — the gate is next, not "follow"
  m0: objs => (typeof CO !== 'undefined' && CO.phase >= 3 && !CO.climbed && !CO.revealed) ? 'co_gate' : null,
};
WAY.current = function(){
  const objs = (typeof S !== 'undefined' && S.game && S.game.objectives) || [];
  const mid = S.game && S.game.currentMission;
  const skip = new Set(); let extra = 0, orIds = new Set();
  for(const g of orGroups(objs)){
    extra += g.length - 1;
    g.forEach(o=>orIds.add(o.id));
    if(g.some(o=>o.done)){ g.forEach(o=>{ if(!o.done) skip.add(o.id); }); continue; }
    const ok = ALT_OK[mid];
    if(ok){ const live = g.filter(o=>ok(o.id)); if(live.length && live.length < g.length) g.forEach(o=>{ if(!live.includes(o)) skip.add(o.id); }); }
  }
  let obj = objs.find(o=>!o.done && !skip.has(o.id)) || null;
  const ov = CURRENT_OVERRIDE[mid];
  if(ov){ let id = null; try{ id = ov(objs); }catch(e){} const o = id && objs.find(x=>x.id === id && !x.done); if(o) obj = o; }
  const done = objs.filter(o=>o.done).length;
  return { obj, done, total: Math.max(done, objs.length - extra), inOr: !!(obj && orIds.has(obj.id)), count: objs.length };
};

/* ---------- 2 · objective → world target ---------- */
const UI = { ui:true };
const OBJ_TARGETS = {
  m0: {
    // across the road from wherever Kelechi is standing — never closer to the courier than the tail allows
    co_cross: ()=>{ const P = ENGINE.player && ENGINE.player.position; return P ? { pos:[Math.max(-40, Math.min(12, P.x)), -6.0], label:'Cross the road' } : UI; },
    co_follow: ()=>{
      if(typeof CO === 'undefined') return null;
      if(CO.phase >= 3 && CO.climbed && !CO.revealed) return { pos:[28.6, -33.2] };   // along the alley, under the pipe
      return CO.courier ? { mesh:CO.courier } : null;
    },
    co_gate: ()=> (typeof CO !== 'undefined' && CO.gateTried) ? 'Climb the crates' : 'Open the gate',
    co_reveal: ()=>{
      if(typeof CO === 'undefined') return UI;
      if(!CO.revealed) return { pos:[28.6, -33.2] };
      const t = (CO.targets || []).find(t=>!CO.obs[t.key]);
      if(t){ const v = t.pos(); return { pos:[+v.x || 0, +v.z || 0], label:t.label }; }
      return UI;
    },
    co_chase: UI,
  },
  m1: { o1_brief:'Approach Commander', o_board:'Check the case board', o_phone:'Read your phone', o_casefile:UI, o2_exit:'Deploy to Ikeja Market' },
  m2: { o1_tunde:'Speak with Informant Tunde', o2_scan:'Scan suspect phone', o3_runner:'Confront teen suspect', o4_table:UI },
  m3: { o1_brief_squad:['Plan the raid with Sgt. Uche', 'Brief with Sgt. Uche'], o5_civ:'Calm and escort the child', o4_wipe:['Inspect laptop', 'Stop laptop wipe'], o6_arrest:'Move on suspect' },
  m3n: { n1_uche:'Talk to Uche', n2_desk:'Play the voicemail', n3_table:'Work the operations table', n4_home:'Go home' },
  m4: { o1_brief_aks:'Brief with Anti-Kidnapping Squad Inspector Chidi', o2_driver:'Question driver Musa', o3_manifest:'Verify cargo manifest', o4_search:'Open rear compartment', o5_decide:UI },
  m5: { o1_brief_uche:'Brief with Sgt. Uche', o2_custodian:'Speak with Pa Eze', o3_decide:'Speak with Pa Eze',
        o4_evidence: ()=> S.game._shrinePotsSearched ? 'Inspect Cartel Cache' : 'Search Libation Pots' },
  m6: { o1_breach: ()=> S.game._asabaBriefed ? { pos:[-6.5, 5.5], label:'Breach the warehouse' } : 'Brief with Sgt. Uche',   // the breach is the x > -8 line
        o2_runner:'Apprehend the runner', o3_hostage:'Rescue the hostage' },
  m7: { o1_brief:'Brief with Sgt. Uche', o2_engineer:'Speak with Engr. Osaro', o3_power:'Restart the generator', o4_trace:'Run the call trace', o5_decide:UI },
  m8: { o1_brief:'Brief with Sgt. Uche', o2_find:'Talk to KC', o2b_tail:UI, o2c_call:'Take the call in the van',
        o3_entry: ()=> (typeof musaGaveTip === 'function' && musaGaveTip()) ? 'Try the back gate' : 'Breach the front gate',
        o4_osas:'Free Osas', o5_voice:UI },
  '*': { hb_uche:'Talk to Uche', hb_chidi:'Talk to Inspector Chidi', hb_phone:'Check your phone', hb_news:'Read the news board',
         c1_go:UI, c2_stay:UI, c3_where:UI },
};
WAY.OBJ_TARGETS = OBJ_TARGETS;

function liveIt(it){
  if(!it || it.consumed || !it.mesh || !it.mesh.position) return false;
  return it.mesh.visible !== false || !!it.allowHidden;
}
function findIt(labels){
  const want = labels.map(lc), its = ENGINE.interactables || [];
  const P = ENGINE.player && ENGINE.player.position;
  let best = null, bd = Infinity;
  for(const it of its){
    if(!liveIt(it) || !want.includes(lc(it.label))) continue;
    const d = P ? hyp(it.mesh.position.x - P.x, it.mesh.position.z - P.z) : 0;
    if(d < bd){ bd = d; best = it; }
  }
  return best;
}
// world position: the mesh itself for scene children (live), a snapshot for meshes nested in a group (undressed scenes)
const _wp = { v:null };
function worldPos(m){
  const nested = m.parent && m.parent !== ENGINE.scene && typeof m.getWorldPosition === 'function' && window.__THREE_STUB__ !== true;
  if(!nested) return m.position;
  if(!_wp.v) _wp.v = new THREE.Vector3();
  m.getWorldPosition(_wp.v);
  return { x:_wp.v.x, y:_wp.v.y, z:_wp.v.z };
}
const fromIt = (it, kind)=>({ pos:worldPos(it.mesh), mesh:it.mesh, label:it.label, labelY:it.labelY, kind });
function evalSpec(spec){
  let s = spec;
  for(let i = 0; i < 3 && typeof s === 'function'; i++){ try{ s = s(); }catch(e){ s = null; } }
  return s;
}
function resolveObjective(o){
  const mid = S.game.currentMission;
  const tab = OBJ_TARGETS[mid] || {};
  const spec = evalSpec(Object.prototype.hasOwnProperty.call(tab, o.id) ? tab[o.id] : (OBJ_TARGETS['*'][o.id]));
  if(spec && spec.ui) return { uiOnly:true, label:o.text, kind:'ui' };
  if(spec && spec.pos) return { pos:{ x:spec.pos[0], z:spec.pos[1] }, label:spec.label || o.text, kind:'point' };
  if(spec && spec.mesh && spec.mesh.position && spec.mesh.visible !== false) return { pos:spec.mesh.position, mesh:spec.mesh, label:spec.label || o.text, kind:'mesh' };
  const labels = typeof spec === 'string' ? [spec] : Array.isArray(spec) ? spec : (spec && spec.label ? [spec.label] : []);
  let it = labels.length ? findIt(labels) : null;
  if(it) return fromIt(it, 'objective');
  it = findIt([o.text]);                                   // objective text == interactable label
  if(it) return fromIt(it, 'label');
  const g = WAY._origGuide && WAY._origGuide();             // last resort: the first unused interactable
  if(g && g.mesh && g.mesh.position) return { pos:g.mesh.position, mesh:g.mesh, label:g.label, labelY:g.labelY, kind:'fallback' };
  return { uiOnly:true, label:o.text, kind:'ui' };
}
function findExit(){
  const re = (typeof TERMINAL_RE !== 'undefined') ? TERMINAL_RE : /Extract|Deploy|Board NACECA/;
  const it = (ENGINE.interactables || []).find(i=>liveIt(i) && re.test(i.label || ''));
  return it ? fromIt(it, 'exit') : null;
}
const titleName = s => { s = String(s || ''); return s.length <= 3 ? s : s.charAt(0) + s.slice(1).toLowerCase(); };
function chaseResult(ch){
  const c = CHASE.active, cur = WAY.current();
  let label = cur.obj ? cur.obj.text : titleName(c.label);
  if(ch.catch && !cur.inOr) label = 'Catch ' + titleName(c.label);
  return { pos:ch.pos, mesh:ch.mode === 'live' ? c.runner : null, label, kind:'chase', mode:ch.mode, catch:ch.catch };
}
const RC = { scene:null, key:null, t:0, val:null };
WAY.resolve = function(){
  if(typeof S === 'undefined' || !S.game || !ENGINE.scene || inCar()) return null;
  const ch = WAY.chase ? WAY.chase() : null;
  if(ch && ch.pos) return chaseResult(ch);
  if(typeof TAIL !== 'undefined' && TAIL.active && TAIL.active.target){          // stealth tail: unchanged
    const m = TAIL.active.target;
    return { pos:m.position, mesh:m, label:'Follow the ' + String(TAIL.active.label || 'target').toLowerCase(), kind:'tail' };
  }
  const cur = WAY.current();
  const key = (cur.obj ? cur.obj.id + '|' + cur.obj.text : '-') + '|' + cur.done + '|' + (S.game.currentMission || '');
  const t = now();
  if(RC.scene === ENGINE.scene && RC.key === key && t - RC.t < 400) return RC.val;
  let val = null;
  try{ val = cur.obj ? resolveObjective(cur.obj) : findExit(); }catch(e){ console.warn('[wayfind] resolve', e); val = null; }
  RC.scene = ENGINE.scene; RC.key = key; RC.t = t; RC.val = val;
  return val;
};
WAY.invalidate = function(){ RC.key = null; };

/* the old guidance now asks the resolver, so marker, arrow, hint and opening camera agree with the HUD */
const _anchor = { position:{ x:0, y:0, z:0 }, visible:true, userData:{} };
wrap('guideTarget', orig => {
  WAY._origGuide = orig;
  return function(){
    let r;
    try{ r = WAY.resolve(); }catch(e){ return orig.apply(this, arguments); }
    if(!r || r.uiOnly || !r.pos) return null;
    if(r.mesh) return { mesh:r.mesh, label:r.label, labelY:r.labelY };
    _anchor.position.x = r.pos.x; _anchor.position.z = r.pos.z;
    return { mesh:_anchor, label:r.label, labelY:0.6 };
  };
});

/* ---------- 3 · HUD tracker: objective text + distance ---------- */
const TRK = { t:0, row:null, txt:null, dist:null, cnt:null, lastTxt:null, lastDist:null, lastCnt:null, writes:0 };
WAY._trk = TRK;
function trackerState(){
  const c = WAY.current();
  if(!c.obj) return { cls:'allclear', text:'All clear — extract', count:`${c.total}/${c.total}`, c };
  return { cls:'active', text:c.obj.text, count:`${Math.min(c.total, c.done + 1)}/${c.total}`, c };
}
WAY.trackerText = ()=> TRK.lastTxt;
WAY.renderTracker = function(){
  const el = document.getElementById('hud-mission-objs'); if(!el) return;
  const objs = (S.game && S.game.objectives) || [];
  if(!objs.length){ el.innerHTML = ''; TRK.row = null; return; }
  const st = trackerState();
  // the distance flows inline after the text (and wraps with it); the count stays on the right
  el.innerHTML = `<div class="obj ${st.cls} way-obj" style="display:flex"><span class="obj-txt"><span class="obj-t"></span><span class="obj-dist"></span></span><span class="obj-count"></span></div>`;
  TRK.row = el.firstChild; TRK.txt = TRK.row.querySelector('.obj-t'); TRK.dist = TRK.row.querySelector('.obj-dist'); TRK.cnt = TRK.row.querySelector('.obj-count');
  TRK.lastTxt = TRK.lastDist = TRK.lastCnt = null; TRK.cls = st.cls;
  WAY.invalidate();
  WAY.updateTracker(true);
};
// ~5 Hz: text (a catch chase reads "Catch KC"), distance, count — only written when they change
WAY.updateTracker = function(force){
  const t = now();
  if(!force && t - TRK.t < 200) return;
  TRK.t = t;
  if(!TRK.row || !TRK.row.isConnected){ if(document.getElementById('hud-mission-objs') && (S.game.objectives || []).length) WAY.renderTracker(); return; }
  const st = trackerState();
  if(st.cls !== TRK.cls){ TRK.row.classList.toggle('active', st.cls === 'active'); TRK.row.classList.toggle('allclear', st.cls === 'allclear'); TRK.cls = st.cls; }
  const r = WAY.resolve();
  let text = st.text, dist = '';
  if(r && r.kind === 'chase' && r.catch && !st.c.inOr) text = r.label;
  if(r && !r.uiOnly && r.pos && WAY.playerOk()){
    const P = ENGINE.player.position, d = Math.round(hyp(r.pos.x - P.x, r.pos.z - P.z));
    dist = (r.mode === 'lastseen' ? '· last seen ' : '· ') + d + ' m';
  }
  if(text !== TRK.lastTxt){ TRK.txt.textContent = text; TRK.lastTxt = text; TRK.writes++; }
  if(dist !== TRK.lastDist){ TRK.dist.textContent = dist; TRK.lastDist = dist; TRK.row.classList.toggle('has-dist', !!dist); TRK.writes++; }
  if(st.count !== TRK.lastCnt){ TRK.cnt.textContent = st.count; TRK.lastCnt = st.count; TRK.writes++; }
};
wrap('renderObjectives', orig => function(){
  const r = orig.apply(this, arguments);
  try{ WAY.renderTracker(); }catch(e){ console.warn('[wayfind] tracker', e); }
  return r;
});

/* ---------- 4 · marker over the target + edge arrow ---------- */
const _pv = { v:null };
WAY.project = function(x, y, z){
  if(WAY._testProject) return WAY._testProject(x, y, z);
  const cam = ENGINE.camera;
  if(!_pv.v) _pv.v = new THREE.Vector3();
  if(cam.updateMatrixWorld) cam.updateMatrixWorld();      // the camera moved this frame: refresh its inverse before projecting
  _pv.v.set(x, y, z); _pv.v.project(cam);
  return { x:(_pv.v.x*0.5 + 0.5)*innerWidth, y:(-_pv.v.y*0.5 + 0.5)*innerHeight, behind:_pv.v.z > 1 };
};
// HUD clusters the arrow must not sit on, measured twice a second
const HUD_SEL = ['.hud-topleft', '.hud-topright', '#hud-pausebtn', '#hud-ctx', '#joystick', '#hud-sprint', '#hud-casebar',
                 '#hud-meters', '.hud-rep', '.hud-bottomright', '#eye-ind', '#radio-sub', '#hint-chip.show', '.touch-btns'];
const HR = { t:-1e9, rects:[], w:0, h:0 };
WAY.hudRects = function(force){
  const t = now();
  if(!force && t - HR.t < 500 && HR.w === innerWidth && HR.h === innerHeight) return HR.rects;
  HR.t = t; HR.w = innerWidth; HR.h = innerHeight; HR.rects = [];
  for(const sel of HUD_SEL){
    document.querySelectorAll(sel).forEach(el=>{
      const r = el.getBoundingClientRect();
      if(r.width < 2 || r.height < 2) return;
      const cs = getComputedStyle(el);
      if(cs.visibility === 'hidden' || +cs.opacity < 0.05) return;
      HR.rects.push({ l:r.left, t:r.top, r:r.right, b:r.bottom, sel });
    });
  }
  return HR.rects;
};
const ARW = { hw:24, top:24, bot:40, margin:12 };   // arrow box around its centre: icon + distance tag
function hitsHud(x, y, rects){
  for(const q of rects){
    if(x + ARW.hw > q.l - 6 && x - ARW.hw < q.r + 6 && y + ARW.bot > q.t - 6 && y - ARW.top < q.b + 6) return true;
  }
  return false;
}
// point on the screen edge toward (x,y), stepped inward along the same ray until clear of the HUD
WAY.edgePoint = function(x, y){
  const W = innerWidth, H = innerHeight, cx = W/2, cy = H/2;
  let dx = x - cx, dy = y - cy;
  if(Math.abs(dx) + Math.abs(dy) < 1){ dx = 0; dy = 1; }
  const ang = Math.atan2(dy, dx), ca = Math.cos(ang), sa = Math.sin(ang);
  const hw = W/2 - ARW.hw - ARW.margin, hhT = H/2 - ARW.top - ARW.margin, hhB = H/2 - ARW.bot - ARW.margin;
  const tx = Math.abs(ca) > 1e-6 ? hw / Math.abs(ca) : Infinity;
  const ty = Math.abs(sa) > 1e-6 ? (sa < 0 ? hhT : hhB) / Math.abs(sa) : Infinity;
  let t = Math.min(tx, ty), px = cx + ca*t, py = cy + sa*t;
  const rects = WAY.hudRects();
  for(let k = 0; k < 80 && t > 0 && hitsHud(px, py, rects); k++){ t -= 8; px = cx + ca*t; py = cy + sa*t; }
  return { x:px, y:py, ang };
};
const GS = { mk:null, arw:null, mkOn:false, arOn:false, chase:false, distTxt:'', mkDist:'' };
WAY._gs = GS;
function hideGuide(){
  if(GS.mkOn && GS.mk){ GS.mk.style.display = 'none'; GS.mkOn = false; }
  if(GS.arOn && GS.arw){ GS.arw.style.display = 'none'; GS.arOn = false; }
}
WAY.hideGuide = hideGuide;
function guideEls(){
  if(typeof ensureGuideEls === 'function') ensureGuideEls();
  GS.mk = (typeof GUIDE !== 'undefined' && GUIDE.el) || document.getElementById('guide-marker');
  GS.arw = (typeof GUIDE !== 'undefined' && GUIDE.arrow) || document.getElementById('guide-arrow');
  if(GS.arw && !GS.arw.querySelector('.ga-ico')) GS.arw.innerHTML = `<span class="ga-ico">${typeof icon === 'function' ? icon('pointer') : ''}</span><span class="ga-dist"></span>`;
  if(GS.mk && !GS.mk.querySelector('.gm-chev svg')) GS.mk.innerHTML = `<div class="gm-chev">${typeof icon === 'function' ? icon('down') : ''}</div><div class="gm-dist"></div>`;
  return GS.mk && GS.arw;
}
// once per playing frame (from updateGuidance)
WAY.guide = function(dt){
  WAY._gRan = true;
  WAY.updateTracker();
  if(!guideEls()) return;
  const ok = WAY.playerOk() && ENGINE.camera;
  const r = ok ? WAY.resolve() : null;
  if(!r || r.uiOnly || !r.pos){ hideGuide(); WAY._guideState = 'none'; return; }
  const P = ENGINE.player.position;
  const dist = hyp(r.pos.x - P.x, r.pos.z - P.z);
  const m = r.mesh, u = m && m.userData;
  const h = (u && u._skinned) ? 2.25 : (u && u._rig) ? 2.25 * (m.scale ? (+m.scale.y || 1) : 1) : (r.labelY !== undefined ? r.labelY + 0.55 : (r.kind === 'chase' ? 1.9 : 1.6));
  const s = WAY.project(r.pos.x, (m && +m.position.y || 0) + h, r.pos.z);
  const W = innerWidth, H = innerHeight;
  let onScreen = !s.behind && s.x > 40 && s.x < W - 40 && s.y > 70 && s.y < H - 70;
  if(onScreen){ for(const q of WAY.hudRects()){ if(s.x > q.l && s.x < q.r && s.y > q.t && s.y < q.b){ onScreen = false; break; } } }
  const chase = r.kind === 'chase';
  if(chase !== GS.chase){ GS.chase = chase; GS.mk.classList.toggle('chase', chase); GS.arw.classList.toggle('chase', chase); }
  const dtxt = Math.round(dist) + ' m';
  if(onScreen){
    if(GS.arOn){ GS.arw.style.display = 'none'; GS.arOn = false; }
    const show = SETTINGS.marker === 'on' && dist >= 2.2;
    if(show){
      if(!GS.mkOn){ GS.mk.style.display = 'block'; GS.mkOn = true; }
      styleC(GS.mk, 'transform', `translate(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px) translate(-50%,-100%)`);
      if(GS.mkDist !== dtxt){ GS.mk.querySelector('.gm-dist').textContent = dtxt; GS.mkDist = dtxt; }
    } else if(GS.mkOn){ GS.mk.style.display = 'none'; GS.mkOn = false; }
    WAY._guideState = show ? 'marker' : 'onscreen';
  } else {
    if(GS.mkOn){ GS.mk.style.display = 'none'; GS.mkOn = false; }
    let x = s.x, y = s.y;
    if(s.behind){ x = W - x; y = H - y; }
    const e = WAY.edgePoint(x, y);
    if(!GS.arOn){ GS.arw.style.display = 'flex'; GS.arOn = true; }
    styleC(GS.arw, 'transform', `translate(${e.x.toFixed(1)}px, ${e.y.toFixed(1)}px)`);
    const ico = GS.arw.querySelector('.ga-ico svg') || GS.arw.firstChild;   // the pointer turns, the chip stays square
    styleC(ico, 'transform', `rotate(${e.ang.toFixed(2)}rad)`);
    if(GS.distTxt !== dtxt){ GS.arw.lastChild.textContent = dtxt; GS.distTxt = dtxt; }
    WAY._arrowAt = e; WAY._guideState = 'arrow';
  }
};
// the tick only runs guidance while playing: hide it on any frame it didn't run (menus, dialogue, car, title)
wrap('updateAtmosphere', orig => function(){
  const r = orig.apply(this, arguments);
  if(WAY._gRan) WAY._gRan = false; else hideGuide();
  return r;
});
wrap('newScene', orig => function(){
  hideGuide(); WAY.invalidate(); MM.sig = ''; HR.t = -1e9;
  return orig.apply(this, arguments);
});

/* ---------- 5 · minimap ---------- */
// MINIMAP.scale (4–6 per scene) → the rim is scale × 4.5 m from the player; streets, dots and blips share one transform
const MM = { ready:false, sig:'', k:1 };
WAY._mm = MM;
const SVGNS = 'http://www.w3.org/2000/svg';
const sv = (tag, attrs, parent)=>{ const e = document.createElementNS(SVGNS, tag); for(const k in attrs) e.setAttribute(k, attrs[k]); if(parent) parent.appendChild(e); return e; };
function mmSetup(){
  if(MM.ready && MM.svg && MM.svg.isConnected) return true;
  const svg = document.getElementById('minimap-svg'), streets = document.getElementById('minimap-streets'), pois = document.getElementById('minimap-pois'), arrow = document.getElementById('minimap-arrow');
  if(!svg || !streets || !pois || !arrow) return false;
  let defs = svg.querySelector('defs'); if(!defs){ defs = sv('defs', {}); svg.insertBefore(defs, svg.firstChild); }
  if(!document.getElementById('mm-clip')){ const cp = sv('clipPath', { id:'mm-clip' }, defs); sv('circle', { cx:0, cy:0, r:47 }, cp); }
  let world = document.getElementById('mm-world');
  if(!world){ world = sv('g', { id:'mm-world', 'clip-path':'url(#mm-clip)' }); svg.insertBefore(world, streets); world.appendChild(streets); world.appendChild(pois); }
  let blips = document.getElementById('mm-blips');
  if(!blips){
    blips = sv('g', { id:'mm-blips' }); svg.insertBefore(blips, arrow);
    MM.obj = sv('g', { id:'mm-obj', class:'mm-obj', style:'display:none' }, blips);
    sv('circle', { r:3.2, class:'mm-obj-dot' }, MM.obj);
    MM.objTip = sv('path', { d:'M3.6 -2.6 L7.4 0 L3.6 2.6 Z', class:'mm-obj-tip' }, MM.obj);
    MM.sus = sv('g', { id:'mm-sus', class:'mm-sus', style:'display:none' }, blips);
    MM.susPing = sv('circle', { r:4, class:'mm-sus-ping' }, MM.sus);
    MM.susDot = sv('circle', { r:3.4, class:'mm-sus-dot' }, MM.sus);
  } else { MM.obj = document.getElementById('mm-obj'); MM.objTip = MM.obj.querySelector('.mm-obj-tip'); MM.sus = document.getElementById('mm-sus'); MM.susPing = MM.sus.querySelector('.mm-sus-ping'); MM.susDot = MM.sus.querySelector('.mm-sus-dot'); }
  // a pointed arrow (tip forward) instead of the diamond, and no centre dot under it
  arrow.setAttribute('d', 'M0 -5.6 L3.6 3.8 L0 1.8 L-3.6 3.8 Z'); arrow.classList.add('mm-me');
  svg.querySelectorAll(':scope > circle').forEach(c=>{ if(+c.getAttribute('r') < 4) c.style.display = 'none'; });
  MM.svg = svg; MM.streets = streets; MM.pois = pois; MM.arrow = arrow; MM.ready = true; MM.sig = ''; MM.tf = MM.at = null;
  return true;
}
const RIM = 42;
function rimPos(dx, dz){
  const r = hyp(dx, dz);
  if(r <= RIM) return { x:dx, y:dz, clamped:false, ang:Math.atan2(dz, dx) };
  return { x:dx/r*RIM, y:dz/r*RIM, clamped:true, ang:Math.atan2(dz, dx) };
}
// per-frame writers: touch the DOM only when the value actually changes
function styleC(el, n, v){ const k = '_s_' + n; if(el[k] !== v){ el[k] = v; el.style[n] = v; } }
function attrC(el, n, v){ const k = '_a_' + n; if(el[k] !== v){ el[k] = v; el.setAttribute(n, v); } }
function clsC(el, c, on){ if(el.classList.contains(c) !== !!on) el.classList.toggle(c, !!on); }
function setG(g, on){ const d = on ? '' : 'none'; if(g.style.display !== d) g.style.display = d; }
WAY.minimap = function(){
  if(!ENGINE.player || !mmSetup()) return;
  const P = ENGINE.player.position, px = +P.x || 0, pz = +P.z || 0;
  const R = Math.max(8, (typeof MINIMAP !== 'undefined' && MINIMAP.scale || 6) * 4.5), k = 48 / R;
  MM.k = k;
  const tf = `scale(${k.toFixed(4)}) translate(${(-px).toFixed(2)} ${(-pz).toFixed(2)})`;
  if(tf !== MM.tf){ MM.streets.setAttribute('transform', tf); MM.pois.setAttribute('transform', tf); MM.tf = tf; }
  // static dots: redrawn only when the list changes (the suspect's spawn dot goes once a chase has started here)
  const pois = (typeof MINIMAP !== 'undefined' && MINIMAP.pois) || [];
  const hideSus = WAY._chaseScene === ENGINE.scene;
  let sig = k.toFixed(3) + (hideSus ? 'S' : 's');
  for(const p of pois) sig += '|' + p.x + ',' + p.z + ',' + (p.color || '') + ',' + (p.r || '') + (p.suspect ? '!' : '');
  if(sig !== MM.sig){
    MM.sig = sig;
    MM.pois.innerHTML = pois.filter(p=>!(p.suspect && hideSus)).map(p=>`<circle cx="${p.x}" cy="${p.z}" r="${((p.r || 1.6)/k).toFixed(3)}" fill="${p.color || '#ff5050'}" opacity="0.9"${p.suspect ? ' class="mm-suspect-static"' : ''}/>`).join('');
  }
  // facing: yaw = atan2(wx, wz); the arrow points up (-y) at rest, so rotate by 180° − yaw
  const yaw = (+ENGINE.playerYaw || 0) * 180 / Math.PI;
  const at = `rotate(${(180 - yaw).toFixed(1)})`;
  if(at !== MM.at){ MM.arrow.setAttribute('transform', at); MM.at = at; }
  // live blips
  const ch = WAY.chase ? WAY.chase() : null;
  if(ch && ch.pos){
    const q = rimPos((ch.pos.x - px)*k, (ch.pos.z - pz)*k);
    attrC(MM.sus, 'transform', `translate(${q.x.toFixed(1)} ${q.y.toFixed(1)})`);
    const ls = ch.mode === 'lastseen';
    clsC(MM.sus, 'lastseen', ls); clsC(MM.sus, 'rim', q.clamped);
    if(ls && MM.ping !== ch.ping){ MM.ping = ch.ping; MM.susPing.classList.remove('go'); void MM.svg.getBoundingClientRect(); MM.susPing.classList.add('go'); }
    setG(MM.sus, true); MM.susState = { x:q.x, y:q.y, rim:q.clamped, mode:ch.mode };
  } else { setG(MM.sus, false); MM.susState = null; }
  const r = ch ? null : WAY.resolve();
  if(r && !r.uiOnly && r.pos && WAY.playerOk()){
    const q = rimPos((r.pos.x - px)*k, (r.pos.z - pz)*k);
    attrC(MM.obj, 'transform', `translate(${q.x.toFixed(1)} ${q.y.toFixed(1)}) rotate(${(q.ang*180/Math.PI).toFixed(0)})`);
    clsC(MM.obj, 'rim', q.clamped);
    setG(MM.obj, true); MM.objState = { x:q.x, y:q.y, rim:q.clamped };
  } else { setG(MM.obj, false); MM.objState = null; }
};
wrap('updateMinimap', orig => function(){
  try{ WAY.minimap(); }
  catch(e){ console.warn('[wayfind] minimap', e); MM.ready = false; return orig.apply(this, arguments); }
});

})();
