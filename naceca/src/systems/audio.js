/* =========================================================================
   NACECA · systems/audio.js
   Auto-extracted from game.js by split_modules.py
   Edit the modules; run build.py to rebuild naceca.html.
   ========================================================================= */
/* ===================== 8b. AUDIO (Web Audio API — fully synthesized) ===================== */
const AUDIO = {
  ctx:null, master:null, musicGain:null, sfxGain:null, ambientGain:null,
  enabled:true, started:false, currentAmbient:null, currentMusic:null
};
function initAudio(){
  if(AUDIO.started) return;
  try{
    AUDIO.ctx = new (window.AudioContext || window.webkitAudioContext)();
    AUDIO.master = AUDIO.ctx.createGain(); AUDIO.master.gain.value = 0.6; AUDIO.master.connect(AUDIO.ctx.destination);
    AUDIO.sfxGain = AUDIO.ctx.createGain(); AUDIO.sfxGain.gain.value = 0.7; AUDIO.sfxGain.connect(AUDIO.master);
    AUDIO.musicGain = AUDIO.ctx.createGain(); AUDIO.musicGain.gain.value = 0.35; AUDIO.musicGain.connect(AUDIO.master);
    AUDIO.ambientGain = AUDIO.ctx.createGain(); AUDIO.ambientGain.gain.value = 0.5; AUDIO.ambientGain.connect(AUDIO.master);
    AUDIO.started = true;
  }catch(e){ AUDIO.enabled = false; }
}
function ensureAudio(){
  if(!AUDIO.started) initAudio();
  if(AUDIO.ctx && AUDIO.ctx.state === 'suspended') AUDIO.ctx.resume();
}
function sfxClick(){
  if(!AUDIO.enabled) return; ensureAudio();
  const ctx=AUDIO.ctx, t=ctx.currentTime;
  const o=ctx.createOscillator(), g=ctx.createGain();
  o.type='triangle'; o.frequency.setValueAtTime(880,t);
  o.frequency.exponentialRampToValueAtTime(440,t+0.06);
  g.gain.setValueAtTime(0.0,t); g.gain.linearRampToValueAtTime(0.25,t+0.005);
  g.gain.exponentialRampToValueAtTime(0.001,t+0.08);
  o.connect(g); g.connect(AUDIO.sfxGain); o.start(t); o.stop(t+0.1);
}
function sfxBlip(){
  if(!AUDIO.enabled) return; ensureAudio();
  const ctx=AUDIO.ctx, t=ctx.currentTime;
  const o=ctx.createOscillator(), g=ctx.createGain();
  o.type='square'; o.frequency.setValueAtTime(420 + Math.random()*180,t);
  g.gain.setValueAtTime(0.0,t); g.gain.linearRampToValueAtTime(0.06,t+0.005);
  g.gain.exponentialRampToValueAtTime(0.001,t+0.05);
  o.connect(g); g.connect(AUDIO.sfxGain); o.start(t); o.stop(t+0.06);
}
function sfxFootstep(){
  if(!AUDIO.enabled) return; ensureAudio();
  const ctx=AUDIO.ctx, t=ctx.currentTime;
  // pink-ish noise burst
  const buffer = ctx.createBuffer(1, 1024, ctx.sampleRate);
  const d = buffer.getChannelData(0);
  for(let i=0;i<1024;i++){ d[i] = (Math.random()*2-1) * (1 - i/1024); }
  const src = ctx.createBufferSource(); src.buffer = buffer;
  const f = ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value = 380 + Math.random()*120;
  const g = ctx.createGain(); g.gain.setValueAtTime(0.18,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.12);
  src.connect(f); f.connect(g); g.connect(AUDIO.sfxGain); src.start(t);
}
function sfxEvidence(){
  if(!AUDIO.enabled) return; ensureAudio();
  const ctx=AUDIO.ctx, t=ctx.currentTime;
  // bell-like — two stacked sine partials
  [523.25, 659.25, 987.77].forEach((freq,i)=>{
    const o=ctx.createOscillator(), g=ctx.createGain();
    o.type='sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0,t+i*0.04);
    g.gain.linearRampToValueAtTime(0.18 - i*0.04, t+i*0.04+0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t+0.9+i*0.04);
    o.connect(g); g.connect(AUDIO.sfxGain); o.start(t+i*0.04); o.stop(t+1.0+i*0.04);
  });
}
function sfxAlert(){
  if(!AUDIO.enabled) return; ensureAudio();
  const ctx=AUDIO.ctx, t=ctx.currentTime;
  for(let i=0;i<2;i++){
    const o=ctx.createOscillator(), g=ctx.createGain();
    o.type='sawtooth'; o.frequency.value = 220;
    o.frequency.linearRampToValueAtTime(440, t+i*0.16+0.06);
    g.gain.setValueAtTime(0.0, t+i*0.16);
    g.gain.linearRampToValueAtTime(0.12, t+i*0.16+0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t+i*0.16+0.14);
    o.connect(g); g.connect(AUDIO.sfxGain); o.start(t+i*0.16); o.stop(t+i*0.16+0.16);
  }
}
function sfxComplete(){
  if(!AUDIO.enabled) return; ensureAudio();
  const ctx=AUDIO.ctx, t=ctx.currentTime;
  // ascending arpeggio C-E-G-C
  [261.63, 329.63, 392.00, 523.25].forEach((f,i)=>{
    const o=ctx.createOscillator(), g=ctx.createGain();
    o.type='triangle'; o.frequency.value = f;
    const dt = t + i*0.11;
    g.gain.setValueAtTime(0.0, dt);
    g.gain.linearRampToValueAtTime(0.22, dt+0.02);
    g.gain.exponentialRampToValueAtTime(0.001, dt+0.5);
    o.connect(g); g.connect(AUDIO.sfxGain); o.start(dt); o.stop(dt+0.55);
  });
}
function sfxScan(){
  if(!AUDIO.enabled) return; ensureAudio();
  const ctx=AUDIO.ctx, t=ctx.currentTime;
  const o=ctx.createOscillator(), g=ctx.createGain();
  o.type='sine'; o.frequency.setValueAtTime(180,t);
  o.frequency.linearRampToValueAtTime(720,t+0.6);
  g.gain.setValueAtTime(0.0,t); g.gain.linearRampToValueAtTime(0.1,t+0.05);
  g.gain.exponentialRampToValueAtTime(0.001,t+0.7);
  o.connect(g); g.connect(AUDIO.sfxGain); o.start(t); o.stop(t+0.75);
}
function sfxFail(){
  if(!AUDIO.enabled) return; ensureAudio();
  const ctx=AUDIO.ctx, t=ctx.currentTime;
  const o=ctx.createOscillator(), g=ctx.createGain();
  o.type='sawtooth'; o.frequency.setValueAtTime(220,t);
  o.frequency.exponentialRampToValueAtTime(82,t+0.4);
  g.gain.setValueAtTime(0.0,t); g.gain.linearRampToValueAtTime(0.18,t+0.02);
  g.gain.exponentialRampToValueAtTime(0.001,t+0.5);
  o.connect(g); g.connect(AUDIO.sfxGain); o.start(t); o.stop(t+0.55);
}

