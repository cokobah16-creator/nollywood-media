/* =========================================================================
   NACECA · v12 playtest log — where do players stop?
   Records what a player does (missions started and finished, documents
   submitted, links inked, plans, the accusation, quits) on this device
   only. Nothing leaves the phone unless V12.PT_ENDPOINT is set to a URL
   that accepts JSON (for example a Google Apps Script web app).
   Settings → PLAYTEST exports the log as a file to send to the team.
   ========================================================================= */
(function(){
'use strict';
const V12 = window.V12;
const KEY = 'naceca_pt_v1', CAP = 3000;
V12.PT_ENDPOINT = V12.PT_ENDPOINT || '';
const sid = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
let buf = [], outbox = [];
const read = ()=>{ try{ return JSON.parse(localStorage.getItem(KEY) || '[]') || []; }catch(e){ return []; } };
const write = ()=>{ try{ const all = read().concat(buf); localStorage.setItem(KEY, JSON.stringify(all.slice(-CAP))); buf = []; }catch(e){ buf = []; } };
V12.log = function(type, data){
  const e = { t:Date.now(), sid, type, m:(typeof S !== 'undefined' && S.game) ? S.game.currentMission : null, d:data || {} };
  buf.push(e); if(V12.PT_ENDPOINT) outbox.push(e);
  if(buf.length >= 12) write();
};
for(const [type, data, t] of (V12._q || [])) buf.push({ t, sid, type, m:null, d:data || {} });
V12._q = [];
setInterval(()=>{ if(buf.length) write(); flush(); }, 20000);
function flush(){
  if(!V12.PT_ENDPOINT || !outbox.length) return;
  const body = JSON.stringify({ game:'naceca', build:V12.version, events:outbox.splice(0) });
  try{ if(navigator.sendBeacon) navigator.sendBeacon(V12.PT_ENDPOINT, new Blob([body], { type:'text/plain' })); else fetch(V12.PT_ENDPOINT, { method:'POST', body, keepalive:true, mode:'no-cors' }); }catch(e){}
}
const quit = ()=>{
  try{
    const objs = (S.game && S.game.objectives) || [], next = objs.find(o => !o.done);
    V12.log('quit', { obj: next ? next.id : null, overlay:([...document.querySelectorAll('.overlay.show')][0] || {}).id || null,
      secsOnObj:(V12._ptState && V12._ptState.o) ? Math.round((V12._ptState.play - V12._ptState.o.t0) / 1000) : null, lastEvent:(V12._ptState || {}).lastType || null });
  }catch(e){}
  write(); flush();
};
window.addEventListener('pagehide', quit);
document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState === 'hidden'){ write(); flush(); } });
V12.log('session', { ua:navigator.userAgent.slice(0, 120), w:innerWidth, h:innerHeight, dpr:window.devicePixelRatio || 1, touch:('ontouchstart' in window),
  build:{ ver:V12.version || null, src:(window.NACECA_BUILD || {}).src || null },
  settings:(()=>{ try{ return { marker:SETTINGS.marker, hints:SETTINGS.hints, difficulty:SETTINGS.difficulty, timed:SETTINGS.timed }; }catch(e){ return null; } })() });

