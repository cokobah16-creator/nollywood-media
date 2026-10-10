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
    V12.log('quit', { obj: next ? next.id : null, overlay:([...document.querySelectorAll('.overlay.show')][0] || {}).id || null });
  }catch(e){}
  write(); flush();
};
window.addEventListener('pagehide', quit);
document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState === 'hidden'){ write(); flush(); } });
V12.log('session', { ua:navigator.userAgent.slice(0, 120), w:innerWidth, h:innerHeight, touch:('ontouchstart' in window) });

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
   - interact / interact_miss: what the player tried to use, and taps that hit nothing
   - blocked: a "not yet / first / locked" toast — an action the game refused
   - obj_done: each objective with the seconds it took
   - stuck: no objective progress for 90 s (repeats every 90 s), with distance to the target
   - away: walking away from the current target for 30 s
   - choice: every committed dialogue choice (script, index, approach tag)
   - survey: the two post-slice questions
   Every event also carries dev: 'touch' | 'desk'.
   ========================================================================= */
const dev = ()=>document.body && document.body.classList.contains('touch-active') ? 'touch' : 'desk';
const log0 = V12.log;
V12.log = function(type, data){ const d = Object.assign({ dev:dev() }, data || {}); return log0(type, d); };
const curObj = ()=>{ try{ const o = ((S.game && S.game.objectives) || []).find(x => !x.done); return o ? o.id : null; }catch(e){ return null; } };
const P = { last:Date.now(), stuckAt:0, samples:[], awayAt:0, prev:null, moved:0 };
const progress = ()=>{ P.last = Date.now(); P.stuckAt = 0; P.samples = []; P.moved = 0; };
V12._ptState = P;   // for tests
const ppos = ()=>{ const p = typeof ENGINE !== 'undefined' && ENGINE.player && ENGINE.player.position; return p ? { x:+p.x || 0, z:+p.z || 0 } : null; };
const r1 = n => Math.round(n * 10) / 10;

V12.wrap('tryInteract', orig => function(){
  try{
    const it = typeof nearestInteractable === 'function' ? nearestInteractable() : null;
    if(it) V12.log('interact', { label:String(it.label || '').slice(0, 60), verb:it.verb || null, obj:curObj() });
    else {
      // the closest thing they might have meant
      const me = ppos(); let best = null, bd = Infinity;
      if(me) for(const x of (ENGINE.interactables || [])){ const m = x && x.mesh && x.mesh.position; if(!m) continue; const d = Math.hypot((+m.x || 0) - me.x, (+m.z || 0) - me.z); if(d < bd){ bd = d; best = x; } }
      V12.log('interact_miss', { near:best ? String(best.label || '').slice(0, 60) : null, dist:isFinite(bd) ? r1(bd) : null, range:best ? (best.range || null) : null, obj:curObj() });
    }
  }catch(e){}
  return orig.apply(this, arguments);
});
const BLOCKED = /NOT YET|FIRST|LOCKED|CAN'T|CANNOT|TOO FAR|NOT NOW|NO WAY|BLOCKED|WAIT/i;
V12.wrap('toast', orig => function(big, small){
  try{ if(BLOCKED.test(String(big || ''))) V12.log('blocked', { big:String(big).slice(0, 40), small:String(small || '').replace(/<[^>]+>/g, '').slice(0, 80), obj:curObj() }); }catch(e){}
  return orig.apply(this, arguments);
});
V12.wrap('completeObjective', orig => function(id){
  try{ const o = ((S.game && S.game.objectives) || []).find(x => x.id === id); if(o && !o.done) V12.log('obj_done', { id, secs:Math.round((Date.now() - P.last) / 1000) }); }catch(e){}
  const r = orig.apply(this, arguments);
  progress();
  return r;
});
V12.wrap('beginMission', orig => function(){ progress(); return orig.apply(this, arguments); });
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
setInterval(()=>{
  try{
    if(typeof S === 'undefined' || !S.game || !S.game.currentMission || typeof ENGINE === 'undefined' || !ENGINE.movementEnabled) return;
    if(document.querySelector('.overlay.show')){ P.last += 5000; return; }   // reading a document is not being lost
    const me = ppos(); if(!me) return;
    if(P.prev) P.moved += Math.hypot(me.x - P.prev.x, me.z - P.prev.z);
    P.prev = me;
    const now = Date.now(), idle = now - P.last;
    let dist = null;
    try{ const t = window.WAY && WAY.resolve && WAY.resolve(); if(t && t.pos) dist = Math.hypot((+t.pos.x || 0) - me.x, (+t.pos.z || 0) - me.z); }catch(e){}
    if(idle >= 90000 && idle - P.stuckAt >= 90000){ P.stuckAt = idle; V12.log('stuck', { obj:curObj(), secs:Math.round(idle / 1000), dist:dist == null ? null : r1(dist), moved:Math.round(P.moved) }); }
    if(dist != null){
      P.samples.push([now, dist, P.moved]); while(P.samples.length && now - P.samples[0][0] > 30000) P.samples.shift();
      const lo = Math.min(...P.samples.map(s => s[1])), walked = P.moved - P.samples[0][2];
      if(dist - lo > 8 && walked > 10 && now - P.awayAt > 30000){ P.awayAt = now; V12.log('away', { obj:curObj(), from:r1(lo), to:r1(dist) }); }
    }
  }catch(e){}
}, 5000);

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
    V12.log('survey', { where, satisfying:a1, unfair:a2, diff:(typeof gameDifficulty === 'function' ? gameDifficulty() : null) });
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