/* AMBIENT BEDS — looping per-scene. Each call replaces the previous ambient. */
function startAmbient(kind){
  if(!AUDIO.enabled) return; ensureAudio();
  stopAmbient();
  const ctx=AUDIO.ctx, t=ctx.currentTime;
  const nodes = [];
  if(kind==='hq'){
    // warm office hum: low sine + slow filtered noise
    const o=ctx.createOscillator(); o.type='sine'; o.frequency.value=82;
    const og=ctx.createGain(); og.gain.value=0.06; o.connect(og); og.connect(AUDIO.ambientGain); o.start(t);
    nodes.push(o);
    const buffer = ctx.createBuffer(2, ctx.sampleRate*4, ctx.sampleRate);
    for(let ch=0;ch<2;ch++){ const d=buffer.getChannelData(ch); for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*0.4; }
    const src=ctx.createBufferSource(); src.buffer=buffer; src.loop=true;
    const f=ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=300;
    const g=ctx.createGain(); g.gain.value=0.04;
    src.connect(f); f.connect(g); g.connect(AUDIO.ambientGain); src.start(t); nodes.push(src);
  } else if(kind==='market'){
    // bustling crowd: filtered noise + occasional high blips
    const buffer = ctx.createBuffer(2, ctx.sampleRate*4, ctx.sampleRate);
    for(let ch=0;ch<2;ch++){ const d=buffer.getChannelData(ch); for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*0.5; }
    const src=ctx.createBufferSource(); src.buffer=buffer; src.loop=true;
    const f=ctx.createBiquadFilter(); f.type='bandpass'; f.frequency.value=600; f.Q.value=0.4;
    const g=ctx.createGain(); g.gain.value=0.13;
    src.connect(f); f.connect(g); g.connect(AUDIO.ambientGain); src.start(t); nodes.push(src);
    // distant horn
    const horn=ctx.createOscillator(); horn.type='sawtooth'; horn.frequency.value=110;
    const hg=ctx.createGain(); hg.gain.value=0.0; horn.connect(hg); hg.connect(AUDIO.ambientGain); horn.start(t);
    AUDIO._hornInterval = setInterval(()=>{
      const tt = ctx.currentTime;
      hg.gain.cancelScheduledValues(tt);
      hg.gain.setValueAtTime(0,tt); hg.gain.linearRampToValueAtTime(0.04,tt+0.1);
      hg.gain.linearRampToValueAtTime(0,tt+0.6);
    }, 4500 + Math.random()*3000);
    nodes.push(horn);
  } else if(kind==='mansion'){
    // tense night — low drone + occasional cricket-like high
    const o=ctx.createOscillator(); o.type='sine'; o.frequency.value=55;
    const og=ctx.createGain(); og.gain.value=0.09; o.connect(og); og.connect(AUDIO.ambientGain); o.start(t);
    nodes.push(o);
    const o2=ctx.createOscillator(); o2.type='sine'; o2.frequency.value=82.4;
    const og2=ctx.createGain(); og2.gain.value=0.05; o2.connect(og2); og2.connect(AUDIO.ambientGain); o2.start(t);
    nodes.push(o2);
  } else if(kind==='checkpoint'){
    // highway — distant wind + occasional truck
    const buffer = ctx.createBuffer(2, ctx.sampleRate*4, ctx.sampleRate);
    for(let ch=0;ch<2;ch++){ const d=buffer.getChannelData(ch); for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1); }
    const src=ctx.createBufferSource(); src.buffer=buffer; src.loop=true;
    const f=ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=220;
    const g=ctx.createGain(); g.gain.value=0.09;
    src.connect(f); f.connect(g); g.connect(AUDIO.ambientGain); src.start(t); nodes.push(src);
  } else if(kind==='title'){
    // cinematic pad — slow detuned chord
    [82.4, 110, 130.8, 164.8].forEach(f=>{
      const o=ctx.createOscillator(); o.type='sine'; o.frequency.value = f;
      const g=ctx.createGain(); g.gain.value = 0.04;
      o.connect(g); g.connect(AUDIO.ambientGain); o.start(t); nodes.push(o);
    });
  } else if(kind==='shrine'){
    // dawn forest — soft wind drone + bird-like high blips at random intervals
    const buffer = ctx.createBuffer(2, ctx.sampleRate*4, ctx.sampleRate);
    for(let ch=0;ch<2;ch++){ const d=buffer.getChannelData(ch); for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1); }
    const src=ctx.createBufferSource(); src.buffer=buffer; src.loop=true;
    const f=ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=180;
    const g=ctx.createGain(); g.gain.value=0.07;
    src.connect(f); f.connect(g); g.connect(AUDIO.ambientGain); src.start(t); nodes.push(src);
    // intermittent bird chirps
    AUDIO._birdInterval = setInterval(()=>{
      const tt = ctx.currentTime;
      const o = ctx.createOscillator(); o.type = 'sine';
      const fr = 1200 + Math.random()*800;
      o.frequency.setValueAtTime(fr, tt);
      o.frequency.exponentialRampToValueAtTime(fr*1.3, tt+0.07);
      o.frequency.exponentialRampToValueAtTime(fr*0.8, tt+0.14);
      const og = ctx.createGain();
      og.gain.setValueAtTime(0, tt); og.gain.linearRampToValueAtTime(0.04, tt+0.02);
      og.gain.exponentialRampToValueAtTime(0.001, tt+0.18);
      o.connect(og); og.connect(AUDIO.ambientGain); o.start(tt); o.stop(tt+0.2);
    }, 2200 + Math.random()*1800);
  } else if(kind==='asaba'){
    // industrial warehouse — low hum + distant generator throb + occasional metal creaks
    const o1=ctx.createOscillator(); o1.type='sawtooth'; o1.frequency.value=46;
    const og1=ctx.createGain(); og1.gain.value=0.06; o1.connect(og1); og1.connect(AUDIO.ambientGain); o1.start(t);
    nodes.push(o1);
    const o2=ctx.createOscillator(); o2.type='sine'; o2.frequency.value=92;
    const og2=ctx.createGain(); og2.gain.value=0.04; o2.connect(og2); og2.connect(AUDIO.ambientGain); o2.start(t);
    nodes.push(o2);
    // intermittent metal creak
    AUDIO._creakInterval = setInterval(()=>{
      const tt = ctx.currentTime;
      const o = ctx.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(180 + Math.random()*100, tt);
      o.frequency.exponentialRampToValueAtTime(60, tt+0.4);
      const og = ctx.createGain();
      og.gain.setValueAtTime(0, tt); og.gain.linearRampToValueAtTime(0.04, tt+0.05);
      og.gain.exponentialRampToValueAtTime(0.001, tt+0.5);
      o.connect(og); og.connect(AUDIO.ambientGain); o.start(tt); o.stop(tt+0.55);
    }, 5500 + Math.random()*3500);
  }
  AUDIO.currentAmbient = { kind, nodes };
}
function stopAmbient(){
  if(!AUDIO.currentAmbient) return;
  const t = AUDIO.ctx.currentTime;
  AUDIO.currentAmbient.nodes.forEach(n=>{ try{ n.stop(t+0.1); }catch(e){} });
  if(AUDIO._hornInterval){ clearInterval(AUDIO._hornInterval); AUDIO._hornInterval=null; }
  if(AUDIO._birdInterval){ clearInterval(AUDIO._birdInterval); AUDIO._birdInterval=null; }
  if(AUDIO._creakInterval){ clearInterval(AUDIO._creakInterval); AUDIO._creakInterval=null; }
  AUDIO.currentAmbient = null;
}