V12.ptExport = async ()=>{
  write();
  const json = JSON.stringify({ game:'naceca', build:V12.version, exported:new Date().toISOString(), events:read() }, null, 1);
  const r = await V12.saveFile('naceca-playtest-log.json', json);
  if(r === 'failed' && typeof toast === 'function') toast('EXPORT FAILED', 'Try again from the game\'s own page', 2200);
};
V12.ptSummary = ()=>{
  write();
  const ev = read(), started = {}, ended = {};
  for(const e of ev){ if(e.type === 'mission_start') started[e.d.m] = (started[e.d.m] || 0) + 1; if(e.type === 'mission_end') ended[e.d.m] = (ended[e.d.m] || 0) + 1; }
  const surveys = ev.filter(e => e.type === 'survey' && !(e.d && e.d.skipped)).length;
  return { events:ev.length, sessions:new Set(ev.map(e => e.sid)).size, started, ended, surveys };
};
V12.wrap('renderSettings', orig => function(){
  const r = orig.apply(this, arguments);
  try{
    const body = document.getElementById('settings-body');
    const s = V12.ptSummary();
    const h = V12.el('div', 'set-group', 'PLAYTEST');
    const row = V12.el('div', 'set-row', `<div class="set-label">Playtest log<div class="set-note">${s.events} events across ${s.sessions} session${s.sessions === 1 ? '' : 's'}, stored on this device only. Export it and send it to the team.</div></div>
      <div class="set-ctl"><div class="seg"><button id="pt-export">EXPORT</button><button id="pt-clear">CLEAR</button></div></div>`);
    const qrow = V12.el('div', 'set-row', `<div class="set-label">Two questions<div class="set-note">${s.surveys} answer${s.surveys === 1 ? '' : 's'} saved in the log.</div></div>
      <div class="set-ctl"><div class="seg"><button id="pt-survey">ANSWER</button></div></div>`);
    body.appendChild(h); body.appendChild(row); body.appendChild(qrow);
    row.querySelector('#pt-export').onclick = ()=>V12.ptExport();
    row.querySelector('#pt-clear').onclick = ()=>{ try{ localStorage.removeItem(KEY); }catch(e){} buf = []; renderSettings(); };
    qrow.querySelector('#pt-survey').onclick = ()=>V12.ptSurvey('settings');
  }catch(e){}
  return r;
});

/* =========================================================================
   Playtest signals for an observed slice (default: the market and the mansion)
   Times are PLAY time (summed from the game tick, so menus and documents don't count).
   - interact_result: every ACTION on a target, classified 300 ms later (after any staged animation):
       progress (the game state moved) | opened (a dialogue, document or mini-game) | refused (a toast,
       no progress) | noop — with the toast, the other targets in reach and the distance
   - interact_miss: ACTION with nothing in reach — the nearest target, its distance, why ('range' when
       it was within range + 1.5 m, else 'none')
   - blocked: a refusal toast raised outside an interaction (e.g. a gate)
   - obj_done: per objective — secs, walked, direct, eff, backtracks, arrowPct, towardPct, hints,
       misses, refusals
   - stuck: every 90 s of play with no change in the game's progress signature; away: walking off the
       target for 30 s; hint: the game's own 60 s HINT toast
   - chase_end, wipe_end, mission_end (also for silent completions), choice, enc (V12.enc), quit
   - survey: the two post-slice questions, with context
   Every event also carries dev: 'touch' | 'desk'.
   ========================================================================= */
const dev = ()=>document.body && document.body.classList.contains('touch-active') ? 'touch' : 'desk';
const log0 = V12.log;
V12.log = function(type, data){ const d = Object.assign({ dev:dev() }, data || {}); PT.lastType = type; return log0(type, d); };
const curObj = ()=>{ try{ const o = ((S.game && S.game.objectives) || []).find(x => !x.done); return o ? o.id : null; }catch(e){ return null; } };
const ppos = ()=>{ const p = typeof ENGINE !== 'undefined' && ENGINE.player && ENGINE.player.position; return p ? { x:+p.x || 0, z:+p.z || 0 } : null; };
const target = ()=>{ try{ const t = window.WAY && WAY.resolve && WAY.resolve(); return t && t.pos ? { x:+t.pos.x || 0, z:+t.pos.z || 0, label:t.label || null } : null; }catch(e){ return null; } };
const r1 = n => Math.round(n * 10) / 10;
const sigNow = ()=>{ try{ return typeof progressSig === 'function' ? progressSig() : ''; }catch(e){ return ''; } };
const PT = { play:0, lastProg:0, sig:'', stuckAt:0, samples:[], awayAt:0, prev:null, inInteract:null, lastType:null,
  o:null, totals:{ misses:0, refusals:0, hints:0 }, wipe:null, chaseT0:0 };
