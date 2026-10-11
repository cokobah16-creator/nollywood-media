/* =========================================================================
   NACECA · src/tactics/tac_core.js — crouch everywhere, the mission summary
   Owner: Team A (foundations). DESIGN-tactics.md §5.5, §7.A; foundations.md §1d.

   · the Crouch setting (Auto / Hold / Toggle) in Settings › GAMEPLAY
   · toggle on the keyboard (C, Shift stands you up), hold on touch (opt-in)
   · the fallback rig crouches: 1.25 m/s with or without Shift, scale.y 0.55
   · the desktop CROUCHED chip in TAC.ui.chipRow()
   · ICONS.crouch, the Grey Man skill text, and the tac_mission event
   Everything is a wrap or an in-layer mutation: no existing file is edited.
   ========================================================================= */
(function(){
'use strict';
const TAC = window.TAC;
if(!TAC || !TAC.v || TAC._core) return;
TAC._core = true;
const V = () => window.V12 || null;
const wrap = (name, make) => (V() && V12.wrap) ? V12.wrap(name, make) : false;
const isTouch = () => !!(document.body && document.body.classList.contains('touch-active'));
const eng = () => (typeof ENGINE !== 'undefined') ? ENGINE : null;
const overlay = () => typeof isOverlayOpen === 'function' && isOverlayOpen();

/* ---------- the per-mission counters every A module adds to (logged as tac_mission) ---------- */
const fresh = () => ({ crouchSecs:0, crouchOn:0, missShown:0, missSuppressed:0, radio:{ shown:0, dropped:0, preempted:0 },
  seen:{ notice:0, alarm:0 }, evaded:0 });
TAC._ms = fresh();
TAC.onScene(() => { TAC._ms = fresh(); }, { order:-20 });

/* ---------- ICONS.crouch (the HUD's own crouch figure, art_pass_v8.js:2335) ---------- */
try{ if(typeof ICONS !== 'undefined' && !ICONS.crouch) ICONS.crouch = '<circle cx="13" cy="4.5" r="2"/><path d="M12 8l-3 4 4 2-2 6M9 12l-3 2M13 14l5 1"/>'; }catch(e){ TAC._err(e); }

/* ---------- Grey Man now names every watcher it slows (CAPS is private to v12_core) ---------- */
try{
  const gm = (typeof SKILLS !== 'undefined' && Array.isArray(SKILLS.fieldcraft)) ? SKILLS.fieldcraft.find(s => s && s.id === 'greyman') : null;
  if(gm){ gm.desc = "When someone is watching for you, they're slower to notice you."; gm.where = "The courier · KC at his stand · Obi's study · the finale tail"; }
}catch(e){ TAC._err(e); }

/* ---------- the setting row: Crouch · Auto / Hold / Toggle ---------- */
try{
  if(typeof SETTINGS_DEFAULT !== 'undefined'){
    SETTINGS_DEFAULT.crouch = 'auto';
    if(typeof SETTINGS !== 'undefined' && SETTINGS.crouch === undefined) SETTINGS.crouch = SETTINGS_DEFAULT.crouch;
  }
  if(typeof SETTINGS_UI !== 'undefined' && !SETTINGS_UI.some(r => r && r.key === 'crouch')){
    const row = { key:'crouch', label:'Crouch', opts:[['auto', 'Auto'], ['hold', 'Hold'], ['toggle', 'Toggle']],
      // worded for the device in hand: no key names on touch
      get note(){
        return isTouch()
          ? 'Auto and Toggle: tap CROUCH to crouch, tap it again to stand. Hold: you crouch only while your thumb is on CROUCH.'
          : 'Auto and Hold: you crouch while you hold C. Toggle: C crouches, C again or Shift stands you up.';
      } };
    const i = SETTINGS_UI.findIndex(r => r && r.key === 'hints');
    SETTINGS_UI.splice(i >= 0 ? i + 1 : SETTINGS_UI.length, 0, row);
  }
}catch(e){ TAC._err(e); }

/* ---------- crouch state helpers ---------- */
const btn = () => document.getElementById('ctx-crouch');
const setCrouch = on => {
  const e = eng(); if(!e || !e.keys) return;
  e.keys.KeyC = !!on;
  const b = btn(); if(b) b.classList.toggle('on', !!on);
  if(on && typeof setSprint === 'function' && (e.keys.ShiftLeft || e.keys.ShiftRight) && isTouch()) setSprint(false);
  chip();
};
const isText = el => !!el && (el.tagName === 'TEXTAREA' || el.isContentEditable ||
  (el.tagName === 'INPUT' && !/^(button|checkbox|radio|range|submit|reset|color|file|image)$/i.test(el.type || '')));
const live = () => { const e = eng(); return !!(e && e.movementEnabled !== false && !overlay()); };
// typing is typing: whatever bindInput does with C in a text field, the toggle is put back once the event is done.
// One snapshot per burst of keys (taken before bindInput sees the first one), so quick typing can't overwrite it.
let keepC = null, keepT = null;
function keepToggle(){
  const e = eng(); if(!e || !e.keys) return;
  if(keepC === null) keepC = !!e.keys.KeyC;
  clearTimeout(keepT);
  keepT = setTimeout(() => { try{ if(keepC !== null) e.keys.KeyC = keepC; }finally{ keepC = null; } }, 0);
}

/* ---------- keyboard: toggle mode owns C (capture phase, before bindInput's document listener) ---------- */
window.addEventListener('keydown', ev => {
  try{
    if(TAC.crouch.mode() !== 'toggle') return;
    const e = eng(); if(!e || !e.keys) return;
    if(ev.code === 'KeyC'){
      if(isText(ev.target) || isText(document.activeElement)){ keepToggle(); return; }
      ev.stopPropagation();                       // bindInput never sees C in toggle mode (the pause menu can't stand you up)
      if(ev.repeat || !live()) return;
      setCrouch(!e.keys.KeyC);
      return;
    }
    if((ev.code === 'ShiftLeft' || ev.code === 'ShiftRight') && e.keys.KeyC && live() && !isText(ev.target)) setCrouch(false);
  }catch(err){ TAC._err(err); }
}, true);
window.addEventListener('keyup', ev => {
  try{
    if(ev.code !== 'KeyC' || TAC.crouch.mode() !== 'toggle') return;
    if(isText(ev.target) || isText(document.activeElement)){ keepToggle(); return; }
    ev.stopPropagation();
  }catch(err){ TAC._err(err); }
}, true);
// losing focus mid-hold would leave a held crouch stuck on; a toggled crouch is a choice and stays
window.addEventListener('blur', () => {
  try{ const e = eng(); if(e && e.keys && e.keys.KeyC && TAC.crouch.mode() === 'hold') setCrouch(false); }catch(err){ TAC._err(err); }
});

/* ---------- touch: hold-to-crouch on #ctx-crouch (opt-in: SETTINGS.crouch 'hold') ----------
   The mode is read when each event fires, so a change in Settings applies mid-mission. */
const holdOnTouch = () => isTouch() && TAC.crouch.mode() === 'hold';
function bindHold(el){
  if(!el || el._tacHold) return;
  el._tacHold = true;
  el.addEventListener('touchstart', () => { try{ if(holdOnTouch()) setCrouch(true); }catch(err){ TAC._err(err); } }, { passive:true });
  const up = () => { try{ if(holdOnTouch()) setCrouch(false); }catch(err){ TAC._err(err); } };
  el.addEventListener('touchend', up, { passive:true });
  el.addEventListener('touchcancel', up, { passive:true });
}
// the base tap toggles on click; in hold mode the click that follows a touch must not flip it back
window.addEventListener('click', ev => {
  try{
    if(!holdOnTouch()) return;
    const t = ev.target && ev.target.closest ? ev.target.closest('#ctx-crouch') : null;
    if(t){ ev.stopPropagation(); ev.preventDefault(); }
  }catch(err){ TAC._err(err); }
}, true);

/* ---------- the desktop chip: [crouch] CROUCHED · release C / · C to stand ---------- */
let chipEl = null, chipKey = '';
function chip(){
  try{
    const e = eng(); if(!e || !e.keys) return;
    if(!chipEl || !chipEl.isConnected){
      if(!document.getElementById('hud')) return;
      const row = TAC.ui.chipRow();
      chipEl = document.getElementById('tac-crouch') || document.createElement('div');
      chipEl.id = 'tac-crouch'; chipEl.className = 'tac-chip tac-crouch';
      if(!chipEl.parentNode) row.appendChild(chipEl);
      chipKey = '';
    }
    const on = !!e.keys.KeyC && !isTouch() && e.movementEnabled !== false;
    const mode = TAC.crouch.mode();
    const key = on ? mode : 'off';
    if(key === chipKey) return;
    chipKey = key;
    chipEl.classList.toggle('show', on);
    if(on) chipEl.innerHTML = `${typeof icon === 'function' ? icon('crouch') : ''}<span class="tac-chip-t">CROUCHED</span><span class="tac-chip-k">· ${mode === 'toggle' ? 'C to stand' : 'release C'}</span>`;
  }catch(err){ TAC._err(err); }
}
TAC._crouchChip = chip;
wrap('ensureHudV8', orig => function(){
  const r = orig.apply(this, arguments);
  try{ bindHold(btn()); chip(); }catch(e){ TAC._err(e); }
  return r;
});
try{ bindHold(btn()); }catch(e){}

/* ---------- the fallback rig crouches like the skinned one (MOVE.sneak, people_art_pass.js:490) ---------- */
const SNEAK = () => (typeof MOVE !== 'undefined' && MOVE.sneak) || 1.25;
wrap('updatePlayerLegacy', orig => function(dt){
  const e = eng();
  if(!e || !e.player || !e.keys || !e.keys.KeyC) return orig.apply(this, arguments);
  const shift = !!(e.keys.ShiftLeft || e.keys.ShiftRight), k0 = e.speedMul, sy0 = +e.player.scale.y || 0;
  e.speedMul = (k0 == null ? 1 : k0) * (SNEAK() / (shift ? 5.2 : 3.0));
  let r;
  try{ r = orig.apply(this, arguments); } finally { e.speedMul = k0; }
  // the silhouette drops to 0.55 of standing (the sight model's 0.8 m crouched target), not 0.7
  try{ const k = Math.min(1, Math.max(0, (+dt || 0) * 8)); e.player.scale.y = sy0 + (0.55 - sy0) * k; }catch(err){}
  return r;
});

/* ---------- crouch time and starts, per mission; the chip follows the key every frame ---------- */
let wasCrouch = false;
TAC.onFrame(dt => {
  const c = TAC.player.crouch();
  if(c){ TAC._ms.crouchSecs += dt; if(!wasCrouch) TAC._ms.crouchOn++; }
  wasCrouch = c;
  chip();
}, { order:50 });

/* ---------- tac_mission: one summary per completeMission (silent included), then the original ---------- */
wrap('completeMission', orig => function(id){
  try{
    const m = TAC._ms || fresh();
    let g = { boxes:0, ghost:0, unknown:0 };
    try{ const c = TAC.geo && TAC.geo.classify ? TAC.geo.classify() : null; if(c) g = { boxes:c.boxes | 0, ghost:c.ghost | 0, unknown:c.unknown | 0 }; }catch(e){ TAC._err(e); }
    if(V() && V12.log) V12.log('tac_mission', { m:id, crouchMode:TAC.crouch.mode(), crouchSecs:Math.round(m.crouchSecs * 10) / 10, crouchOn:m.crouchOn,
      missShown:m.missShown, missSuppressed:m.missSuppressed, radio:Object.assign({}, m.radio), seen:Object.assign({}, m.seen), evaded:m.evaded, geo:g });
  }catch(e){ TAC._err(e); }
  return orig.apply(this, arguments);
});
})();
