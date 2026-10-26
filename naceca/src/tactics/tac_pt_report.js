/* =========================================================================
   NACECA · src/tactics/tac_pt_report.js — the playtest analyser and the
   facilitator's summary sheet (Team D)

   The pure half (no DOM, no network) answers the product owner's four
   questions from a playtest log:
     Where did they get lost?  Which interactions failed?
     Did they understand why they were seen?  Did they use more than one approach?
   It loads in the page (V12.ptReport) and in node through vm (PT_REPORT on
   the sandbox), so the phone's sheet and tools/pt_report.cjs always agree.
   Every DOM part is guarded by typeof document.

   Rules: telemetry.md §3.4 / §5.1 with the binding changes of
   DESIGN-tactics.md §2.4 (dedupe, device + label players, difficulty from
   new_game, investigation rows, noop is not a failure, NO READ DATA,
   READ_MS by words, chosen vs result, families only from player-made,
   non-default choices). The thresholds sit in one place (R.*) to recalibrate
   after the first session.
   ========================================================================= */
(function(root){
'use strict';
const R = {};
R.version = 2;
const r1 = n => Math.round(n * 10) / 10;
const mmss = s => { s = Math.max(0, Math.round(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const short = (s, n) => { s = String(s == null ? '' : s).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
const up = m => String(m || '?').toUpperCase();
const words = s => { s = String(s || '').trim(); return s ? s.split(/\s+/).length : 0; };
const dOf = e => (e && e.d) || {};
R.mmss = mmss;

/* ---------- tables (recalibrate here) ---------- */
R.Q = ['Where did they get lost?', 'Which interactions failed?', 'Did they understand why they were seen?', 'Did they use more than one approach?'];
R.STAMP = { ask:'ASK THEM', likely:'LIKELY UNDERSTOOD', none:'NO READ DATA' };
R.JUDGED = /^(sight|noise|close|scan|fumble|tunde)$/;               // seen causes the player's own movement produced
R.READ_MIN = 1500; R.READ_PER_WORD = 240;                           // 250 wpm, never under 1.5 s
R.readMs = n => Math.max(R.READ_MIN, (n || 0) * R.READ_PER_WORD);
R.DETECT_WORDS = /\b(saw|seen|see me|sees me|spott\w*|notic\w*|detect\w*|caught me|through (a |the )?walls?|stealth|crouch\w*|hid(e|ing|den)?|cover)\b/i;
R.LOST = { stuck:3, hint:2, away:1, ineff:2, quit:3, taps:1, lostAt:3, slowAt:1, slowSecs:180 };
R.INVEST = { strike:1, docFailed:1, refused:2, pending:1, openPer:300, lostAt:3, slowAt:1 };
R.ACTS = /^(veer|tackle|box|callout|cover_held|escort)$/;            // Uche doing something (arrive is not an act)
R.ORDER_SRC = /^(talk|button|key|card)$/;                           // an order the player gave
R.NAMES = { kc:'KC', obi:'Obi', m2_kc:'KC', m2_tunde:'Tunde', m3_entry:'Entry', m3_obi:'Obi', m3_laptop:'Laptop', m3_child:'The child', uche:'Uche' };
// the investigation screens only: time on a briefing, the phone, a mini-game or the capabilities page is not "lost"
R.SCREENS = { 'screen-ops':'operations table', 'screen-desk':'case desk', 'screen-puzzle':'document', 'screen-warrant':'warrant', 'screen-warrant-t':'warrant',
  'warrant':'warrant request' };
const nameOf = k => R.NAMES[k] || k || '?';
const screenOf = id => R.SCREENS[id] || String(id || '?').replace(/^screen-/, '');

/* ---------- input: files, devices, dedupe, players ---------- */
const isEv = e => e && typeof e === 'object' && typeof e.type === 'string' && typeof e.t === 'number' && isFinite(e.t);
// a parser's message, cut short without leaving its own "(line 1 column 62)" half open
const clipWhy = (m, n) => { m = String(m).replace(/\s+/g, ' ').trim(); if(m.length <= n) return m; m = m.slice(0, n - 1);
  const o = m.lastIndexOf('('); if(o > m.lastIndexOf(')')) m = m.slice(0, o).trim(); return m + '…'; };
const isDevId = s => typeof s === 'string' && /^[A-Z0-9]{4}$/.test(s);
// parse one export: {events} (desktop .json), the same JSON in a .txt (the phone's share sheet), or a bare array.
// → { ok, reason, events, dev, file }
R.parse = function(input, file){
  let j = input;
  if(typeof j === 'string'){
    const s = j.replace(/^﻿/, '').trim();
    if(!s) return { ok:false, reason:'empty file', events:[], file };
    try{ j = JSON.parse(s); }catch(e){ return { ok:false, reason:'not JSON (' + clipWhy(e.message || e, 70) + ')', events:[], file }; }
  }
  const list = Array.isArray(j) ? j : (j && Array.isArray(j.events) ? j.events : null);
  if(!list) return { ok:false, reason:'no events array', events:[], file };
  const evs = list.filter(isEv);
  if(!evs.length) return { ok:false, reason:list.length ? 'no valid events' : 'no events', events:[], file };
  // the device's zone: the export's local ISO time carries its offset (+01:00 → getTimezoneOffset -60)
  const m = j && typeof j.exported === 'string' && j.exported.match(/([+-])(\d\d):(\d\d)$/);
  const tz = m ? -(m[1] === '-' ? -1 : 1) * (+m[2] * 60 + +m[3]) : null;
  // the build the export came from (its header): per-player exports have no session event after CLEAR
  const hb = j && !Array.isArray(j) ? (typeof j.src === 'string' && j.src ? j.src : null) : null;
  return { ok:true, reason:null, events:evs, dev:(j && !Array.isArray(j) && isDevId(j.dev)) ? j.dev : null, file:file || null, ptv:(j && j.ptv) || 1, tz, build:hb };
};
let SRC_N = 0;   // one id per normalize() call: each export (file) is its own source for R.dedupe
// attach each event's device: the export's header dev, else a pt_player marker in the same session, else the file
R.normalize = function(input, file, devHint){
  const p = (input && input.ok !== undefined && Array.isArray(input.events)) ? input : R.parse(input, file);
  if(!p.ok) return [];
  const bySid = {};
  for(const e of p.events) if(e.type === 'pt_player' && isDevId(dOf(e).dev)) bySid[e.sid] = dOf(e).dev;
  const any = Object.values(bySid)[0] || null;
  const fallback = devHint || p.dev || any || (p.file ? 'file:' + String(p.file).replace(/^.*[\\/]/, '') : 'device');
  const src = ++SRC_N;
  return p.events.map(e => Object.assign({ d:{} }, e, { _dev:p.dev || devHint || bySid[e.sid] || fallback, _file:p.file || null, _tz:p.tz == null ? null : p.tz,
    _src:src, _bsrc:p.build || null })).sort((a, b) => a.t - b.t);
};
// the same event exported twice (two exports of one device) counts once. V12.log stamps t with Date.now(), so events
// logged in one JS turn share (sid, t, type): the key is the whole event (sid, t, type, m, d), and copies are counted
// per export, keeping the most any one export holds. Two different events in one millisecond both stay; two exports
// of one event (byte-identical) count once; nothing within a single export is ever dropped.
R.evKey = e => e.sid + '|' + e.t + '|' + e.type + '|' + (e.m == null ? '' : e.m) + '|' + JSON.stringify(e.d || {});
R.dedupe = function(evs){
  const kept = new Map(), per = new Map(), out = [];
  for(const e of evs){
    const k = R.evKey(e), sk = (e._src == null ? '' : e._src) + '#' + k;
    const n = (per.get(sk) || 0) + 1; per.set(sk, n);
    if(n <= (kept.get(k) || 0)) continue;
    kept.set(k, n); out.push(e);
  }
  return out.sort((a, b) => a.t - b.t);
};
// objective text by mission and id, from any obj_done.txt or stuck.txt in a log (rows for an objective that was never
// finished or stuck still get its name when another player's log has it)
R.objTexts = function(evs){
  const t = {};
  for(const e of evs || []){
    const d = dOf(e), id = e.type === 'obj_done' ? d.id : e.type === 'stuck' ? d.obj : null;
    if(id && d.txt && !t[(e.m || '?') + '|' + id]) t[(e.m || '?') + '|' + id] = String(d.txt);
  }
  return t;
};
R.labelOf = e => dOf(e).p || e.p || null;
// players keyed by device + label, printed B7QX·P3
R.players = function(evs){
  const out = new Map();
  for(const e of evs){
    const label = R.labelOf(e), dev = e._dev || 'device';
    const key = dev + '·' + (label || '-');
    if(!out.has(key)) out.set(key, { key, dev, label, name:label ? (isDevId(dev) ? dev + '·' + label : label + ' (' + dev.replace(/^file:/, '') + ')') : (isDevId(dev) ? dev + ' · no player label' : dev.replace(/^file:/, '') + ' · no player label'), events:[] });
    out.get(key).events.push(e);
  }
  return [...out.values()];
};
// --player accepts B7QX·P3, B7QX-P3, B7QX.P3 or P3
R.matchPlayer = (pl, q) => {
  if(!q) return true;
  const s = String(q).trim(), m = s.match(/^([A-Za-z0-9]{4})\s*[·.\-:/ ]\s*(.+)$/);
  if(m) return pl.dev.toUpperCase() === m[1].toUpperCase() && String(pl.label || '').toUpperCase() === m[2].toUpperCase();
  return String(pl.label || '').toUpperCase() === s.toUpperCase();
};

/* ---------- 1. where did they get lost? ---------- */
R.lost = function(ev, ctx){
  const by = new Map(), inv = new Map();
  const get = (m, obj) => { const k = m + '|' + obj; if(!by.has(k)) by.set(k, { kind:'obj', m, obj, txt:null, secs:null, stuck:0, hints:0, away:0, eff:null, walked:null, direct:null, quit:false, nothing:0, done:false, want:null }); return by.get(k); };
  const iget = (m, id) => { const k = m + '|' + id; if(!inv.has(k)) inv.set(k, { kind:'inv', m, id, name:screenOf(id), open:0, opens:0, strikes:0, files:0, struck:0, docFailed:0, refused:0, pending:0, verdicts:0, vanNo:0, tableStuck:0 }); return inv.get(k); };
  let prev = null;
  for(const e of ev){
    const d = dOf(e), m = e.m || '?';
    switch(e.type){
      case 'obj_done': { const o = get(m, d.id); Object.assign(o, { txt:d.txt || o.txt, secs:d.secs, eff:d.eff, walked:d.walked, direct:d.direct, done:true }); break; }
      case 'stuck': if(d.obj){ const o = get(m, d.obj); o.stuck++; o.txt = d.txt || o.txt; o.want = d.want || o.want; } break;
      case 'hint': if(d.obj) get(m, d.obj).hints++; break;
      case 'away': if(d.obj) get(m, d.obj).away++; break;
      case 'interact_miss': if(d.obj && d.why === 'none') get(m, d.obj).nothing += (d.rep || 1); break;
      case 'quit': {
        // a quit right after the two questions (or a mission end) is the end of the session, not "lost"
        const late = (d.secsOnObj || 0) >= 60, after = prev && (prev.type === 'survey' || prev.type === 'mission_end') && e.t - prev.t < 30000;
        if(d.obj && e.m && late && !after){ const o = get(m, d.obj); o.quit = true; if(o.secs == null) o.secs = d.secsOnObj; }
        break;
      }
      case 'ov_dwell': if(R.SCREENS[d.id]){ const a = iget(m, d.id); a.open += +d.secs || 0; a.opens++; } break;
      case 'ops_open': iget(m, 'screen-ops'); break;
      case 'desk_open': iget(m, 'screen-desk'); break;
      case 'strike': iget(m, 'screen-ops').strikes++; break;
      case 'file': { const a = iget(m, 'screen-ops'); a.files++; a.struck += +d.struck || 0; break; }
      case 'van_refused': iget(m, 'screen-ops').vanNo++; break;          // the M2 van said THE TABLE FIRST
      case 'table_stuck': iget(m, 'screen-ops').tableStuck++; break;     // 90 s at the table with no new ink
      case 'doc_failed': iget(m, 'screen-puzzle').docFailed++; break;
      case 'warrant': if(d.w === 'refused') iget(m, 'warrant').refused++; else if(d.w === 'pending') iget(m, 'warrant').pending++; break;
      case 'v13_warrant': if(d.status === 'refused') iget(m, 'screen-desk').refused++; else if(d.status === 'pending') iget(m, 'screen-desk').pending++; break;
      case 'v13_verdict': iget(m, 'screen-desk').verdicts++; break;
    }
    if(e.type !== 'quit' && e.type !== 'seen_read' && e.type !== 'pt_dropped') prev = e;
  }
  const L = R.LOST, I = R.INVEST, rows = [], names = (ctx && ctx.txt) || {};
  for(const o of by.values()){
    if(!o.txt && names[o.m + '|' + o.obj]) o.txt = names[o.m + '|' + o.obj];
    o.score = L.stuck * o.stuck + L.hint * o.hints + L.away * o.away + (o.eff != null && o.eff < 0.4 && (o.walked || 0) >= 25 ? L.ineff : 0) + (o.quit ? L.quit : 0) + (o.nothing >= 3 ? L.taps : 0);
    o.level = o.score >= L.lostAt ? 'lost' : (o.score >= L.slowAt || (o.secs || 0) >= L.slowSecs) ? 'slow' : null;
    if(o.level) rows.push(o);
  }
  for(const a of inv.values()){
    a.score = I.strike * a.strikes + I.docFailed * a.docFailed + I.refused * a.refused + I.pending * a.pending + Math.floor(a.open / I.openPer);
    a.level = a.score >= I.lostAt ? 'lost' : a.score >= I.slowAt ? 'slow' : null;
    if(a.level || a.open >= 60 || a.strikes || a.docFailed || a.refused || a.pending || a.vanNo || a.tableStuck) rows.push(a);
  }
  const rank = r => (r.level === 'lost' ? 2 : r.level === 'slow' ? 1 : 0);
  rows.sort((a, b) => rank(b) - rank(a) || b.score - a.score || ((b.secs || b.open || 0) - (a.secs || a.open || 0)));
  const lost = rows.filter(r => r.level === 'lost').length, slow = rows.filter(r => r.level === 'slow').length;
  const verdict = lost ? `Lost at ${lost} place${lost === 1 ? '' : 's'}` + (slow ? `, slow at ${slow}` : '') : slow ? `Slow at ${slow}, never lost` : 'No sign of being lost';
  return { verdict, lost, slow, rows, objectives:[...by.values()], screens:[...inv.values()] };
};
R.lostLine = o => {
  const bits = [];
  if(o.kind === 'inv'){
    if(o.open) bits.push(`${mmss(o.open)} open`);
    if(o.opens > 1) bits.push(`opened ×${o.opens}`);
    if(o.strikes) bits.push(`${o.strikes} strike${o.strikes === 1 ? '' : 's'}`);
    if(o.struck) bits.push(`${o.struck} link${o.struck === 1 ? '' : 's'} struck`);
    if(o.vanNo) bits.push(`van refused ×${o.vanNo}`);
    if(o.tableStuck) bits.push(`stuck at the table ×${o.tableStuck}`);
    if(o.docFailed) bits.push(`${o.docFailed} document${o.docFailed === 1 ? '' : 's'} failed`);
    if(o.refused) bits.push(`warrant refused ×${o.refused}`);
    if(o.pending) bits.push(`warrant pending ×${o.pending}`);
    if(o.verdicts) bits.push(`${o.verdicts} verdict${o.verdicts === 1 ? '' : 's'}`);
    if(o.level) bits.push(o.level);
    return `${up(o.m)} · ${o.name}: ${bits.join(', ') || 'opened'}`;
  }
  if(o.secs != null) bits.push(mmss(o.secs));
  if(o.stuck) bits.push('stuck ×' + o.stuck);
  if(o.hints) bits.push('hint ×' + o.hints);
  if(o.away) bits.push('walked away ×' + o.away);
  if(o.walked != null && o.direct != null && o.eff != null && o.eff < 0.6) bits.push(`walked ${o.walked} m for ${o.direct} m`);
  if(o.nothing >= 3) bits.push(`${o.nothing} taps on nothing`);
  if(o.quit) bits.push('quit here');
  if(!o.done) bits.push('not finished');
  const same = (a, b) => short(a, 60).toLowerCase() === short(b, 60).toLowerCase();
  if(o.want && o.stuck && !(o.txt && same(o.want, o.txt))) bits.push('wanted: ' + short(o.want, 28));
  return `${up(o.m)} · ${short(o.txt || o.obj, 34)}: ${bits.join(', ')}`;
};

/* ---------- 2. which interactions failed? (noop is not a failure) ---------- */
const pre = s => String(s || '').slice(0, 40);
R.failed = function(ev){
  let presses = 0, fails = 0; const g = new Map();
  const add = (kind, m, label, toast, want, n, small) => {
    const k = [kind, m, label, toast].join('|');
    if(!g.has(k)) g.set(k, { kind, m, label, toast, want, small, n:0 });
    g.get(k).n += n;
  };
  for(const e of ev){
    const d = dOf(e), m = e.m || '?';
    if(e.type === 'interact_result'){
      presses++;
      if(d.outcome === 'refused'){
        fails++;
        const stolen = d.want && pre(d.want) !== pre(d.label) && (d.alt || []).some(a => pre(a) === pre(d.want));
        add(stolen ? 'stolen' : 'refused', m, d.label, d.toast ? d.toast.big : null, d.want, 1, d.toast ? d.toast.small : null);
      }
    } else if(e.type === 'interact_miss'){
      const n = d.rep || 1; presses += n; fails += n;
      add(d.why === 'range' ? 'range' : 'nothing', m, d.near, null, d.want, n, d.dist != null ? d.dist + ' m' : null);
    } else if(e.type === 'blocked'){
      add('blocked', m, d.big, d.big, null, d.rep || 1, d.small);
    }
  }
  const rows = [...g.values()].sort((a, b) => b.n - a.n);
  const rate = presses ? fails / presses : 0;
  const verdict = presses ? `${fails} of ${presses} presses failed (${Math.round(rate * 100)}%)` : (rows.length ? 'No presses logged; refused without a press below' : 'No presses logged');
  return { verdict, presses, fails, rate, rows };
};
const KIND = { refused:'refused', stolen:'wrong target', range:'just out of reach', nothing:'nothing in reach', blocked:'refused (no press)' };
R.failLine = r => {
  if(r.kind === 'blocked') return `×${r.n} ${up(r.m)} ${short(r.label, 30)}${r.small ? ' "' + short(r.small, 40) + '"' : ''} · refused (no press)`;
  const what = r.kind === 'range' || r.kind === 'nothing' ? `tap, ${KIND[r.kind]}${r.label ? ' (nearest: ' + short(r.label, 26) + (r.small ? ', ' + r.small : '') + ')' : ''}`
    : `${short(r.label, 30)}${r.toast ? ': ' + short(r.toast, 24) : ''} · ${KIND[r.kind]}`;
  return `×${r.n} ${up(r.m)} ${what}${r.kind === 'stolen' ? ' (wanted: ' + short(r.want, 28) + ')' : ''}`;
};

/* ---------- 3. did they understand why they were seen? ---------- */
const posture = d => (d.crouch ? 'crouched' : 'standing') + '/' + (d.gait === 'still' ? 'still' : 'moving');
R.detection = function(ev){
  const hasTac = ev.some(e => ['seen', 'evaded', 'seen_read', 'enc', 'order', 'ally_done', 'm2_summary', 'm3_summary', 'tac_mission'].includes(e.type));
  const seen = ev.filter(e => e.type === 'seen');
  const notices = seen.filter(e => dOf(e).level === 'notice').length;
  const evaded = ev.filter(e => e.type === 'evaded');
  // pair seen_read with alarms by order, per session and watcher
  const q = new Map(), readOf = new Map();
  for(const e of ev){
    const d = dOf(e), k = e.sid + '|' + (d.who || '');
    if(e.type === 'seen' && d.level === 'alarm'){ if(!q.has(k)) q.set(k, []); q.get(k).push(e); }
    else if(e.type === 'seen_read'){ const a = (q.get(k) || []).shift(); if(a) readOf.set(a, e); }
  }
  const alarms = seen.filter(e => dOf(e).level === 'alarm');
  const judged = alarms.filter(e => R.JUDGED.test(dOf(e).cause || ''));
  const rows = judged.map((a, i) => {
    const d = dOf(a), rd = readOf.get(a) || null, rdd = dOf(rd);
    const w = rd && rdd.words != null ? rdd.words : words(d.why);
    const need = R.readMs(w), ms = rd ? (+rdd.ms || 0) : null;
    const repeat = judged.slice(i + 1).some(b => dOf(b).cause === d.cause && posture(dOf(b)) === posture(d));
    const after = ev.filter(e => e.t > a.t);
    const next = after.find(e => (e.type === 'evaded' && dOf(e).who === d.who) || (e.type === 'seen' && dOf(e).who === d.who && dOf(e).level === 'alarm') || (e.type === 'enc' && dOf(e).enc === d.enc));
    const then = !next ? 'none' : next.type === 'evaded' ? 'evaded' : next.type === 'seen' ? 'again' : 'resolved';
    return { m:a.m, who:d.who, enc:d.enc, cause:d.cause, why:d.why, crouch:!!d.crouch, gait:d.gait, posture:posture(d), dist:d.dist, place:d.place,
      readMs:ms, need, via:rd ? (rdd.via === undefined ? undefined : rdd.via) : null, end:rd ? rdd.end : null, hasRead:!!rd, read:rd ? ms >= need : null, repeat, then };
  });
  const sv = ev.filter(e => e.type === 'survey' && !dOf(e).skipped).pop();
  const unfair = sv && dOf(sv).unfair ? { text:dOf(sv).unfair, aboutDetection:R.DETECT_WORDS.test(dOf(sv).unfair) } : null;
  const how = {}; evaded.forEach(e => { const h = dOf(e).how || '?'; how[h] = (how[h] || 0) + 1; });
  const howTxt = Object.entries(how).map(([k, v]) => `${k} ×${v}`).join(', ');
  const reps = rows.filter(r => r.repeat).length;
  // 'same reason again' is an evidence row, never a stamp input
  const repeats = [];
  { const c = {}; rows.forEach(r => { const k = r.cause + ', ' + r.posture.replace('/', ' and '); c[k] = (c[k] || 0) + 1; }); for(const [k, n] of Object.entries(c)) if(n > 1) repeats.push({ k, n }); }
  let verdict, flag = null;
  if(!hasTac) verdict = 'No detection data in this build';
  else if(!rows.length){
    const other = alarms.length ? ` (${alarms.length} alarm${alarms.length === 1 ? '' : 's'} not from their movement: ${[...new Set(alarms.map(a => dOf(a).cause))].join(', ')})` : '';
    verdict = (notices ? `Noticed ${notices}×, never seen` + (evaded.length ? ` · got away ${evaded.length}× (${howTxt})` : '') : 'Never noticed') + other;
  } else {
    const noRead = rows.filter(r => !r.hasRead).length, readOk = rows.filter(r => r.read).length, short_ = rows.filter(r => r.hasRead && !r.read).length;
    verdict = `Seen ${rows.length}× · reason on screen long enough for ${readOk} of ${rows.length}` + (noRead ? ` · no read record for ${noRead}` : '') + (reps ? ` · same reason again ×${reps}` : ' · no repeat');
    flag = noRead ? 'none' : (short_ || (unfair && unfair.aboutDetection)) ? 'ask' : 'likely';
  }
  return { verdict, flag, stamp:flag ? R.STAMP[flag] : null, alarms:rows.length, allAlarms:alarms.length, notices, evaded:evaded.length, how, rows, repeats, unfair };
};
R.seenLine = r => `${up(r.m)} ${nameOf(r.who)}: "${short(r.why || r.cause, 52)}" · ` +
  (!r.hasRead ? 'no read record' : (!r.readMs && r.via == null) ? 'reason never on screen' : `on screen ${r1(r.readMs / 1000)} s of ${r1(r.need / 1000)} s needed${r.via ? ' (' + (r.via === 'both' ? 'eye and toast' : r.via) + ')' : ''}`) +
  ({ evaded:' · then got away', again:' · seen again', resolved:'', none:'' })[r.then];
R.repeatLine = x => `Same reason again: ${x.n} alarms for ${x.k}`;

/* ---------- 4. did they use more than one approach? chosen and result, separately ---------- */
const AP = { cold:'caught cold', soft:'half-noticed', seen:'seen', bolt:'he bolted', legacy:'' };
const HOW = { tackle:'tackled', cutoff:'cut off', boxed:'boxed in', uche:'Uche took him down', escaped:'got away', cold:'' };
const OBI = { cold:'reached unseen', beat_thumb:'grabbed before the wipe', stun_grab:'grabbed while stunned', intercepted:'stopped in the house', covered:'Uche covered him',
  cornered:'cornered', tackled:'Uche tackled him', perimeter:'out the back, the perimeter team brought him round' };
R.approaches = function(ev){
  const fam = new Map(), rows = [];
  const use = (f, why) => { if(!f) return; if(!fam.has(f)) fam.set(f, []); fam.get(f).push(why); };
  const encs = ev.filter(e => e.type === 'enc');
  const orders = ev.filter(e => e.type === 'order');
  const acts = ev.filter(e => e.type === 'ally_done' && R.ACTS.test(dOf(e).task || '') && dOf(e).outcome !== 'cancelled');
  const sum = m => ev.filter(e => e.type === m + '_summary').pop();
  for(const e of encs){
    const d = dOf(e), m = e.m || (String(d.enc || '').slice(0, 2)) || '?';
    if(d.enc === 'm2_kc'){
      const s2 = dOf(sum('m2')), crouchNear = +(s2.crouchNearSecs || d.crouchNearSecs || 0);
      const stealth = d.approach === 'cold' || d.approach === 'soft' || crouchNear >= 2 || (d.side && d.side !== 'front');
      const chosen = stealth ? 'stealth' : 'direct';
      if(stealth) use('stealth', 'M2 KC ' + (d.approach === 'cold' || d.approach === 'soft' ? 'approach ' + d.approach : crouchNear >= 2 ? 'crouched near him' : 'pressed from the ' + d.side));
      if(d.how === 'cutoff' || d.how === 'boxed') use('intercept', 'M2 KC ' + d.how);
      const a = AP[d.approach] != null ? AP[d.approach] : (d.approach || ''), h = HOW[d.how] != null ? HOW[d.how] : (d.how || '');
      const result = d.approach === 'cold' && (d.how === 'cold' || !d.how) ? 'caught cold, no chase' : [a, h].filter(Boolean).join(', then ') || d.outcome || '?';
      rows.push({ m, enc:d.enc, chosen, def:!stealth, result, fams:[...(stealth ? ['stealth'] : []), ...((d.how === 'cutoff' || d.how === 'boxed') ? ['intercept'] : [])] });
    } else if(d.enc === 'm2_tunde'){
      const prep = d.choice === 'quiet' && !!d.tip;
      if(prep) use('preparation', 'M2 Tunde quiet, with the route tip');
      rows.push({ m, enc:d.enc, chosen:d.choice || 'no choice', def:false, result:[d.seen ? 'seen with him' : 'not seen with him', d.tip ? 'got the route' : null].filter(Boolean).join(', '), fams:prep ? ['preparation'] : [] });
    } else if(d.enc === 'm3_entry'){
      const def = d.def || {}, f = [];
      let chosen = d.entry || '?', isDef = false;
      if(d.entry === 'quiet'){ use('stealth', 'M3 entry quiet'); f.push('stealth'); }
      else if(d.entry === 'loud'){ use('direct', 'M3 entry loud'); f.push('direct'); }
      else if(d.entry === 'knock'){ if(def.entry){ isDef = true; } else { use('direct', 'M3 entry knock (chosen)'); f.push('direct'); } }
      if(d.door === 'gate'){ use('preparation', 'M3 side gate'); f.push('preparation'); chosen += ', side gate'; }
      if(d.power === 'cut' && !def.power){ use('preparation', 'M3 power cut'); if(!f.includes('preparation')) f.push('preparation'); chosen += ', power cut'; }
      rows.push({ m, enc:d.enc, chosen, def:isDef && !f.length, result:d.armed ? 'the wipe started at entry' : 'on site', fams:f });
    } else if(d.enc === 'm3_obi'){
      const f = [];
      if(d.outcome === 'intercepted'){ use('intercept', 'M3 Obi intercepted'); f.push('intercept'); }
      rows.push({ m, enc:d.enc, chosen:null, def:false, result:(OBI[d.outcome] || d.outcome || '?') + (d.alertedBy ? ` (alerted by ${d.alertedBy})` : ''), fams:f });
    } else if(d.enc === 'm3_laptop' || d.enc === 'm3_child'){
      rows.push({ m, enc:d.enc, chosen:d.enc === 'm3_child' ? (d.choice || null) : null, def:false, result:d.enc === 'm3_laptop' ? `${d.outcome || '?'}${d.files != null ? ', ' + d.files + ' files' : ''}` : (d.by ? 'out with ' + (d.by === 'uche' ? 'Uche' : 'Kelechi') : 'still inside'), fams:[] });
    } else rows.push({ m, enc:d.enc, chosen:d.approach || d.entry || d.choice || null, def:false, result:d.how || d.outcome || '?', fams:[] });
  }
  // Uche: an order the player gave (non-default source) AND an act in the same mission
  const missions = [...new Set(orders.concat(acts).map(e => e.m || '?'))];
  for(const m of missions){
    const os = orders.filter(e => (e.m || '?') === m && R.ORDER_SRC.test(dOf(e).src || '') && dOf(e).def !== true && dOf(e).ok !== false);
    const as = acts.filter(e => (e.m || '?') === m);
    const posts = os.filter(e => dOf(e).post && dOf(e).post !== 'van');
    const f = [], post = posts.length ? dOf(posts[posts.length - 1]).post : null;
    // one decision, one family: a post that Uche then acted on is the Uche family; a post alone is preparation
    if(os.length && as.length){ use('Uche', `${up(m)} Uche ${dOf(as[0]).task}` + (post ? ` (posted to the ${post})` : '')); f.push('Uche'); }
    else if(post){ use('preparation', `${up(m)} Uche posted to the ${post}`); f.push('preparation'); }
    const ord = os.map(e => dOf(e).order + (dOf(e).post ? ' ' + dOf(e).post : '')).join(', ');
    rows.push({ m, enc:'uche', chosen:os.length ? 'ordered: ' + ord : 'no order', def:!os.length,
      result:(as.length ? 'acted: ' + [...new Set(as.map(e => dOf(e).task))].join(', ') : 'did nothing on screen') + (!os.length && as.length ? ' (not counted: never ordered)' : ''), fams:f });
  }
  const byEnc = {}; rows.forEach(r => { if(r.chosen) (byEnc[r.enc] = byEnc[r.enc] || new Set()).add(r.chosen); });
  const changed = Object.entries(byEnc).filter(([, s]) => s.size > 1).map(([k]) => k);
  const families = [...fam.keys()];
  const verdict = !encs.length && !orders.length && !ev.some(e => e.type === 'ally_done') ? 'No encounter data in this build'
    : families.length >= 2 ? `Yes, ${families.length}: ${families.join(', ')}` : families.length === 1 ? `One: ${families[0]}` : 'None recognised';
  return { verdict, families, why:Object.fromEntries(fam), rows, orders:orders.length, acts:acts.length, changed };
};
R.encLine = r => `${up(r.m)} ${nameOf(r.enc)} · ` + (r.chosen ? `chosen: ${r.chosen}${r.def ? ' (default)' : ''}; ` : '') + `result: ${r.result}` + (r.fams.length ? ` [${r.fams.join(', ')}]` : '');

/* ---------- one player ---------- */
R.meta = function(ev){
  const ss = ev.filter(e => e.type === 'session'), s = dOf(ss[ss.length - 1]);
  const pp = ev.filter(e => e.type === 'pt_player'), p = dOf(pp[pp.length - 1]);
  const kinds = [...new Set(ev.map(e => dOf(e).dev).filter(x => x === 'touch' || x === 'desk'))];
  const ng = ev.filter(e => e.type === 'new_game' && dOf(e).d).pop();
  const sv = ev.filter(e => e.type === 'survey' && !dOf(e).skipped);
  const set = s.settings || p.settings || {};
  const diff = (ng && dOf(ng).d) || (sv.length && dOf(sv[sv.length - 1]).diff) || set.casework || null;
  // "Hints when stuck": the last event that reports it wins. session and pt_player carry the device's value at load and at
  // NEW PLAYER (both before the start); new_game the value the start set (Senior off, Recruit on; older logs have none, so
  // the session value stands); settings {k:'hints', v} the row, RESET TO DEFAULTS or the restore after an abandoned start.
  // hintsChanged: a settings event moved it from the value in force, so part of the session was played the other way.
  let hints = null, hintsChanged = false;
  for(const e of ev){
    const d = dOf(e), v = (e.type === 'session' || e.type === 'pt_player') ? (d.settings || {}).hints : e.type === 'new_game' ? d.hints : (e.type === 'settings' && d.k === 'hints') ? d.v : undefined;
    if(v !== 'on' && v !== 'off') continue;
    if(e.type === 'settings' && hints && v !== hints) hintsChanged = true;
    hints = v;
  }
  // played: per session, from the first to the last ps of this player (ps restarts at NEW PLAYER and on reload)
  const bySid = {};
  for(const e of ev){ const v = dOf(e).ps; if(typeof v !== 'number') continue; const b = bySid[e.sid] || (bySid[e.sid] = [v, v]); b[0] = Math.min(b[0], v); b[1] = Math.max(b[1], v); }
  let play = 0, anyPs = false; for(const k in bySid){ anyPs = true; play += bySid[k][1] - (ev.some(e => e.sid === k && e.type === 'pt_player') ? 0 : bySid[k][0]); }
  if(!anyPs && sv.length && dOf(sv[sv.length - 1]).secsPlayed != null){ anyPs = true; play = dOf(sv[sv.length - 1]).secsPlayed; }
  const ends = [...new Set(ev.filter(e => e.type === 'mission_end').map(e => dOf(e).m).filter(Boolean))];
  ['m2', 'm3'].forEach(m => { if(ev.some(e => e.type === m + '_summary') && !ends.includes(m)) ends.push(m); });
  const hdr = ev.find(e => e._bsrc);
  return { kinds, sessions:new Set(ev.map(e => e.sid)).size, diff, pace:set.difficulty || null, hints, hintsChanged, build:(s.build || {}).src || (hdr ? hdr._bsrc : null),
    w:s.w || p.w || null, h:s.h || p.h || null, from:ev.length ? ev[0].t : null, to:ev.length ? ev[ev.length - 1].t : null,
    wallSecs:ev.length ? Math.round((ev[ev.length - 1].t - ev[0].t) / 1000) : 0, playSecs:anyPs ? Math.round(play) : null,
    missions:ends, survey:sv.map(e => ({ where:dOf(e).where, satisfying:dOf(e).satisfying, unfair:dOf(e).unfair })), events:ev.length,
    v2:ev.some(e => e.type === 'session' && dOf(e).ptv === 2) || ev.some(e => typeof dOf(e).ps === 'number') };
};
// ctx (optional): { txt } objective names by 'm|id' (R.objTexts over every loaded log, plus the game's own list on the page)
R.analyze = (ev, ctx) => ({ meta:R.meta(ev), lost:R.lost(ev, ctx), failed:R.failed(ev), detection:R.detection(ev), approaches:R.approaches(ev) });
R.DIFF = { recruit:'Recruit', senior:'Senior Agent' };
R.leadLine = M => [M.kinds.map(k => k === 'touch' ? 'Phone' : 'Desktop').join(' + ') || 'Device ?', R.DIFF[M.diff] || 'casework ?',
  M.hints ? 'hints when stuck ' + M.hints + (M.hintsChanged ? ' (changed during play)' : '') : null, M.playSecs != null ? mmss(M.playSecs) + ' played' : mmss(M.wallSecs) + ' on the clock',
  'finished ' + (M.missions.map(up).join(', ') || 'nothing yet'), M.events + ' event' + (M.events === 1 ? '' : 's'), M.build ? 'build ' + M.build : null].filter(Boolean).join(' · ');
// the four sections as data: the sheet and the text renderers share these rows
R.sections = function(res){
  const D = res.detection, A = res.approaches;
  return [
    { icon:'route', q:R.Q[0], v:res.lost.verdict, rows:res.lost.rows.map(R.lostLine) },
    { icon:'cross', q:R.Q[1], v:res.failed.verdict, rows:res.failed.rows.map(R.failLine) },
    { icon:'eye', q:R.Q[2], v:D.verdict, stamp:D.flag, rows:D.rows.map(R.seenLine).concat(D.repeats.map(R.repeatLine)),
      quote:D.unfair && D.unfair.aboutDetection ? D.unfair.text : null },
    { icon:'people', q:R.Q[3], v:A.verdict, rows:A.rows.map(R.encLine).concat(A.changed.length ? ['Tried again a different way: ' + A.changed.map(nameOf).join(', ')] : []) },
  ];
};
R.text = function(res, name, max){
  max = max || 5; const L = [], M = res.meta;
  L.push(`${name} · ${R.leadLine(M)}`);
  for(const s of R.sections(res)){
    L.push(''); L.push(s.q.toUpperCase());
    L.push('  ' + s.v + (s.stamp ? '  [' + R.STAMP[s.stamp] + ']' : ''));
    s.rows.slice(0, max).forEach(r => L.push('  - ' + r));
    if(s.rows.length > max) L.push(`  (+${s.rows.length - max} more)`);
    if(s.quote) L.push(`  Felt unfair (about being seen): "${short(s.quote, 160)}"`);
  }
  if(M.survey.length){ L.push(''); L.push('THE TWO QUESTIONS'); M.survey.forEach(s => { L.push('  What was your most satisfying decision? ' + (s.satisfying || '-')); L.push('  What happened that felt unfair? ' + (s.unfair || '-')); }); }
  return L;
};

/* ---------- across players ---------- */
const median = a => { const b = a.filter(x => x != null).sort((x, y) => x - y); return b.length ? b[Math.floor((b.length - 1) / 2)] : null; };
R.across = function(list){   // [{name, res}]
  const obj = new Map(), fail = new Map(), cause = new Map(), famN = { 0:0, 1:0, '2+':0 }, stamps = {};
  for(const { name, res } of list){
    for(const o of res.lost.objectives){
      const k = o.m + '|' + o.obj; if(!obj.has(k)) obj.set(k, { m:o.m, obj:o.obj, txt:o.txt, players:0, lost:[], slow:[], secs:[] });
      const a = obj.get(k); a.players++; a.txt = a.txt || o.txt; if(o.secs != null) a.secs.push(o.secs);
      if(o.level === 'lost') a.lost.push(name); else if(o.level === 'slow') a.slow.push(name);
    }
    for(const o of res.lost.screens){
      const k = o.m + '|' + o.id; if(!obj.has(k)) obj.set(k, { m:o.m, obj:o.id, txt:o.name, players:0, lost:[], slow:[], secs:[] });
      const a = obj.get(k); a.players++; a.secs.push(o.open); if(o.level === 'lost') a.lost.push(name); else if(o.level === 'slow') a.slow.push(name);
    }
    for(const r of res.failed.rows){ const k = [r.kind, r.m, r.label, r.toast].join('|'); if(!fail.has(k)) fail.set(k, Object.assign({}, r, { n:0, players:[] })); const a = fail.get(k); a.n += r.n; a.players.push(name); }
    for(const r of res.detection.rows){ const c = r.cause || '?'; if(!cause.has(c)) cause.set(c, { cause:c, n:0, read:0, known:0, repeat:0, players:new Set() }); const a = cause.get(c); a.n++; if(r.hasRead){ a.known++; if(r.read) a.read++; } if(r.repeat) a.repeat++; a.players.add(name); }
    const f = res.approaches.families.length; famN[f >= 2 ? '2+' : f]++;
    const st = res.detection.flag || 'n/a'; stamps[st] = (stamps[st] || 0) + 1;
  }
  return { players:list.length,
    lost:[...obj.values()].map(a => Object.assign(a, { med:median(a.secs) })).filter(a => a.lost.length || a.slow.length).sort((a, b) => b.lost.length - a.lost.length || b.slow.length - a.slow.length),
    failed:[...fail.values()].sort((a, b) => b.players.length - a.players.length || b.n - a.n),
    causes:[...cause.values()].map(a => Object.assign(a, { players:[...a.players] })),
    unfairDetect:list.filter(x => x.res.detection.unfair && x.res.detection.unfair.aboutDetection).map(x => ({ name:x.name, text:x.res.detection.unfair.text })),
    famN, stamps };
};
R.acrossText = function(A, max){
  max = max || 8; const L = [];
  L.push(`ACROSS ${A.players} PLAYER${A.players === 1 ? '' : 'S'}`);
  L.push(''); L.push(R.Q[0].toUpperCase());
  if(!A.lost.length) L.push('  Nobody got lost.');
  A.lost.slice(0, max).forEach(a => L.push(`  - ${up(a.m)} · ${short(a.txt || a.obj, 34)}: lost ${a.lost.length}/${a.players}${a.lost.length ? ' (' + a.lost.join(', ') + ')' : ''}, slow ${a.slow.length}, median ${a.med == null ? '-' : mmss(a.med)}`));
  L.push(''); L.push(R.Q[1].toUpperCase());
  if(!A.failed.length) L.push('  No failed presses.');
  A.failed.slice(0, max).forEach(a => L.push(`  - ${a.players.length} player${a.players.length === 1 ? '' : 's'}, ${R.failLine(a)}`));
  L.push(''); L.push(R.Q[2].toUpperCase());
  L.push('  Stamps: ' + Object.entries(A.stamps).map(([k, n]) => `${R.STAMP[k] || 'not seen / no data'} ×${n}`).join(', '));
  if(!A.causes.length) L.push('  Nobody was seen (or no detection data).');
  A.causes.forEach(a => L.push(`  - ${a.cause}: ${a.n} alarm${a.n === 1 ? '' : 's'} across ${a.players.length} player${a.players.length === 1 ? '' : 's'}; on screen long enough ${a.known ? a.read + '/' + a.known : 'n/a'}; same reason again ${a.repeat}`));
  A.unfairDetect.forEach(u => L.push(`  - ${u.name} called it unfair: "${short(u.text, 100)}"`));
  L.push(''); L.push(R.Q[3].toUpperCase());
  L.push(`  2 or more approaches: ${A.famN['2+']} · one: ${A.famN[1]} · none recognised: ${A.famN[0]}`);
  return L;
};
R.markdown = function(list, A){
  const L = ['# NACECA playtest report', ''];
  for(const { name, res } of list){
    L.push(`## ${name}`, '', R.leadLine(res.meta), '');
    for(const s of R.sections(res)){
      L.push(`### ${s.q}`, '', `**${s.v}**${s.stamp ? ' `' + R.STAMP[s.stamp] + '`' : ''}`, '');
      s.rows.forEach(r => L.push('- ' + r));
      if(s.quote) L.push(`- Felt unfair (about being seen): "${s.quote}"`);
      L.push('');
    }
    if(res.meta.survey.length){ L.push('### The two questions', ''); res.meta.survey.forEach(s => { L.push(`- What was your most satisfying decision? ${s.satisfying || '-'}`); L.push(`- What happened that felt unfair? ${s.unfair || '-'}`); }); L.push(''); }
  }
  if(A && list.length > 1){ L.push('## Across players', '', '```'); R.acrossText(A).forEach(l => L.push(l)); L.push('```', ''); }
  return L.join('\n');
};

/* ---------- export the pure part ---------- */
root.PT_REPORT = R;
if(root.V12) root.V12.ptReport = R;

/* =========================================================================
   The sheet (the page only): Settings › PLAYTEST › Summary › VIEW.
   #screen-pt-report, a .overlay holding a cw-paper sheet. BACK, and Esc doing
   exactly what BACK does, reopen Settings and restore where Settings returns
   to (settings.js:212-213). A sticky bar holds BACK and SEND LOG.
   ========================================================================= */
if(typeof document === 'undefined' || !root.V12) return;
const V12 = root.V12;
const esc = s => (typeof V12.esc === 'function' ? V12.esc(s) : String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]));
const ico = n => (typeof icon === 'function' ? icon(n) : '');
const kit = () => V12.ptKit || null;
const SH = { scope:'player', ret:null, open:false };
const shown = () => { const ov = document.getElementById('screen-pt-report'); return !!(ov && ov.classList.contains('show')); };
function render(ov){
  const K = kit(), label = K ? K.label() : null, dev = K ? K.device() : 'device';
  const all = R.dedupe(R.normalize({ ok:true, events:(K ? K.events() : []).filter(isEv), dev:null, file:null, tz:null,
    build:(root.NACECA_BUILD || {}).src || null }, null, dev));
  if(!label) SH.scope = 'device';
  const ev = SH.scope === 'player' && label ? all.filter(e => R.labelOf(e) === label) : all;
  // objective names: from the logs, then the current mission's own list
  const txt = R.objTexts(all);
  try{ const g = typeof S !== 'undefined' && S.game; if(g && g.currentMission) (g.objectives || []).forEach(o => { if(o && o.id && o.text) txt[g.currentMission + '|' + o.id] = short(o.text, 48); }); }catch(e){}
  const res = R.analyze(ev, { txt }), M = res.meta;
  const title = SH.scope === 'player' && label ? dev + '·' + label : 'Whole device · ' + dev;
  const list = rows => rows.length ? `<ul>${rows.slice(0, 5).map(r => `<li>${esc(r)}</li>`).join('')}${rows.length > 5 ? `<li class="pt-more">+${rows.length - 5} more in the exported log</li>` : ''}</ul>` : '';
  const stamp = f => f ? `<span class="pt-stamp ${f}">${esc(R.STAMP[f])}</span>` : '';
  const secs = R.sections(res).map(s => `<section class="pt-sec"><h3>${ico(s.icon)}${esc(s.q)}</h3><p class="pt-v">${esc(s.v)}${stamp(s.stamp)}</p>${list(s.rows)}${s.quote ? `<p class="pt-quote">Felt unfair: "${esc(s.quote)}"</p>` : ''}</section>`).join('');
  const sv = M.survey[M.survey.length - 1];
  ov.innerHTML = `<div class="overlay-bg"></div><div class="cw-paper pt-sheet" role="dialog" aria-label="Playtest summary">
    <div class="cw-head"><div class="cw-agency">PLAYTEST · SUMMARY</div><div class="cw-title">${esc(title)}</div>
      <p class="pt-lead">${esc(R.leadLine(M))}</p>
      ${label ? `<div class="seg pt-scope"><button type="button" data-scope="player" class="${SH.scope === 'player' ? 'on' : ''}" aria-pressed="${SH.scope === 'player'}">${esc(label)}</button><button type="button" data-scope="device" class="${SH.scope === 'device' ? 'on' : ''}" aria-pressed="${SH.scope === 'device'}">WHOLE DEVICE</button></div>` : ''}</div>
    ${ev.some(e => !/^(pt_\w+|session)$/.test(e.type)) ? '' : '<p class="pt-empty">Nothing logged yet for this player.</p>'}
    ${secs}
    ${sv ? `<section class="pt-sec"><h3>${ico('doc')}The two questions</h3><p class="pt-quote">What was your most satisfying decision? ${esc(sv.satisfying || '-')}</p><p class="pt-quote">What happened that felt unfair? ${esc(sv.unfair || '-')}</p></section>` : ''}
    <div class="pt-acts"><button type="button" class="cw-btn" id="pt-r-back">${ico('back')}BACK</button><button type="button" class="cw-btn primary" id="pt-r-send">${ico('share')}SEND LOG</button></div></div>`;
  ov.querySelectorAll('.pt-scope button').forEach(b => { b.onclick = () => { SH.scope = b.dataset.scope; render(ov); }; });
  ov.querySelector('#pt-r-back').onclick = back;
  ov.querySelector('#pt-r-send').onclick = () => { if(typeof V12.ptExport === 'function') V12.ptExport({ player:SH.scope === 'player' && label ? label : null }); };
}
function back(){
  const ov = document.getElementById('screen-pt-report');
  const ret = SH.ret; SH.open = false;
  if(ov) ov.classList.remove('show');
  if(typeof openSettings === 'function'){
    openSettings();
    try{ _settingsReturn = ret; }catch(e){}   // closing Settings still returns where it was opened from (the pause menu)
    try{ if(typeof renderSettings === 'function') renderSettings(); }catch(e){}   // the PLAYTEST rows depend on where that is
  } else if(typeof showOverlay === 'function') showOverlay(ret);
}
V12.ptReportOpen = function(scope){
  let ov = document.getElementById('screen-pt-report');
  if(!ov){ ov = document.createElement('div'); ov.id = 'screen-pt-report'; ov.className = 'overlay'; (document.getElementById('game-root') || document.body).appendChild(ov); }
  if(!shown()){ try{ SH.ret = (typeof _settingsReturn !== 'undefined') ? _settingsReturn : null; }catch(e){ SH.ret = null; } }
  SH.scope = scope === 'device' ? 'device' : 'player';
  render(ov);
  SH.open = true;
  if(typeof showOverlay === 'function') showOverlay('screen-pt-report'); else ov.classList.add('show');
  const sh = ov.querySelector('.pt-sheet'); if(sh) sh.scrollTop = 0;
};
V12.ptReportBack = back;
// Esc does exactly what BACK does (never the pause menu over an uncovered world)
window.addEventListener('keydown', e => {
  if((e.key !== 'Escape' && e.code !== 'Escape') || !shown()) return;
  e.preventDefault(); e.stopImmediatePropagation(); back();
}, true);
})(typeof window !== 'undefined' ? window : this);
