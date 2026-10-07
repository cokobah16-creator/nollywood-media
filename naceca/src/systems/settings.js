/* =========================================================================
   NACECA · systems/settings.js
   Player settings, stored on the device (separate from the save, so they
   survive a new game). Covers: volume mixer, difficulty, timed sequences,
   subtitles, graphics presets (+ automatic downgrade on slow phones), touch
   layout, objective marker, hints, reduce motion, colour-blind mode, haptics,
   and music ducking under dialogue.
   ========================================================================= */

const SETTINGS_KEY = 'naceca_settings_v1';
const SETTINGS_DEFAULT = {
  music: 70, sfx: 80, ambient: 60,
  difficulty: 'standard',      // story | standard | hard
  timed: 'normal',             // normal | extended | off
  subSize: 'M', subBg: 'on',
  gfx: 'auto',                 // auto | low | medium | high
  touchSize: 'M', hand: 'right',
  marker: 'on', hints: 'on',
  reduceMotion: 'off', colourBlind: 'off', haptics: 'on',
  lang: 'mixed',               // mixed (Pidgin where characters speak it) | english
};
let SETTINGS = Object.assign({}, SETTINGS_DEFAULT);

function loadSettings(){
  try{ const raw = localStorage.getItem(SETTINGS_KEY); if(raw) SETTINGS = Object.assign({}, SETTINGS_DEFAULT, JSON.parse(raw)); }catch(e){}
  applySettings();
}
function saveSettings(){ try{ localStorage.setItem(SETTINGS_KEY, JSON.stringify(SETTINGS)); }catch(e){} }

/* ---------- rates used by the timed systems ---------- */
// countdowns (wipe clock, smoke clock, trace window) advance at this rate
function timerRate(){
  if(SETTINGS.timed === 'off') return 0;
  const ext = SETTINGS.timed === 'extended' ? 1/1.6 : 1;
  const diff = {story:0.75, standard:1, hard:1.2}[SETTINGS.difficulty] || 1;
  return ext * diff;
}
// how fast fleeing suspects run (relative)
function chaseRate(){ return {story:0.9, standard:1, hard:1.06}[SETTINGS.difficulty] || 1; }
function isStoryMode(){ return SETTINGS.difficulty === 'story'; }

/* ---------- haptics ---------- */
function haptic(pattern){
  if(SETTINGS.haptics !== 'on') return;
  try{ if(navigator.vibrate) navigator.vibrate(pattern); }catch(e){}
}

/* ---------- audio: mixer + ducking ---------- */
let _ducked = false;
function applyAudioLevels(){
  if(typeof AUDIO === 'undefined' || !AUDIO.ctx) return;
  const t = AUDIO.ctx.currentTime;
  const m = 0.35 * (SETTINGS.music/100) * (_ducked ? 0.38 : 1);
  if(AUDIO.musicGain)   AUDIO.musicGain.gain.setTargetAtTime(m, t, 0.12);
  if(AUDIO.sfxGain)     AUDIO.sfxGain.gain.setTargetAtTime(0.7 * (SETTINGS.sfx/100), t, 0.05);
  if(AUDIO.ambientGain) AUDIO.ambientGain.gain.setTargetAtTime(0.5 * (SETTINGS.ambient/100) * (_ducked ? 0.6 : 1), t, 0.12);
}
function duckMusic(on){ if(_ducked === on) return; _ducked = on; applyAudioLevels(); }

/* ---------- graphics ---------- */
const GFX_LEVELS = ['low','medium','high'];
let _gfxActive = null, _fps = {frames:0, t:0, slow:0};
function autoGfxGuess(){
  const touch = ('ontouchstart' in window) || (navigator.maxTouchPoints||0) > 0;
  const mem = navigator.deviceMemory || 4, cores = navigator.hardwareConcurrency || 4;
  if(touch && (mem <= 3 || cores <= 4)) return 'low';
  if(touch) return 'medium';
  return 'high';
}
function applyGraphics(level){
  const r = ENGINE && ENGINE.renderer; if(!r) return;
  _gfxActive = level;
  const dpr = window.devicePixelRatio || 1;
  r.setPixelRatio(level==='low' ? 1 : level==='medium' ? Math.min(dpr, 1.5) : Math.min(dpr, 2));
  r.shadowMap.enabled = level !== 'low';
  r.shadowMap.type = level === 'high' ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
  ENGINE._postOff = level === 'low';
  if(ENGINE.scene) ENGINE.scene.traverse(o=>{ if(o.material){ (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{ m.needsUpdate = true; }); } });
  window.dispatchEvent(new Event('resize'));
}
function currentGfx(){ return _gfxActive || (SETTINGS.gfx==='auto' ? autoGfxGuess() : SETTINGS.gfx); }
/* called every frame: in Auto, step graphics down if a phone can't hold ~24 fps */
function settingsTick(dt){
  if(SETTINGS.gfx !== 'auto' || !ENGINE.movementEnabled) return;
  _fps.frames++; _fps.t += dt;
  if(_fps.t >= 4){
    const fps = _fps.frames / _fps.t; _fps.frames = 0; _fps.t = 0;
    const i = GFX_LEVELS.indexOf(currentGfx());
    if(fps < 24 && i > 0){
      _fps.slow++;
      if(_fps.slow >= 2){ _fps.slow = 0; applyGraphics(GFX_LEVELS[i-1]); toast('GRAPHICS ADJUSTED', `Switched to ${GFX_LEVELS[i-1].toUpperCase()} for smoother play`, 1800); }
    } else _fps.slow = 0;
  }
}