/* ===================== MUSIC LAYER (HTML5 Audio + Web Audio gain) =====================
   Music tracks are large MP3s loaded lazily from assets/music/<name>.mp3 (relative to the
   HTML page). We pipe them through Web Audio so master + music gain still apply, and use
   linear ramps for fade-in/out and cross-fades. Tracks loop by default.

   Each entry in MUSIC is a single URL OR an array of URL variants — playing a variant key
   resolves to a randomly-picked track for the current session, so every playthrough sounds
   slightly different. The "session pick" is cached so a track doesn't change mid-mission.
*/
const MUSIC = {
  title:         ['assets/music/title.mp3',         'assets/music/title_alt.mp3'],
  ambient_lagos: ['assets/music/ambient_lagos.mp3', 'assets/music/ambient_lagos_alt.mp3'],
  investigation: ['assets/music/investigation.mp3', 'assets/music/investigation_alt.mp3'],
  stealth:       ['assets/music/stealth.mp3',       'assets/music/stealth_alt.mp3'],
  victory:       ['assets/music/victory.mp3',       'assets/music/victory_alt.mp3'],
  trailer:       ['assets/music/trailer.mp3',       'assets/music/trailer_alt.mp3'],
  chase:          'assets/music/chase.mp3',  // single 16s stinger — no variant
};
AUDIO._music = { current:null, currentName:null, fadeMs:1200, sessionPicks:{} };

