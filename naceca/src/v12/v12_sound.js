/* =========================================================================
   NACECA · v12 Phase 2 — the city you can hear
   Layers on top of each case's ambient bed: a ceiling fan and keyboards at
   HQ, hawkers and okadas in Ikeja, crickets over the Lekki wall, trucks on
   the Benin bypass, insects in Ozalla, water at Asaba, generators all over
   Ekosodin. Footsteps change with the ground under Kelechi. Everything is
   synthesised (no new files) and runs through the game's ambient and effects
   buses, so the Settings sliders and the sound toggle still rule it.
   ========================================================================= */
(function(){
'use strict';
const V12 = window.V12;
const SND = V12.SND = V12.SND || {};
const rnd = (a, b)=>a + Math.random()*(b - a);
const pick = a => a[Math.floor(Math.random()*a.length)];
const live = ()=>typeof AUDIO !== 'undefined' && AUDIO.enabled && AUDIO.ctx && AUDIO.ambientGain && AUDIO.sfxGain;

/* ---------- shared sources ---------- */
let NOISE = null, BROWN = null;
function noiseBuf(){
  if(NOISE) return NOISE;
  const ctx = AUDIO.ctx, n = ctx.sampleRate*2, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
  for(let i=0;i<n;i++) d[i] = Math.random()*2 - 1;
  return (NOISE = b);
}
function brownBuf(){
  if(BROWN) return BROWN;
  const ctx = AUDIO.ctx, n = ctx.sampleRate*3, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
  let last = 0; for(let i=0;i<n;i++){ last = (last + 0.02*(Math.random()*2 - 1))/1.02; d[i] = last*3.2; }
  return (BROWN = b);
}
function src(buf, loop){ const s = AUDIO.ctx.createBufferSource(); s.buffer = buf; s.loop = !!loop; if(loop) s.loopStart = Math.random()*0.5; return s; }
function filt(type, f, q){ const b = AUDIO.ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; if(q != null) b.Q.value = q; return b; }
function gain(v){ const g = AUDIO.ctx.createGain(); g.gain.value = v; return g; }
function pan(p){ const ctx = AUDIO.ctx; if(ctx.createStereoPanner){ const n = ctx.createStereoPanner(); n.pan.value = Math.max(-1, Math.min(1, p)); return n; } return gain(1); }
function chain(...nodes){ for(let i=0;i<nodes.length - 1;i++) nodes[i].connect(nodes[i + 1]); return nodes[nodes.length - 1]; }

/* ---------- a group of layers that starts and stops together ---------- */
function Group(out){
  const g = { bus:gain(0), nodes:[], timers:[], dead:false };
  g.bus.connect(out);
  const t = AUDIO.ctx.currentTime; g.bus.gain.setValueAtTime(0, t); g.bus.gain.linearRampToValueAtTime(1, t + 1.2);
  g.keep = n => { g.nodes.push(n); return n; };
  g.every = (lo, hi, fn)=>{ const tick = ()=>{ if(g.dead) return; try{ if(live()) fn(); }catch(e){} g.timers.push(setTimeout(tick, rnd(lo, hi)*1000)); }; g.timers.push(setTimeout(tick, rnd(lo*0.3, hi*0.6)*1000)); };
  g.stop = ()=>{ if(g.dead) return; g.dead = true; g.timers.forEach(clearTimeout);
    try{ const t2 = AUDIO.ctx.currentTime; g.bus.gain.cancelScheduledValues(t2); g.bus.gain.setValueAtTime(g.bus.gain.value, t2); g.bus.gain.linearRampToValueAtTime(0, t2 + 0.5); }catch(e){}
    setTimeout(()=>{ g.nodes.forEach(n => { try{ n.stop(); }catch(e){} }); try{ g.bus.disconnect(); }catch(e){} }, 700); };
  return g;
}
/* a looping bed: filtered noise (white or brown) at a level */
function bed(G, kind, type, f, q, level, panV){
  const s = G.keep(src(kind === 'brown' ? brownBuf() : noiseBuf(), true));
  chain(s, filt(type, f, q), gain(level), pan(panV || 0), G.bus); s.start(); return s;
}
/* a slow swell on a bed (wind, waves, passing trucks) */
function swell(G, kind, type, f, q, peak, dur, panFrom, panTo){
  const ctx = AUDIO.ctx, t = ctx.currentTime, s = src(kind === 'brown' ? brownBuf() : noiseBuf(), true), g = gain(0), p = pan(panFrom || 0);
  chain(s, filt(type, f, q), g, p, G.bus);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + dur*0.45); g.gain.linearRampToValueAtTime(0, t + dur);
  if(p.pan && panTo != null){ p.pan.setValueAtTime(panFrom || 0, t); p.pan.linearRampToValueAtTime(panTo, t + dur); }
  s.start(t); s.stop(t + dur + 0.1);
}
function tone(out, type, f, at, dur, peak, opt){
  opt = opt || {};
  const ctx = AUDIO.ctx, o = ctx.createOscillator(), g = gain(0); o.type = type; o.frequency.setValueAtTime(f, at);
  if(opt.to) o.frequency.exponentialRampToValueAtTime(opt.to, at + dur);
  let last = o; if(opt.lp){ const lp = filt('lowpass', opt.lp, 0.7); o.connect(lp); last = lp; } if(opt.bp){ const bp = filt('bandpass', opt.bp, opt.q || 2); last.connect(bp); last = bp; }
  last.connect(g); g.connect(opt.pan != null ? (()=>{ const p = pan(opt.pan); p.connect(out); return p; })() : out);
  g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(peak, at + Math.min(0.03, dur*0.2)); g.gain.exponentialRampToValueAtTime(0.0008, at + dur);
  o.start(at); o.stop(at + dur + 0.05); return o;
}
function burst(out, at, dur, peak, type, f, q, panV){
  const s = src(noiseBuf(), false), g = gain(0); s.loopStart = 0;
  chain(s, filt(type, f, q), g, panV != null ? pan(panV) : gain(1), out);
  g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(peak, at + Math.min(0.006, dur*0.2)); g.gain.exponentialRampToValueAtTime(0.0008, at + dur);
  s.start(at, Math.random()*1.5); s.stop(at + dur + 0.05);
}

/* ---------- little voices of the city ---------- */
function hawker(out, panV, level){
  // a vowel-shaped call: rising then falling, like "Pure water! Pure water!"
  const ctx = AUDIO.ctx, t = ctx.currentTime, base = rnd(180, 290), n = pick([2, 3, 4]);
  for(let i=0;i<n;i++){
    const at = t + i*rnd(0.22, 0.32), dur = rnd(0.18, 0.3), o = ctx.createOscillator(), g = gain(0);
    o.type = 'sawtooth'; o.frequency.setValueAtTime(base*(i === n - 1 ? 0.85 : 1.08), at); o.frequency.linearRampToValueAtTime(base*(i % 2 ? 0.92 : 1.15), at + dur);
    const f1 = filt('bandpass', rnd(650, 900), 6), f2 = filt('bandpass', rnd(1100, 1500), 7), mix = gain(1), p = pan(panV);
    o.connect(f1); o.connect(f2); f1.connect(mix); f2.connect(mix); mix.connect(g); g.connect(p); p.connect(out);
    g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(level, at + 0.03); g.gain.linearRampToValueAtTime(level*0.7, at + dur*0.7); g.gain.linearRampToValueAtTime(0, at + dur);
    o.start(at); o.stop(at + dur + 0.05);
  }
}
function engineBy(out, kind, level){
  // an okada or a car passing: pitch bends down as it goes by, pans across
  const ctx = AUDIO.ctx, t = ctx.currentTime, dur = kind === 'okada' ? rnd(2.2, 3.2) : rnd(2.8, 4.2), from = Math.random() < 0.5 ? -1 : 1;
  const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = gain(0), p = pan(from), lp = filt('lowpass', kind === 'okada' ? 900 : 420, 1);
  const f0 = kind === 'okada' ? rnd(95, 125) : rnd(48, 62);
  o.type = 'sawtooth'; o2.type = 'square'; o.frequency.setValueAtTime(f0*1.12, t); o.frequency.linearRampToValueAtTime(f0*0.86, t + dur);
  o2.frequency.setValueAtTime(f0*0.5*1.12, t); o2.frequency.linearRampToValueAtTime(f0*0.5*0.86, t + dur);
  const g2 = gain(0.4); o.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(g); g.connect(p); p.connect(out);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(level, t + dur*0.5); g.gain.linearRampToValueAtTime(0, t + dur);
  if(p.pan){ p.pan.setValueAtTime(from, t); p.pan.linearRampToValueAtTime(-from, t + dur); }
  o.start(t); o2.start(t); o.stop(t + dur + 0.1); o2.stop(t + dur + 0.1);
}
function horn(out, level, panV){ const t = AUDIO.ctx.currentTime, f = rnd(340, 430); tone(out, 'square', f, t, 0.32, level, { lp:1400, pan:panV }); if(Math.random() < 0.5) tone(out, 'square', f, t + 0.42, 0.26, level, { lp:1400, pan:panV }); }
function crickets(out, level, panV){
  const t = AUDIO.ctx.currentTime, f = rnd(4200, 5200), n = pick([3, 4, 5]);
  for(let k=0;k<2;k++) for(let i=0;i<n;i++) tone(out, 'sine', f, t + k*0.42 + i*0.045, 0.03, level, { pan:panV });
}
function dog(out, level, panV){
  const t = AUDIO.ctx.currentTime, n = pick([1, 2, 3]);
  for(let i=0;i<n;i++){ const at = t + i*rnd(0.28, 0.4); burst(out, at, 0.16, level, 'bandpass', rnd(600, 900), 1.6, panV); tone(out, 'sawtooth', rnd(260, 340), at, 0.14, level*0.5, { lp:900, to:rnd(180, 220), pan:panV }); }
}
function bird(out, level, panV){ const t = AUDIO.ctx.currentTime, f = rnd(2200, 3600); for(let i=0;i<pick([2, 3, 4]);i++) tone(out, 'sine', f*rnd(0.9, 1.1), t + i*0.12, 0.09, level, { to:f*rnd(1.2, 1.5), pan:panV }); }
function frog(out, level, panV){ const t = AUDIO.ctx.currentTime; for(let i=0;i<pick([2, 3]);i++) tone(out, 'square', rnd(110, 140), t + i*0.22, 0.12, level, { lp:420, pan:panV }); }
function ring(out, level){ const t = AUDIO.ctx.currentTime; for(let r=0;r<2;r++){ tone(out, 'sine', 440, t + r*1.1, 0.45, level); tone(out, 'sine', 480, t + r*1.1, 0.45, level); } }
function keys(out, level){ const t = AUDIO.ctx.currentTime, n = Math.floor(rnd(5, 14)), p = rnd(-0.7, 0.7); let at = t; for(let i=0;i<n;i++){ at += rnd(0.07, 0.19); burst(out, at, 0.018, level*rnd(0.6, 1), 'highpass', 2600, 0.7, p); } }
function generator(G, f, level, panV){
  const ctx = AUDIO.ctx, o = G.keep(ctx.createOscillator()), lfo = G.keep(ctx.createOscillator()), g = gain(level), lg = gain(level*0.45);
  o.type = 'sawtooth'; o.frequency.value = f; lfo.frequency.value = rnd(6.5, 9); lfo.connect(lg); lg.connect(g.gain);
  chain(o, filt('lowpass', 190, 0.8), g, pan(panV), G.bus); o.start(); lfo.start();
}

/* ---------- the parlour beat (Ekosodin): highlife-ish, through a wall ---------- */
function beat(G, level){
  const ctx = AUDIO.ctx, out = gain(level), lp = filt('lowpass', 900, 0.7);
  out.connect(lp); lp.connect(G.bus);
  const spb = 60/112, bass = [110, 130.8, 164.8, 146.8];
  let next = ctx.currentTime + 0.1, step = 0;
  const run = ()=>{
    if(G.dead) return;
    while(next < ctx.currentTime + 0.6){
      const b = step % 8;
      if(b === 0 || b === 4) tone(out, 'sine', 70, next, 0.22, 0.5, { to:44 });
      if(b === 2 || b === 6) burst(out, next, 0.09, 0.18, 'bandpass', 1900, 0.9);
      burst(out, next + spb/4, 0.03, 0.08, 'highpass', 7000, 0.7);
      if(b % 2 === 0) tone(out, 'sawtooth', bass[(step >> 1) % 4], next, spb*0.8, 0.12, { lp:260 });
      if(b === 3 || b === 7) tone(out, 'triangle', bass[(step >> 1) % 4]*4, next, 0.16, 0.06);
      next += spb/2; step++;
    }
    G.timers.push(setTimeout(run, 220));
  };
  run(); return out;
}

/* ---------- each case's layers ---------- */
const BED = { m0:'mushin', m1:'office', m3n:'office', h2:'office', h4:'office', h5:'office', h6:'office', h7:'office', m2:'market', m3:'lekki', m4:'bypass', m5:'forest', m6:'river', m7:'tower', m8:'ekosodin' };
let CUR = null;
SND.scene = function(mid){
  SND.sceneStop();
  const kind = BED[mid]; if(!kind || !live()) return;
  const A = AUDIO.ambientGain, G = CUR = Group(A); G.kind = kind;
  if(kind === 'office'){
    bed(G, 'white', 'lowpass', 520, 0.6, 0.035, 0);                                  // the ceiling fan's air
    const fan = G.keep(AUDIO.ctx.createOscillator()), fg = gain(0.012), am = G.keep(AUDIO.ctx.createOscillator()), ag = gain(0.01);
    fan.type = 'triangle'; fan.frequency.value = 58; am.frequency.value = 3.6; am.connect(ag); ag.connect(fg.gain); chain(fan, filt('lowpass', 140, 0.7), fg, G.bus); fan.start(); am.start();
    G.every(3, 9, ()=>keys(G.bus, 0.05));
    G.every(28, 55, ()=>ring(G.bus, 0.012));
    G.every(14, 30, ()=>engineBy(G.bus, Math.random() < 0.6 ? 'okada' : 'car', 0.012));  // the street outside the windows
  }
  if(kind === 'market'){
    generator(G, 52, 0.018, 0.7);
    G.every(2.5, 6, ()=>hawker(G.bus, rnd(-0.9, 0.9), rnd(0.012, 0.03)));
    G.every(5, 11, ()=>engineBy(G.bus, 'okada', rnd(0.02, 0.035)));
    G.every(8, 16, ()=>horn(G.bus, rnd(0.008, 0.016), rnd(-1, 1)));
    G.keep(beat(G, 0.05));
  }
  if(kind === 'mushin'){
    generator(G, 47, 0.016, -0.6);
    G.every(9, 20, ()=>dog(G.bus, 0.02, rnd(-1, 1)));
    G.every(7, 14, ()=>engineBy(G.bus, 'okada', 0.02));
  }
  if(kind === 'lekki'){
    G.every(1.2, 3.2, ()=>crickets(G.bus, rnd(0.006, 0.014), rnd(-1, 1)));
    G.every(7, 12, ()=>swell(G, 'brown', 'lowpass', 380, 0.6, 0.05, rnd(5, 8), rnd(-0.4, 0.4)));       // the sea beyond the wall
    const ac = G.keep(AUDIO.ctx.createOscillator()); ac.type = 'sawtooth'; ac.frequency.value = 98; chain(ac, filt('lowpass', 160, 0.7), gain(0.008), pan(0.5), G.bus); ac.start();
  }
  if(kind === 'bypass'){
    bed(G, 'white', 'bandpass', 700, 0.4, 0.012, 0);
    G.every(6, 13, ()=>swell(G, 'brown', 'lowpass', 160, 0.7, 0.12, rnd(5, 8), rnd(-1, -0.4), rnd(0.4, 1)));   // a tanker on the bypass
    G.every(9, 18, ()=>horn(G.bus, rnd(0.008, 0.015), rnd(-1, 1)));
    G.every(4, 9, ()=>swell(G, 'white', 'bandpass', 1400, 0.5, 0.02, rnd(3, 6), rnd(-1, 1), rnd(-1, 1)));        // wind
  }
  if(kind === 'forest'){
    const ins = G.keep(src(noiseBuf(), true)), ig = gain(0.012), lfo = G.keep(AUDIO.ctx.createOscillator()), lg = gain(0.01);
    lfo.frequency.value = 26; lfo.connect(lg); lg.connect(ig.gain); chain(ins, filt('bandpass', 6200, 3), ig, G.bus); ins.start(); lfo.start();
    G.every(4, 10, ()=>bird(G.bus, rnd(0.006, 0.014), rnd(-1, 1)));
    G.every(5, 12, ()=>swell(G, 'white', 'highpass', 2200, 0.6, 0.016, rnd(3, 6), rnd(-1, 1), rnd(-1, 1)));     // leaves
    G.every(6, 14, ()=>frog(G.bus, 0.012, rnd(-1, 1)));
  }
  if(kind === 'river'){
    G.every(2.5, 5, ()=>swell(G, 'brown', 'lowpass', 520, 0.6, 0.06, rnd(2.5, 4.5), rnd(-0.6, 0.6)));            // water at the jetty
    G.every(30, 60, ()=>{ const t = AUDIO.ctx.currentTime; tone(G.bus, 'sawtooth', 72, t, 3.4, 0.03, { lp:220 }); });  // a boat on the Niger
    generator(G, 44, 0.014, -0.5);
  }
  if(kind === 'tower'){
    G.every(1.4, 3.6, ()=>crickets(G.bus, rnd(0.006, 0.012), rnd(-1, 1)));
    G.every(4, 9, ()=>swell(G, 'white', 'bandpass', 900, 0.5, 0.025, rnd(3, 6), rnd(-1, 1), rnd(-1, 1)));
    G.every(10, 20, ()=>engineBy(G.bus, 'okada', 0.018));
  }
  if(kind === 'ekosodin'){
    generator(G, 49, 0.02, -0.7); generator(G, 57, 0.014, 0.6);
    G.every(1.6, 4, ()=>crickets(G.bus, rnd(0.005, 0.011), rnd(-1, 1)));
    G.every(12, 24, ()=>dog(G.bus, rnd(0.012, 0.022), rnd(-1, 1)));
    G.every(9, 18, ()=>engineBy(G.bus, 'okada', 0.018));
    G.keep(beat(G, 0.03));
  }
};
SND.sceneStop = function(){ if(CUR){ CUR.stop(); CUR = null; } };
V12.wrap('startAmbient', orig => function(kind){
  const r = orig.apply(this, arguments);
  try{ if(kind !== 'title') SND.scene(S.game && S.game.currentMission); }catch(e){}
  return r;
});
V12.wrap('stopAmbient', orig => function(){ try{ SND.sceneStop(); }catch(e){} return orig.apply(this, arguments); });

/* ---------- footsteps on the ground under him ---------- */
const SURF = { m0:'wet', m1:'tile', m3n:'tile', h2:'tile', h4:'tile', h5:'tile', h6:'tile', h7:'tile', m2:'concrete', m3:'tile', m4:'gravel', m5:'mud', m6:'concrete', m7:'gravel', m8:'laterite' };
SND.surface = function(){
  const m = S.game && S.game.currentMission; let k = SURF[m];
  if(m === 'm3' && ENGINE.inside && ENGINE.player && !ENGINE.inside(ENGINE.player.position)) k = 'gravel';
  return k;
};
SND.step = function(kind){
  if(!live()) return false;
  const out = AUDIO.sfxGain, t = AUDIO.ctx.currentTime, v = rnd(0.85, 1.15), p = rnd(-0.08, 0.08);
  const crouch = ENGINE.keys && ENGINE.keys.KeyC ? 0.45 : 1;
  if(kind === 'tile'){ burst(out, t, 0.03, 0.09*v*crouch, 'highpass', 1700*v, 0.8, p); tone(out, 'sine', 125*v, t, 0.05, 0.05*crouch); }
  else if(kind === 'concrete'){ burst(out, t, 0.06, 0.12*v*crouch, 'bandpass', 950*v, 0.8, p); burst(out, t + 0.03, 0.04, 0.04*crouch, 'highpass', 2600, 0.6, p); }
  else if(kind === 'gravel' || kind === 'laterite'){ const f = kind === 'gravel' ? 2500 : 1300; for(let i=0;i<3;i++) burst(out, t + i*rnd(0.012, 0.03), 0.035, rnd(0.05, 0.09)*crouch, 'bandpass', f*rnd(0.8, 1.2), 0.6, p); }
  else if(kind === 'mud'){ const s = src(noiseBuf(), false), g = gain(0), f = filt('bandpass', 420, 2.2); f.frequency.setValueAtTime(420*v, t); f.frequency.exponentialRampToValueAtTime(160, t + 0.13);
    chain(s, f, g, out); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.2*crouch, t + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t + 0.16); s.start(t, Math.random()); s.stop(t + 0.2); }
  else if(kind === 'wet'){ burst(out, t, 0.12, 0.08*v*crouch, 'highpass', 2400, 0.7, p); tone(out, 'sine', 110, t, 0.05, 0.05*crouch); }
  else return false;
  return true;
};
V12.wrap('sfxFootstep', orig => function(){
  try{ const k = SND.surface(); if(k && SND.step(k)) return; }catch(e){}
  return orig.apply(this, arguments);
});

