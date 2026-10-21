/* =========================================================================
   NACECA · v13 streaming
   The page is code. People, vehicles, scenes, music and faces arrive in
   packs when a scene needs them, so the title screen is up in seconds on a
   phone and Season 2 fits. In the offline build the manifest is null and
   everything here stands aside.
   ========================================================================= */
(function(){
'use strict';
const V13 = window.V13 = window.V13 || {};
V13.version = 'v13';
V13.wrap = (name, make)=>{
  const orig = window[name];
  if(typeof orig !== 'function'){ console.warn('[v13] cannot wrap', name); return false; }
  const f = make(orig); f._v13orig = orig; window[name] = f; return true;
};

const MAN = window.NACECA_MANIFEST;
const P = V13.packs = { streaming: !!(MAN && MAN.packs), loaded:{}, prom:{}, got:{}, fails:{} };
P.has = n => !!(P.streaming && MAN.packs[n]);
P.ready = n => !P.has(n) || !!P.loaded[n];
P.size = n => P.has(n) ? MAN.packs[n].b : 0;

function merge(name, data){
  if(name === 'portraits') Object.assign(PORTRAIT_ART, data);
  else if(name === 'portraits_old') ASSETS.portraits = Object.assign(ASSETS.portraits || {}, data);
  else if(name.indexOf('music_') === 0) Object.assign(MUSIC_INLINE, data);
  else Object.assign(ART_INLINE, data);
}
window.NACECA_PACK = function(name, data){ merge(name, data); P.loaded[name] = true; };

function viaScript(name){
  return new Promise((res, rej)=>{
    const s = document.createElement('script'); s.src = MAN.packs[name].f; s.async = true;
    s.onload = ()=>{ s.remove(); P.loaded[name] ? res(true) : rej(new Error('pack ' + name + ' did not register')); };
    s.onerror = ()=>{ s.remove(); rej(new Error('pack ' + name + ' failed')); };
    document.head.appendChild(s);
  });
}
async function viaFetch(name){
  const f = MAN.packs[name].f, total = MAN.packs[name].b;
  const r = await fetch(f, { cache:'force-cache' });
  if(!r.ok) throw new Error('HTTP ' + r.status);
  let text;
  if(r.body && r.body.getReader && typeof TextDecoder !== 'undefined'){
    const rd = r.body.getReader(), parts = []; let got = 0;
    for(;;){ const { done, value } = await rd.read(); if(done) break; parts.push(value); got += value.length; P.got[name] = Math.min(got, total); }
    const all = new Uint8Array(got); let o = 0; for(const p of parts){ all.set(p, o); o += p.length; }
    text = new TextDecoder().decode(all);
  } else text = await r.text();
  P.got[name] = total;
  // NACECA_PACK("name",{...}); — parse the data as JSON, no script evaluation needed
  const a = text.indexOf(','), b = text.lastIndexOf(');');
  if(text.indexOf('NACECA_PACK(') !== 0 || a < 0 || b < a) throw new Error('pack ' + name + ' malformed');
  window.NACECA_PACK(name, JSON.parse(text.slice(a + 1, b)));
  return true;
}
P.need = function(name){
  if(!P.has(name) || P.loaded[name]) return Promise.resolve(true);
  if(P.prom[name]) return P.prom[name];
  P.got[name] = 0;
  const attempt = n => viaFetch(name).catch(e => {
    if(P.loaded[name]) return true;
    if(location.protocol === 'file:' || n >= 2) return viaScript(name);
    return new Promise(r => setTimeout(r, 900 * (n + 1))).then(()=>attempt(n + 1));
  });
  P.prom[name] = attempt(0).catch(e => { delete P.prom[name]; P.fails[name] = (P.fails[name] || 0) + 1; console.warn('[v13] pack', name, e); throw e; });
  return P.prom[name];
};
P.needAll = names => Promise.all(names.filter(P.has).map(P.need));
P.progress = names => {
  const L = names.filter(P.has); if(!L.length) return 1;
  let got = 0, tot = 0; for(const n of L){ const b = P.size(n); tot += b; got += P.loaded[n] ? b : Math.min(b, P.got[n] || 0); }
  return tot ? got / tot : 1;
};

/* ---------- a loading card for the moments a player has to wait ---------- */
V13.loading = function(title, names){
  names = names.filter(n => P.has(n) && !P.loaded[n]);
  if(!names.length) return Promise.resolve(true);
  let el = document.getElementById('v13-loading');
  if(!el){
    el = document.createElement('div'); el.id = 'v13-loading';
    el.innerHTML = '<div class="v13-ld-card"><div class="v13-ld-k">PREPARING THE OPERATION</div><div class="v13-ld-t"></div><div class="v13-ld-bar"><i></i></div><div class="v13-ld-n"></div><button class="btn v13-ld-retry" hidden>TRY AGAIN</button></div>';
    document.getElementById('game-root').appendChild(el);
  }
  el.querySelector('.v13-ld-t').textContent = title || '';
  const bar = el.querySelector('.v13-ld-bar i'), note = el.querySelector('.v13-ld-n'), retry = el.querySelector('.v13-ld-retry');
  const mb = names.reduce((s, n)=>s + P.size(n), 0) / 1e6;
  el.classList.add('show'); retry.hidden = true;
  let iv = setInterval(()=>{ const p = P.progress(names); bar.style.width = (p * 100).toFixed(1) + '%'; note.textContent = `${(p * mb).toFixed(1)} of ${mb.toFixed(1)} MB`; }, 120);
  return new Promise(res => {
    const go = ()=>{
      retry.hidden = true;
      P.needAll(names).then(()=>{ clearInterval(iv); bar.style.width = '100%'; setTimeout(()=>{ el.classList.remove('show'); res(true); }, 180); })
        .catch(()=>{ note.textContent = 'The connection dropped. Check your signal and try again.'; retry.hidden = false; });
    };
    retry.onclick = ()=>{ go(); };
    go();
  });
};

if(!P.streaming) return;

/* ---------- the shared art: people and vehicles first, the Lekki mansion when Case 03 needs it ---------- */
V13.wrap('startArtLoad', orig => function(){
  if(ART.promise) return ART.promise;
  ART.promise = P.need('core').then(()=>PEOPLE.load()).then(()=>{ ART.ready = true; return true; })
    .catch(e => { console.warn('[NACECA] art pass assets failed, using legacy rigs', e); ART.failed = true; return false; });
  return ART.promise;
});
const mLoad = MANSION.load;
MANSION.load = function(src){
  if(MANSION._p || P.loaded.mansion || !P.has('mansion')) return mLoad.call(MANSION, src);
  return P.need('mansion').then(()=>mLoad.call(MANSION, src));
};
const eHas = ENVART.has, eLoad = ENVART.load;
ENVART.has = key => eHas(key) || P.has('env_' + key);
ENVART.load = function(key){
  if(P.has('env_' + key) && !P.loaded['env_' + key]) return P.need('env_' + key).then(()=>eLoad.call(ENVART, key)).catch(()=>null);
  return eLoad.call(ENVART, key);
};

/* ---------- music arrives when it is first asked for ---------- */
V13.wrap('playMusic', orig => function(name, opts){
  V13._wantMusic = name;
  const k = 'music_' + name;
  if(P.has(k) && !P.loaded[k]){
    const self = this, args = arguments;
    P.need(k).then(()=>{ if(V13._wantMusic === name) orig.apply(self, args); }).catch(()=>{});
    return;
  }
  return orig.apply(this, arguments);
});
V13.wrap('stopMusic', orig => function(){ V13._wantMusic = null; return orig.apply(this, arguments); });

/* ---------- what each operation needs before it can start ---------- */
V13.envFor = id => {
  if(id === 'm3') return 'mansion';
  const e = (typeof ENV_FOR !== 'undefined' && ENV_FOR[id]) || (V13.ENV && V13.ENV[id]);
  return e ? 'env_' + e : null;
};
V13.needsFor = id => ['core', 'portraits', V13.envFor(id)].filter(Boolean);
V13.wrap('beginMission', orig => function(id){
  const need = V13.needsFor(id).filter(n => P.has(n) && !P.loaded[n]);
  if(need.length){
    if(V13._pendingBegin === id) return;
    V13._pendingBegin = id;
    const m = (typeof MISSIONS !== 'undefined' && MISSIONS.find(x => x.id === id)) || {};
    V13.loading(m.name || '', need).then(()=>{
      V13._pendingBegin = null;
      if(id === 'm3' && typeof MANSION !== 'undefined') return MANSION.load().then(()=>window.beginMission(id));
      window.beginMission(id);
    });
    return;
  }
  if(id === 'm3' && typeof MANSION !== 'undefined' && !MANSION.ready){
    MANSION.load().then(()=>window.beginMission(id)); return;
  }
  const r = orig.apply(this, arguments);
  V13.prefetchAfter(id);
  return r;
});

/* ---------- quiet prefetch: the next scene loads while this one plays ---------- */
const queue = []; let busy = false;
V13.prefetch = function(names){
  for(const n of names) if(P.has(n) && !P.loaded[n] && !queue.includes(n)) queue.push(n);
  pump();
};
function pump(){
  if(busy || !queue.length) return;
  const n = queue.shift();
  if(P.loaded[n]){ pump(); return; }
  busy = true;
  P.need(n).catch(()=>{}).then(()=>{ busy = false; setTimeout(pump, 250); });
}
V13.MUSIC_FOR = { m0:'stealth', m1:'ambient_lagos', m2:'ambient_lagos', m3:'stealth', m3n:'investigation', m4:'stealth', m5:'investigation',
                  m6:'stealth', m7:'stealth', t7:'stealth', m8:'investigation' };
V13.nextOf = id => {
  if(typeof MISSIONS === 'undefined') return null;
  const L = MISSIONS.filter(m => m.playable !== false), i = L.findIndex(m => m.id === id);
  return i >= 0 && L[i + 1] ? L[i + 1].id : null;
};
V13.prefetchAfter = function(id){
  const nx = V13.nextOf(id); if(!nx) return;
  setTimeout(()=>{
    const L = [V13.envFor(nx)];
    const mu = V13.MUSIC_FOR[nx]; if(mu) L.push('music_' + mu);
    L.push('music_victory');
    V13.prefetch(L.filter(Boolean));
  }, 15000);
};

/* the title screen: people, faces and the title theme come down while the player reads it */
window.addEventListener('load', ()=>{
  let first = 'm0';
  try{ if(typeof hasSave === 'function' && hasSave()){ const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if(s && s.game && s.game.currentMission) first = s.game.currentMission; } }catch(e){}
  V13.prefetch(['core', 'portraits', 'music_title', V13.envFor(first), 'music_' + (V13.MUSIC_FOR[first] || 'stealth'), 'portraits_old'].filter(Boolean));
});
})();