/* Resolve a music key to a concrete URL.
   For variant arrays, picks once per (key, session) and remembers. */
function _resolveMusicUrl(name){
  const entry = MUSIC[name];
  if(!entry) return null;
  if(typeof entry === 'string') return entry;
  // It's an array of variants — pick once per session and cache
  if(!(name in AUDIO._music.sessionPicks)){
    AUDIO._music.sessionPicks[name] = entry[Math.floor(Math.random() * entry.length)];
  }
  return AUDIO._music.sessionPicks[name];
}

function _createMusicNode(url, opts){
  if(!AUDIO.enabled || !AUDIO.ctx) return null;
  const audioEl = new Audio(url);
  audioEl.crossOrigin = 'anonymous';
  audioEl.loop = (opts && opts.loop !== false);
  audioEl.preload = 'auto';
  let source;
  try {
    source = AUDIO.ctx.createMediaElementSource(audioEl);
  } catch(e) {
    // Fallback: just use the audio element directly without Web Audio routing
    audioEl.volume = 0;
    return { audioEl, gain:null, source:null, target:null };
  }
  const gain = AUDIO.ctx.createGain();
  gain.gain.value = 0;
  source.connect(gain);
  gain.connect(AUDIO.musicGain);
  return { audioEl, gain, source };
}