/* ---------- the car (Case 07½) ---------- */
let CAR = null;
SND.carStart = function(){
  SND.carStop(); if(!live()) return;
  const ctx = AUDIO.ctx, G = CAR = Group(AUDIO.ambientGain);
  const eng = G.keep(ctx.createOscillator()), eng2 = G.keep(ctx.createOscillator()), eg = gain(0.05);
  eng.type = 'sawtooth'; eng.frequency.value = 36; eng2.type = 'square'; eng2.frequency.value = 72;
  const e2g = gain(0.3); eng2.connect(e2g); e2g.connect(eg); chain(eng, filt('lowpass', 240, 0.8), eg, G.bus); eng.start(); eng2.start();
  const road = G.keep(src(noiseBuf(), true)), rg = gain(0.004); chain(road, filt('bandpass', 520, 0.6), rg, G.bus); road.start();
  const rum = G.keep(src(brownBuf(), true)), ug = gain(0); chain(rum, filt('lowpass', 140, 0.8), ug, G.bus); rum.start();
  const city = G.keep(src(brownBuf(), true)); chain(city, filt('lowpass', 300, 0.6), gain(0.04), G.bus); city.start();
  const parlour = gain(0); parlour.connect(G.bus); G.keep(beat({ bus:parlour, timers:G.timers, get dead(){ return G.dead; } }, 0.9));
  G.every(6, 13, ()=>horn(G.bus, rnd(0.004, 0.009), rnd(-1, 1)));
  G.every(1.4, 3.2, ()=>{ if(CAR && CAR.crickets) crickets(G.bus, rnd(0.004, 0.009), rnd(-1, 1)); });
  Object.assign(G, { eng, eng2, eg, rg, ug, parlour });
};
SND.carUpdate = function(o){
  const G = CAR; if(!G || !live()) return;
  const t = AUDIO.ctx.currentTime, v = o.speed || 0;
  G.eng.frequency.setTargetAtTime(30 + v*2.6, t, 0.25); G.eng2.frequency.setTargetAtTime(60 + v*5.2, t, 0.25);
  G.eg.gain.setTargetAtTime(0.035 + Math.min(0.05, v*0.003), t, 0.3);
  const lat = o.surface === 'laterite';
  G.rg.gain.setTargetAtTime((lat ? 0.002 : 0.004) + v*(lat ? 0.0012 : 0.0026), t, 0.3);
  G.ug.gain.setTargetAtTime(lat ? 0.02 + v*0.006 : 0, t, 0.4);
  G.parlour.gain.setTargetAtTime(o.parlour < 90 ? Math.pow(1 - o.parlour/90, 1.6)*0.07 : 0, t, 0.4);
  G.crickets = lat || o.speed < 2;
};
SND.carStop = function(){ if(CAR){ CAR.stop(); CAR = null; } };
/* one-shots */
const fx = ()=>live() ? AUDIO.sfxGain : null;
SND.horn = (k)=>{ const o = fx(); if(o) horn(o, 0.045*(k || 1), rnd(-0.4, 0.4)); };
SND.tick = ()=>{ const o = fx(); if(!o) return; const t = AUDIO.ctx.currentTime; tone(o, 'square', 1500, t, 0.012, 0.03); tone(o, 'square', 1100, t + 0.34, 0.012, 0.025); };
SND.shutter = ()=>{ const o = fx(); if(!o) return; const t = AUDIO.ctx.currentTime; burst(o, t, 0.02, 0.12, 'highpass', 3200, 0.7); burst(o, t + 0.07, 0.025, 0.09, 'highpass', 2600, 0.7); };
SND.whistle = ()=>{ const o = fx(); if(!o) return; const t = AUDIO.ctx.currentTime, ctx = AUDIO.ctx;
  for(let i=0;i<3;i++){ const at = t + i*0.42, w = ctx.createOscillator(), vib = ctx.createOscillator(), vg = gain(140), g = gain(0);
    w.type = 'sine'; w.frequency.value = 2900; vib.frequency.value = 34; vib.connect(vg); vg.connect(w.frequency); w.connect(g); g.connect(o);
    g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(0.03, at + 0.02); g.gain.setValueAtTime(0.03, at + (i === 2 ? 0.5 : 0.18)); g.gain.linearRampToValueAtTime(0, at + (i === 2 ? 0.56 : 0.22));
    w.start(at); vib.start(at); w.stop(at + 0.6); vib.stop(at + 0.6); } };