V12._ptState = PT;   // for tests
// per-objective accumulators: reset when the current objective changes
const objStart = id => { const me = ppos(), t = target(); PT.o = { id, t0:PT.play, walked:0, direct:(me && t) ? Math.hypot(t.x - me.x, t.z - me.z) : null,
  backtracks:0, n:0, arrow:0, mov:0, toward:0, hints:0, misses:0, refusals:0 }; };
const progress = ()=>{ PT.lastProg = PT.play; PT.stuckAt = 0; PT.samples = []; PT.sig = sigNow(); };
// play time: the guidance tick only runs while the world is live
V12.wrap('updateGuideAndFeel', orig => function(dt){ PT.play += Math.max(0, Math.min(0.25, +dt || 0)) * 1000; return orig.apply(this, arguments); });

const shownOverlays = ()=>[...document.querySelectorAll('.overlay.show')].map(e => e.id).sort().join(',');
V12.wrap('tryInteract', orig => function(){
  let it = null;
  try{ it = typeof nearestInteractable === 'function' ? nearestInteractable() : null; }catch(e){}
  const me = ppos();
  if(!it){
    try{
      let best = null, bd = Infinity;
      if(me) for(const x of (ENGINE.interactables || [])){ const m = x && x.mesh && x.mesh.position; if(!m || x.consumed) continue; const d = Math.hypot((+m.x || 0) - me.x, (+m.z || 0) - me.z); if(d < bd){ bd = d; best = x; } }
      const range = best ? (best.range || 2.5) : null;
      V12.log('interact_miss', { near:best ? String(best.label || '').slice(0, 60) : null, dist:isFinite(bd) ? r1(bd) : null, range,
        why:(best && bd <= range + 1.5) ? 'range' : 'none', obj:curObj(), want:(target() || {}).label || null });
      PT.totals.misses++; if(PT.o) PT.o.misses++;
    }catch(e){}
    return orig.apply(this, arguments);
  }
  const rec = { label:String(it.label || '').slice(0, 60), verb:it.verb || null, toasts:[], sig0:sigNow(), ov0:shownOverlays(), obj:curObj(), want:(target() || {}).label || null };
  try{
    rec.alt = (ENGINE.interactables || []).filter(x => x !== it && !x.consumed && x.mesh && x.mesh.position && me && Math.hypot(x.mesh.position.x - me.x, x.mesh.position.z - me.z) < (x.range || 2.5)).map(x => String(x.label || '').slice(0, 40));
    rec.dist = me ? r1(Math.hypot(it.mesh.position.x - me.x, it.mesh.position.z - me.z)) : null;
  }catch(e){}
  PT.inInteract = rec;
  let r;
  try{ r = orig.apply(this, arguments); } finally { PT.inInteract = null; }
  const classify = (tries)=>{
    if(typeof ENGINE !== 'undefined' && ENGINE.seq && tries < 12){ setTimeout(()=>classify(tries + 1), 250); return; }   // a staged action is still playing
    try{
      const moved = sigNow() !== rec.sig0, ov = shownOverlays(), opened = ov !== rec.ov0 && /screen-(dialogue|puzzle|minigame|doc|ops|plan|phone|news|desk|briefing)/.test(ov);
      const outcome = moved ? 'progress' : opened ? 'opened' : rec.toasts.length ? 'refused' : 'noop';
      if(outcome === 'refused'){ PT.totals.refusals++; if(PT.o) PT.o.refusals++; }
      V12.log('interact_result', { label:rec.label, verb:rec.verb, outcome, toast:rec.toasts[0] || null, alt:rec.alt || [], dist:rec.dist, obj:rec.obj, want:rec.want });
    }catch(e){}
  };
  setTimeout(()=>classify(0), 300);
  return r;
});
const BLOCKED = /NOT YET|FIRST|LOCKED|CAN'T|CANNOT|TOO FAR|NOT NOW|NO WAY|BLOCKED|WAIT|NEED |NO EVIDENCE|PENDING|ALREADY/i;
V12.wrap('toast', orig => function(big, small){
  try{
    const b = String(big || ''), sm = String(small || '').replace(/<[^>]+>/g, '');
    if(PT.inInteract) PT.inInteract.toasts.push({ big:b.slice(0, 40), small:sm.slice(0, 80) });
    else if(b === 'HINT'){ PT.totals.hints++; if(PT.o) PT.o.hints++; const me = ppos(), t = target(); V12.log('hint', { obj:curObj(), what:sm.slice(0, 80), dist:(me && t) ? r1(Math.hypot(t.x - me.x, t.z - me.z)) : null }); }
    else if(BLOCKED.test(b + ' ' + sm)) V12.log('blocked', { big:b.slice(0, 40), small:sm.slice(0, 80), obj:curObj() });
  }catch(e){}
  return orig.apply(this, arguments);
});
V12.wrap('completeObjective', orig => function(id){
  try{
    const o = ((S.game && S.game.objectives) || []).find(x => x.id === id);
    if(o && !o.done){
      const a = PT.o && PT.o.id === id ? PT.o : null;
      V12.log('obj_done', { id, secs:Math.round((PT.play - (a ? a.t0 : PT.lastProg)) / 1000),
        walked:a ? Math.round(a.walked) : null, direct:a && a.direct != null ? Math.round(a.direct) : null,
        eff:a && a.walked > 1 && a.direct != null ? Math.round(Math.min(1, a.direct / a.walked) * 100) / 100 : null,
        backtracks:a ? a.backtracks : null, arrowPct:a && a.n ? Math.round(a.arrow / a.n * 100) : null,
        towardPct:a && a.mov ? Math.round(a.toward / a.mov * 100) : null, hints:a ? a.hints : 0, misses:a ? a.misses : 0, refusals:a ? a.refusals : 0 });
    }
  }catch(e){}
  const r = orig.apply(this, arguments);
  progress();
  return r;
});
V12.wrap('beginMission', orig => function(){ progress(); PT.o = null; return orig.apply(this, arguments); });
V12.wrap('completeMission', orig => function(id, opts){
  try{ if(opts && opts.silent) V12.log('mission_end', { m:id, silent:true }); }catch(e){}
  return orig.apply(this, arguments);
});
V12.wrap('startChase', orig => function(cfg){
  const c = orig.apply(this, arguments);
  try{
    const t0 = PT.play, label = (c && c.label) || (cfg && cfg.label) || null;
    let lastSeenMs = 0, maxGap = 0, iv = null;
    const end = outcome => { if(iv){ clearInterval(iv); iv = null; } V12.log('chase_end', { label, outcome, secs:Math.round((PT.play - t0) / 100) / 10, bumps:(c && c.bumps) || 0, maxGap:r1(maxGap), lastSeenSecs:Math.round(lastSeenMs / 1000) }); };
    iv = setInterval(()=>{ try{
      if(typeof CHASE === 'undefined' || CHASE.active !== c){ if(iv){ clearInterval(iv); iv = null; } return; }
      const me = ppos(), rp = c.runner && c.runner.position; if(me && rp) maxGap = Math.max(maxGap, Math.hypot(rp.x - me.x, rp.z - me.z));
      const ch = window.WAY && WAY.chase && WAY.chase(); if(ch && ch.mode === 'lastseen') lastSeenMs += 500;
    }catch(e){} }, 500);
    if(c){
      const oc = c.onCaught, oe = c.onEscaped;
      c.onCaught = function(){ end('caught'); return typeof oc === 'function' ? oc.apply(this, arguments) : undefined; };
      c.onEscaped = function(){ end('escaped'); return typeof oe === 'function' ? oe.apply(this, arguments) : undefined; };
    }
  }catch(e){}
  return c;
});
V12.enc = function(id, data){ V12.log('enc', Object.assign({ enc:id }, data || {})); };
V12.wrap('renderChoices', orig => function(choices){
  const r = orig.apply(this, arguments);
  try{
    const key = typeof DLG !== 'undefined' ? DLG.scriptKey || null : null;
    const shown = (choices || []).map((c, i) => [c, i]).filter(([c]) => !(c.requires && !S.player.skills.includes(c.requires)));
    [...document.querySelectorAll('#dlg-choices .dialogue-choice')].forEach((btn, j) => {
      const pair = shown[j]; if(!pair) return;
      const [c, i] = pair;
      // capture runs before the game's own handler: a flagged choice that isn't armed yet is the first of two taps
      btn.addEventListener('click', ()=>{ if(c.flag && !btn.dataset.armed) return; V12.log('choice', { k:key, i, tag:c.tag || null, text:String(c.text || '').replace(/<[^>]+>/g, '').slice(0, 60), of:shown.length }); }, true);
    });
  }catch(e){}
  return r;
});
// 1 s sampler: navigation per objective, stuck / away, the wipe
setInterval(()=>{
  try{
    if(typeof S === 'undefined' || !S.game || !S.game.currentMission) return;
    // the mansion wipe ends either way
    const g = S.game;
    if(g._wipeTotal && !PT.wipe) PT.wipe = { m:g.currentMission };
    if(PT.wipe && (g._wipeDone || g._wipeLost) && !PT.wipe.logged){ PT.wipe.logged = true;
      V12.log('wipe_end', { lost:!!g._wipeLost, pct:g._wipeTotal ? Math.round(Math.min(1, (g._wipeT || 0) / g._wipeTotal) * 100) : null, total:g._wipeTotal || null }); }
    if(!g._wipeTotal && PT.wipe) PT.wipe = null;
    if(typeof ENGINE === 'undefined' || !ENGINE.movementEnabled || document.querySelector('.overlay.show')) return;
    const me = ppos(); if(!me) return;
    const id = curObj(); if(!PT.o || PT.o.id !== id) objStart(id);
    const step = PT.prev ? Math.hypot(me.x - PT.prev.x, me.z - PT.prev.z) : 0;
    const t = target(), dist = t ? Math.hypot(t.x - me.x, t.z - me.z) : null;
    const o = PT.o; o.n++; o.walked += step;
    if(window.WAY && WAY._guideState === 'arrow') o.arrow++;
    if(step > 0.4 && t && PT.prev){ o.mov++; const hx = me.x - PT.prev.x, hz = me.z - PT.prev.z, tx = t.x - PT.prev.x, tz = t.z - PT.prev.z;
      const cos = (hx * tx + hz * tz) / (Math.hypot(hx, hz) * Math.hypot(tx, tz) || 1); if(cos > Math.SQRT1_2) o.toward++; }
    PT.prev = me;
    // the game's own definition of progress (objectives, evidence, flags, choices)
    const sg = sigNow(); if(sg !== PT.sig){ PT.sig = sg; PT.lastProg = PT.play; PT.stuckAt = 0; }
    const idle = PT.play - PT.lastProg;
    if(idle >= 90000 && idle - PT.stuckAt >= 90000){ PT.stuckAt = idle;
      V12.log('stuck', { obj:id, secs:Math.round(idle / 1000), dist:dist == null ? null : r1(dist), moved:Math.round(o.walked), guide:(window.WAY && WAY._guideState) || null, arrowPct:o.n ? Math.round(o.arrow / o.n * 100) : null }); }
    if(dist != null){
      const now = PT.play;
      PT.samples.push([now, dist, o.walked]); while(PT.samples.length && now - PT.samples[0][0] > 30000) PT.samples.shift();
      const lo = Math.min(...PT.samples.map(x => x[1])), walked = o.walked - PT.samples[0][2];
      if(dist - lo > 8 && walked > 10 && now - PT.awayAt > 30000){ PT.awayAt = now; o.backtracks++; V12.log('away', { obj:id, from:r1(lo), to:r1(dist) }); }
    }
  }catch(e){}
}, 1000);

