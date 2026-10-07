/* =========================================================================
   NACECA · systems/onboarding.js
   Teaching without a tutorial room.
     · showHint(id, desktop, touch)  — a small chip at the bottom of the screen,
                                       worded for whichever controls you're using,
                                       shown once per save
     · radioLine(speaker, text, ms)  — non-blocking radio chatter while you move
     · titleCard(lines, ms, then)    — black card between beats ("THE NEXT MORNING")
   ========================================================================= */

function _isTouch(){ return document.body.classList.contains('touch-active') || ('ontouchstart' in window && (navigator.maxTouchPoints||0) > 0); }

function showHint(id, desktop, touch, ms=5200){
  S.game._hints = S.game._hints || {};
  if(id && S.game._hints[id]) return;
  if(id) S.game._hints[id] = true;
  let el = document.getElementById('hint-chip');
  if(!el){ el = document.createElement('div'); el.id = 'hint-chip'; (document.getElementById('hud') || document.body).appendChild(el); }
  el.innerHTML = `<span class="hc-dot"></span><span class="hc-text">${_isTouch() ? (touch || desktop) : desktop}</span>`;
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  clearTimeout(el._t); el._t = setTimeout(()=>el.classList.remove('show'), ms);
}
function clearHint(){ const el = document.getElementById('hint-chip'); if(el) el.classList.remove('show'); }

/* radio chatter: a subtitle strip with the speaker's painted face, never pauses play */
const RADIO = { queue:[], busy:false };
function radioLine(speaker, text, ms){
  RADIO.queue.push({speaker, text, ms: ms || Math.max(2600, text.length * 55)});
  if(!RADIO.busy) _radioNext();
}
function _radioNext(){
  const item = RADIO.queue.shift();
  let el = document.getElementById('radio-sub');
  if(!item){ RADIO.busy = false; if(el) el.classList.remove('show'); return; }
  RADIO.busy = true;
  if(!el){ el = document.createElement('div'); el.id = 'radio-sub'; (document.getElementById('hud') || document.body).appendChild(el); }
  const face = (typeof paintedPortrait === 'function') ? paintedPortrait(item.speaker, item.mood) : null;
  el.innerHTML = `${face ? `<img src="${face}" alt="">` : ''}<div><div class="rs-who">${item.speaker} <span class="rs-tag">· RADIO</span></div><div class="rs-text">${item.text}</div></div>`;
  el.classList.add('show');
  if(typeof sfxClick === 'function') sfxClick();
  setTimeout(()=>{ el.classList.remove('show'); setTimeout(_radioNext, 260); }, item.ms);
}
function clearRadio(){ RADIO.queue.length = 0; RADIO.busy = false; const el = document.getElementById('radio-sub'); if(el) el.classList.remove('show'); }

function titleCard(lines, ms, then){
  let el = document.getElementById('title-card');
  if(!el){ el = document.createElement('div'); el.id = 'title-card'; document.getElementById('game-root').appendChild(el); }
  el.innerHTML = lines.map((l,i)=>`<div class="tc-line ${i===0?'tc-big':''}" style="animation-delay:${0.25+i*0.55}s">${l}</div>`).join('');
  el.classList.add('show');
  setTimeout(()=>{ el.classList.remove('show'); if(then) setTimeout(then, 500); }, ms);
}

/* ---------- the suspicion eye + following-distance chip ----------
   Small, top-centre: an eye that fills as the target grows suspicious,
   and a distance readout that says too close / good / too far. */
function setEye(frac, mode){
  let el = document.getElementById('eye-ind');
  if(!el){
    el = document.createElement('div'); el.id = 'eye-ind';
    el.innerHTML = `<svg viewBox="0 0 64 36"><defs><clipPath id="eyeclip"><path d="M2 18 Q32 -6 62 18 Q32 42 2 18Z"/></clipPath></defs>
      <path d="M2 18 Q32 -6 62 18 Q32 42 2 18Z" fill="rgba(8,14,26,.85)" stroke="#d8a64a" stroke-width="2.4"/>
      <rect id="eye-fill" x="0" y="36" width="64" height="36" fill="#e84a5c" clip-path="url(#eyeclip)"/>
      <circle cx="32" cy="18" r="7.5" fill="none" stroke="#f0e6cc" stroke-width="2.4"/><circle id="eye-pupil" cx="32" cy="18" r="3.4" fill="#f0e6cc"/></svg>
      <div class="eye-dist" id="eye-dist"></div>`;
    (document.getElementById('hud') || document.body).appendChild(el);
  }
  if(frac == null){ el.classList.remove('show'); return; }
  el.classList.add('show');
  const f = Math.max(0, Math.min(1, frac));
  el.querySelector('#eye-fill').setAttribute('y', String(36 - f*36));
  el.classList.toggle('watching', mode === 'look');
  el.classList.toggle('hot', f > 0.6);
}
function setFollow(dist, band){
  const d = document.getElementById('eye-dist'); if(!d) return;
  if(dist == null){ d.textContent = ''; return; }
  d.dataset.band = band; d.textContent = `${Math.round(dist)} m · ${band === 'close' ? 'TOO CLOSE' : band === 'far' ? 'TOO FAR' : 'GOOD'}`;
}