SND.shout = ()=>{ const o = fx(); if(o) hawker(o, 0.5, 0.05); };
SND.phoneBuzz = ()=>{ const o = fx(); if(!o) return; const t = AUDIO.ctx.currentTime; for(let i=0;i<3;i++) tone(o, 'square', 165, t + i*0.3, 0.2, 0.02, { lp:400 }); };
SND.decide = ()=>{ const o = fx(); if(!o) return; const t = AUDIO.ctx.currentTime; tone(o, 'sine', 110, t, 0.9, 0.05); tone(o, 'sine', 164.8, t + 0.02, 0.9, 0.035); };
SND.engineRev = ()=>{ const o = fx(); if(!o) return; const t = AUDIO.ctx.currentTime; tone(o, 'sawtooth', 70, t, 1.1, 0.03, { to:150, lp:500 }); };
SND.skid = ()=>{ const o = fx(); if(!o) return; const t = AUDIO.ctx.currentTime, s = src(noiseBuf(), false), f = filt('bandpass', 1500, 4), g = gain(0);
  f.frequency.setValueAtTime(1500, t); f.frequency.exponentialRampToValueAtTime(700, t + 0.6); chain(s, f, g, o);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.06, t + 0.04); g.gain.exponentialRampToValueAtTime(0.001, t + 0.65); s.start(t, Math.random()); s.stop(t + 0.7); };

})();