/* ---------- apply everything ---------- */
function applySettings(){
  const b = document.body; if(!b) return;
  b.dataset.sub = SETTINGS.subSize;
  b.classList.toggle('sub-bg-off', SETTINGS.subBg === 'off');
  b.dataset.touch = SETTINGS.touchSize;
  b.classList.toggle('left-handed', SETTINGS.hand === 'left');
  b.classList.toggle('reduce-motion', SETTINGS.reduceMotion === 'on');
  b.classList.toggle('cb', SETTINGS.colourBlind === 'on');
  applyAudioLevels();
  applyGraphics(SETTINGS.gfx === 'auto' ? (_gfxActive || autoGfxGuess()) : SETTINGS.gfx);
}

/* ---------- settings screen ---------- */
const SETTINGS_UI = [
  { group:'SOUND' },
  { key:'music',   label:'Music',    type:'range' },
  { key:'sfx',     label:'Effects',  type:'range' },
  { key:'ambient', label:'Ambience', type:'range' },
  { group:'GAMEPLAY' },
  { key:'difficulty', label:'Difficulty', opts:[['story','Story'],['standard','Standard'],['hard','Hard']],
    note:'Story slows timers and suspects, and wrong puzzle answers stay crossed out.' },
  { key:'timed', label:'Timed sequences', opts:[['normal','Normal'],['extended','Extended'],['off','No timers']],
    note:'Wipe, smoke and trace clocks. Chases still run.' },
  { key:'marker', label:'Objective marker', opts:[['on','On'],['off','Off']] },
  { key:'hints',  label:'Hints when stuck', opts:[['on','On'],['off','Off']] },
  { key:'lang',   label:'Dialogue', opts:[['mixed','Pidgin + English'],['english','English only']] },
  { group:'DISPLAY' },
  { key:'subSize', label:'Subtitle size', opts:[['S','S'],['M','M'],['L','L'],['XL','XL']] },
  { key:'subBg',   label:'Subtitle background', opts:[['on','Solid'],['off','See-through']] },
  { key:'gfx',     label:'Graphics', opts:[['auto','Auto'],['low','Low'],['medium','Medium'],['high','High']] },
  { key:'colourBlind', label:'Colour-blind palette', opts:[['off','Off'],['on','On']] },
  { key:'reduceMotion', label:'Reduce motion', opts:[['off','Off'],['on','On']], note:'No camera shake or screen flashes.' },
  { group:'TOUCH' },
  { key:'touchSize', label:'Button size', opts:[['S','S'],['M','M'],['L','L']] },
  { key:'hand',      label:'Layout', opts:[['right','Stick left'],['left','Stick right']] },
  { key:'haptics',   label:'Vibration', opts:[['on','On'],['off','Off']] },
];
function ensureSettingsScreen(){
  if(document.getElementById('screen-settings')) return;
  const ov = document.createElement('div');
  ov.className = 'overlay'; ov.id = 'screen-settings';
  ov.innerHTML = `<div class="overlay-bg"></div>
    <div class="settings-frame">
      <div class="settings-head"><h2>SETTINGS</h2><button class="btn ghost" id="btn-settings-close">◀ BACK</button></div>
      <div class="settings-body" id="settings-body"></div>
      <div class="settings-foot"><button class="btn ghost" id="btn-settings-reset">RESET TO DEFAULTS</button></div>
    </div>`;
  document.getElementById('game-root').appendChild(ov);
  document.getElementById('btn-settings-close').addEventListener('click', closeSettings);
  document.getElementById('btn-settings-reset').addEventListener('click', ()=>{ SETTINGS = Object.assign({}, SETTINGS_DEFAULT); saveSettings(); _gfxActive = null; applySettings(); renderSettings(); });
}
function renderSettings(){
  const body = document.getElementById('settings-body'); body.innerHTML = '';
  for(const row of SETTINGS_UI){
    if(row.group){ const h = document.createElement('div'); h.className = 'set-group'; h.textContent = row.group; body.appendChild(h); continue; }
    const el = document.createElement('div'); el.className = 'set-row';
    let ctl = '';
    if(row.type === 'range'){
      ctl = `<input type="range" min="0" max="100" step="5" value="${SETTINGS[row.key]}" data-k="${row.key}"><span class="set-val">${SETTINGS[row.key]}</span>`;
    } else {
      ctl = `<div class="seg">${row.opts.map(([v,l])=>`<button class="${SETTINGS[row.key]===v?'on':''}" data-k="${row.key}" data-v="${v}">${l}</button>`).join('')}</div>`;
    }
    el.innerHTML = `<div class="set-label">${row.label}${row.note?`<div class="set-note">${row.note}</div>`:''}</div><div class="set-ctl">${ctl}</div>`;
    body.appendChild(el);
  }
  body.querySelectorAll('input[type=range]').forEach(inp=>{
    inp.addEventListener('input', ()=>{ SETTINGS[inp.dataset.k] = +inp.value; inp.nextElementSibling.textContent = inp.value; applyAudioLevels(); saveSettings(); });
  });
  body.querySelectorAll('.seg button').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      SETTINGS[btn.dataset.k] = btn.dataset.v;
      if(btn.dataset.k === 'gfx') _gfxActive = null;
      saveSettings(); applySettings();
      btn.parentElement.querySelectorAll('button').forEach(b=>b.classList.toggle('on', b===btn));
      if(typeof sfxClick === 'function') sfxClick();
    });
  });
}
let _settingsReturn = null;
function openSettings(){
  ensureSettingsScreen(); renderSettings();
  _settingsReturn = [...document.querySelectorAll('.overlay.show')].map(o=>o.id)[0] || null;
  showOverlay('screen-settings');
}
function closeSettings(){ showOverlay(_settingsReturn); }