function playMusic(name, opts){
  if(!AUDIO.enabled) return;
  ensureAudio();
  opts = opts || {};
  const fadeMs = opts.fadeMs != null ? opts.fadeMs : AUDIO._music.fadeMs;
  const targetVol = opts.volume != null ? opts.volume : 1.0;

  // Already playing this track? Just adjust volume if needed.
  if(AUDIO._music.currentName === name && AUDIO._music.current && !AUDIO._music.current.audioEl.ended){
    return;
  }

  const url = _resolveMusicUrl(name);
  if(!url){ return; }

  const node = _createMusicNode(url, opts);
  if(!node){ return; }

  // Try to start playback. Browser may reject if user hasn't interacted yet —
  // in that case the boot handler will retry on the first interaction.
  const startPromise = node.audioEl.play();
  if(startPromise && startPromise.catch){
    startPromise.catch(()=>{ /* silent — autoplay blocked */ });
  }

  // Fade in via Web Audio gain ramp (preferred), or volume property (fallback)
  const t0 = AUDIO.ctx.currentTime;
  if(node.gain){
    node.gain.gain.setValueAtTime(0, t0);
    node.gain.gain.linearRampToValueAtTime(targetVol, t0 + fadeMs/1000);
  } else {
    // legacy fallback — animate audioEl.volume manually
    let i = 0;
    const steps = 30;
    const iv = setInterval(()=>{
      i++;
      node.audioEl.volume = Math.min(targetVol, (i/steps) * targetVol);
      if(i >= steps){ clearInterval(iv); }
    }, fadeMs/30);
  }

  // Fade out and disconnect previous track
  if(AUDIO._music.current){
    const old = AUDIO._music.current;
    if(old.gain){
      const o = old.gain.gain;
      o.cancelScheduledValues(t0);
      o.setValueAtTime(o.value, t0);
      o.linearRampToValueAtTime(0, t0 + fadeMs/1000);
    }
    setTimeout(()=>{
      try { old.audioEl.pause(); old.audioEl.src = ''; } catch(e){}
      try { if(old.source) old.source.disconnect(); if(old.gain) old.gain.disconnect(); } catch(e){}
    }, fadeMs + 100);
  }

  AUDIO._music.current = node;
  AUDIO._music.currentName = name;
}

function stopMusic(fadeMs){
  if(!AUDIO._music.current) return;
  fadeMs = fadeMs != null ? fadeMs : 800;
  const old = AUDIO._music.current;
  if(old.gain && AUDIO.ctx){
    const t0 = AUDIO.ctx.currentTime;
    const o = old.gain.gain;
    o.cancelScheduledValues(t0);
    o.setValueAtTime(o.value, t0);
    o.linearRampToValueAtTime(0, t0 + fadeMs/1000);
  }
  setTimeout(()=>{
    try { old.audioEl.pause(); old.audioEl.src = ''; } catch(e){}
    try { if(old.source) old.source.disconnect(); if(old.gain) old.gain.disconnect(); } catch(e){}
  }, fadeMs + 100);
  AUDIO._music.current = null;
  AUDIO._music.currentName = null;
}

/* Convenience helper — picks the right track for a scene/mission. Called from
   mission_flow.beginMission and from boot for the title. */
function musicForScene(kind){
  switch(kind){
    case 'title':      playMusic('title',         { volume: 0.85 }); break;
    case 'm1':         playMusic('ambient_lagos', { volume: 0.55 }); break;  // HQ briefing — chill afrobeat
    case 'm2':         playMusic('ambient_lagos', { volume: 0.65 }); break;  // Market patrol
    case 'm3':         playMusic('stealth',       { volume: 0.65 }); break;  // Mansion raid (night)
    case 'm4':         playMusic('stealth',       { volume: 0.55 }); break;  // Checkpoint
    case 'm5':         playMusic('investigation', { volume: 0.40 }); break;  // Forest shrine — quiet, contemplative
    case 'm6':         playMusic('stealth',       { volume: 0.55 }); break;  // Asaba — switches to chase on chaos trigger
    case 'm6_chase':   playMusic('chase',         { volume: 0.85, loop: false }); break;
    case 'investigation': playMusic('investigation', { volume: 0.55 }); break;  // Evidence Board overlay
    case 'victory':    playMusic('victory',       { volume: 0.75, loop: false }); break;
    default:           stopMusic();
  }
}

