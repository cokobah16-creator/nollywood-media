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
  return { events:ev.length, sessions:new Set(ev.map(e => e.sid)).size, started, ended };
};
V12.wrap('renderSettings', orig => function(){
  const r = orig.apply(this, arguments);
  try{
    const body = document.getElementById('settings-body');
    const s = V12.ptSummary();
    const h = V12.el('div', 'set-group', 'PLAYTEST');
    const row = V12.el('div', 'set-row', `<div class="set-label">Playtest log<div class="set-note">${s.events} events across ${s.sessions} session${s.sessions === 1 ? '' : 's'}, stored on this device only. Export it and send it to the team.</div></div>
      <div class="set-ctl"><div class="seg"><button id="pt-export">EXPORT</button><button id="pt-clear">CLEAR</button></div></div>`);
    body.appendChild(h); body.appendChild(row);
    row.querySelector('#pt-export').onclick = ()=>V12.ptExport();
    row.querySelector('#pt-clear').onclick = ()=>{ try{ localStorage.removeItem(KEY); }catch(e){} buf = []; renderSettings(); };
  }catch(e){}
  return r;
});

})();