/* the two questions, asked once per save at the end of the slice, and any time from Settings */
V12.PT_SLICE_END = V12.PT_SLICE_END || (new URLSearchParams(location.search).get('slice')) || 'm3';
V12.ptSurvey = function(where){
  let ov = document.getElementById('screen-pt-survey');
  if(!ov){
    ov = document.createElement('div'); ov.id = 'screen-pt-survey'; ov.className = 'overlay';
    ov.innerHTML = `<div class="overlay-bg"></div><div class="cw-paper pt-sheet" role="dialog" aria-label="Two questions">
      <div class="cw-head"><div class="cw-agency">PLAYTEST · TWO QUESTIONS</div><div class="cw-title">Before you go on</div>
      <p class="pt-lead">Short answers are fine. They stay on this device in the playtest log until you export it.</p></div>
      <label class="pt-q" for="pt-a1">What was your most satisfying decision?</label><textarea id="pt-a1" rows="3" maxlength="600"></textarea>
      <label class="pt-q" for="pt-a2">What happened that felt unfair?</label><textarea id="pt-a2" rows="3" maxlength="600"></textarea>
      <div class="pt-acts"><button class="cw-btn" id="pt-skip">SKIP</button><button class="cw-btn primary" id="pt-save">SAVE ANSWERS</button></div></div>`;
    (document.getElementById('game-root') || document.body).appendChild(ov);
  }
  const prev = [...document.querySelectorAll('.overlay.show')].map(e => e.id).filter(id => id !== 'screen-pt-survey');
  const close = ()=>{ ov.classList.remove('show'); if(prev.length && typeof showOverlay === 'function') showOverlay(prev[prev.length - 1]); };
  ov.querySelector('#pt-a1').value = ''; ov.querySelector('#pt-a2').value = '';
  ov.querySelector('#pt-skip').onclick = ()=>{ V12.log('survey', { where, skipped:true }); write(); close(); };
  ov.querySelector('#pt-save').onclick = ()=>{
    const a1 = ov.querySelector('#pt-a1').value.trim(), a2 = ov.querySelector('#pt-a2').value.trim();
    V12.log('survey', { where, satisfying:a1, unfair:a2, diff:(typeof gameDifficulty === 'function' ? gameDifficulty() : null),
      secsPlayed:Math.round(PT.play / 1000), missions:((S.game && S.game.completedMissions) || []).slice(), misses:PT.totals.misses, refusals:PT.totals.refusals, hints:PT.totals.hints, build:(window.NACECA_BUILD || {}).src || null });
    write(); if(typeof toast === 'function') toast('THANK YOU', 'Saved in the playtest log', 1600); close();
  };
  ov.classList.add('show');
  try{ const t = document.getElementById('toast'); if(t) t.classList.remove('show'); }catch(e){}   // a save toast would sit on the first answer
  setTimeout(()=>{ try{ ov.querySelector('#pt-a1').focus(); }catch(e){} }, 60);
};
// while the questions are open, typing is typing (no game keys); Esc skips
document.addEventListener('keydown', e => {
  const ov = document.getElementById('screen-pt-survey');
  if(!ov || !ov.classList.contains('show')) return;
  if(e.key === 'Escape'){ e.preventDefault(); e.stopImmediatePropagation(); ov.querySelector('#pt-skip').click(); return; }
  e.stopImmediatePropagation();
}, true);
V12.wrap('showAftermath', orig => function(){
  const r = orig.apply(this, arguments);
  try{
    const m = S.game.currentMission;
    S.game._ptAsked = S.game._ptAsked || {};
    if(m === V12.PT_SLICE_END && !S.game._ptAsked[m]){ S.game._ptAsked[m] = Date.now(); setTimeout(()=>V12.ptSurvey('slice:' + m), 1800); }
  }catch(e){}
  return r;
});

})();
