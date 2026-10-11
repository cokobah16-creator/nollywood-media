// Team D helpers for the pt_* scenarios. Run on its own it is a no-op that passes, unless PT_FIXTURES asks it to
// (re)generate the analyser fixtures in tools/harness/fixtures/pt/ from scripted runs of the build under test:
//
//   PT_FIXTURES=A node tools/harness/run.cjs tools/harness/scenarios/pt_lib.cjs --html <build>/naceca.html --w 1280 --h 800
//   PT_FIXTURES=B node tools/harness/run.cjs tools/harness/scenarios/pt_lib.cjs --html <build>/naceca.html --touch 1
//   PT_FIXTURES=C node tools/harness/run.cjs tools/harness/scenarios/pt_lib.cjs --html <BASE build without src/tactics>/naceca.html
//
// A = a desktop device, player P1 (sneaky), exported twice (early + final) as .json; B = a phone, player P2 (direct),
// shared as .txt; C = a v1 log from the logger without the tactics layer. Every event is the real logger's output;
// where Team B's / C's encounter emitters are not in the build yet, the driver logs their §4-shaped events itself
// (a "stand-in"), only when the real emitter logged nothing. fixtures/pt/README.md records which were stand-ins.
//
//   P.all(h)                 every stored event (flushes the coalescing slot and v12_pt's buffer)
//   P.clear(h) / P.play(h,s)  CLEAR the log (keeps the player) / advance PLAY time by s seconds
//   P.stubSave(h) / P.stubShare(h, mode)   capture V12.saveFile / navigator.share ('ok' | 'abort' | 'notallowed')
//   P.reload(h, query)       reload the page (optionally with ?pt=1)
//   P.newPlayerUI(h)         Settings › PLAYTEST › NEW PLAYER, two taps
//   P.eye(h, text|null)      script the eye's why-line (#eye-ind .eye-why) when Team A's eye isn't in the build
//   P.check(events)          the DESIGN §4 contract: [problems]
//   P.driveM2(h, o) / P.driveM3(h, o)   scripted runs (fixtures, slices)
const fs = require('fs'), path = require('path');
const T = require('./tactics_lib.cjs');
const P = async h => {
  const which = process.env.PT_FIXTURES;
  if (!which) { h.log('pt_lib: helper module'); return; }
  await P.generate(h, which);
};
P.T = T;
P.ROOT = path.join(__dirname, '..', '..', '..');
P.FIX = path.join(__dirname, '..', 'fixtures', 'pt');
P.fixture = name => fs.readFileSync(path.join(P.FIX, name), 'utf8');

/* ---------- reading and writing the log ---------- */
P.all = h => h.ev(() => (window.V12 && V12.ptKit) ? V12.ptKit.events() : (V12.ptSummary(), JSON.parse(localStorage.getItem('naceca_pt_v1') || '[]')));
P.clear = h => h.ev(() => V12.ptKit.clear());
P.mark = h => h.ev(() => Date.now());
P.play = (h, secs) => h.ev(s => { V12._ptState.play += s * 1000; }, secs);
P.of = (evs, type, t0) => evs.filter(e => e.type === type && (t0 == null || e.t >= t0));
P.chars = e => JSON.stringify(e).length;
P.reps = evs => evs.reduce((a, e) => a + ((e.d && e.d.rep) || 1), 0);
P.stubSave = h => h.ev(() => {
  window.__saved = [];
  V12.saveFile = async (name, data) => { window.__saved.push({ name, data:typeof data === 'string' ? data : '[blob]' }); return window.__saveResult || 'link'; };
});
P.stubShare = (h, mode) => h.ev(mode => {
  window.__shared = []; window.__sharedText = [];
  const def = (k, v) => Object.defineProperty(navigator, k, { value:v, configurable:true, writable:true });
  def('canShare', o => !!(o && o.files && o.files.length));
  def('share', o => {
    window.__shared.push((o.files || []).map(f => ({ name:f.name, type:f.type, size:f.size })));
    window.__sharedText.push(Promise.all((o.files || []).map(f => f.text())));
    if(mode === 'abort') return Promise.reject(new DOMException('cancelled', 'AbortError'));
    if(mode === 'notallowed') return Promise.reject(new DOMException('blocked', 'NotAllowedError'));
    return Promise.resolve();
  });
}, mode || 'ok');
P.sharedText = h => h.ev(async () => Promise.all(window.__sharedText || []));
P.reload = async (h, query) => {
  const u = new URL(h.page.url()); u.search = query || '';
  await h.page.goto(u.toString(), { waitUntil:'load', timeout:90000 });
  await h.step(1500);
};
P.openSettings = async h => { await h.ev(() => { showOverlay(null); openSettings(); }); await h.step(150); };
P.rowLabels = h => h.ev(() => [...document.querySelectorAll('#settings-body .set-label')].map(l => l.childNodes[0].textContent.trim()));
P.newPlayerUI = async h => {
  const armed = await h.ev(() => { const b = document.getElementById('pt-new'); if(!b) return null; b.click(); return b.textContent; });
  const label0 = await h.ev(() => V12.ptKit.label());
  await h.step(100);
  await h.ev(() => document.getElementById('pt-new').click());
  await h.step(150);
  return { armed, label0, label:await h.ev(() => V12.ptKit.label()), dev:await h.ev(() => V12.ptKit.device()) };
};
// the eye's why-line: Team A's eye draws it (TAC.sight.full); without it, script #eye-ind the way the DOM contract says
P.eye = (h, text) => h.ev(text => {
  if(window.TAC && TAC.sight && TAC.sight.full) return 'A';
  if(typeof setEye === 'function' && text != null) setEye(1, 'look');
  const el = document.getElementById('eye-ind'); if(!el) return null;
  let w = el.querySelector('.eye-why');
  if(text == null){ el.classList.remove('show'); if(w) w.textContent = ''; return 'hidden'; }
  if(!w){ w = document.createElement('div'); w.className = 'eye-why'; el.appendChild(w); }
  w.textContent = text; el.classList.add('show');
  return 'scripted';
}, text);

/* ---------- DESIGN §4: the event contract ---------- */
const E = (...v) => v;   // enum
const SCHEMA = {
  seen:{ req:['who', 'enc', 'level', 'cause', 'dist', 'ang', 'los', 'cover', 'crouch', 'gait', 'lit', 'crowd', 'inCone', 'parts', 'peak', 'ms', 'why', 'place', 'px', 'pz', 'obj'],
    en:{ level:E('notice', 'alarm'), cause:E('sight', 'noise', 'close', 'scan', 'fumble', 'tunde', 'tunde_glance'), los:E('clear', 'low', 'tall', 'none'), gait:E('still', 'sneak', 'walk', 'jog', 'sprint'), lit:E('lit', 'dark') } },
  evaded:{ req:['who', 'enc', 'peak', 'secs', 'how', 'crouchPct'], en:{ how:E('cover', 'crowd', 'distance', 'cone', 'dark') } },
  radio:{ req:['key', 'pri', 'speaker', 'outcome', 'waitMs'] },
  tac_mission:{ req:['m', 'crouchMode', 'crouchSecs', 'crouchOn', 'missShown', 'missSuppressed', 'radio', 'seen', 'evaded', 'geo'] },
  geo_drift:{ req:['scene', 'reason', 'unknown', 'matched', 'total'], en:{ reason:E('table', 'legacy') } },
  'enc:m2_tunde':{ req:['side', 'seen', 'dist', 'ang', 'bark', 'choice', 'tip', 'habit', 'wary'], en:{ side:E('road', 'stall', 'far'), choice:E('quiet', 'loud', null) } },
  'enc:m2_kc':{ req:['approach', 'intent', 'susp', 'level', 'exposed', 'gap', 'scanSeen', 'side', 'outcome', 'how', 'secs', 'bumps', 'bumpsLane', 'trust', 'cutReached', 'ribbon', 'prep', 'uche'],
    en:{ approach:E('cold', 'soft', 'seen', 'bolt', 'legacy'), intent:E('stealth', 'direct'), side:E('front', 'side', 'behind'), outcome:E('caught', 'escaped'), how:E('cold', 'tackle', 'cutoff', 'boxed', 'uche', 'escaped'), ribbon:E('off', 'earned', 'all') },
    sub:{ prep:['tip', 'habit', 'post', 'posted', 'pursuit', 'tier', 'greyman', 'sources'], uche:['post', 'arrived', 'role'] } },
  order:{ req:['who', 'order', 'src', 'ok', 'def', 'obj', 't'], en:{ who:E('uche'), order:E('post', 'cover', 'take_child', 'back'), src:E('talk', 'button', 'key', 'card'), post:E('corner', 'back', 'van'), why:E('busy', 'no_sight', 'running', 'unaware'), def:E(false) } },
  ally_done:{ req:['who', 'task', 'outcome', 'secs'], en:{ who:E('uche'), task:E('arrive', 'veer', 'tackle', 'box', 'callout', 'cover_held', 'escort', 'posted_back'), outcome:E('done', 'cancelled') } },
  m2_summary:{ req:['kc', 'how', 'approach', 'scanSeen', 'alarms', 'notices', 'suspPeak', 'eyeSecs', 'crouchNearSecs', 'watchSecs', 'tunde', 'post', 'posted', 'ucheArrived', 'ucheRole', 'chase', 'trust', 'secs', 'caps', 'diff', 'hints', 'build', 'intent', 'wary', 'ribbon'] },
  'enc:m3_entry':{ req:['entry', 'door', 'power', 'uche', 'leak', 'armed', 'spawn', 'wipeTotal', 'variant', 'prep', 'def'],
    en:{ entry:E('knock', 'loud', 'quiet'), door:E('front', 'gate'), power:E('on', 'cut'), uche:E('with', 'rear'), leak:E(false), variant:E('v8', 'legacy') },
    sub:{ prep:['sims', 'kcFair', 'tip', 'civ', 'warrant'], def:['entry', 'power'] } },
  'enc:m3_obi':{ req:['outcome', 'by', 'alertedBy', 'secs', 'runSecs', 'ranM', 'dist', 'duringMinigame', 'states', 'ucheJob', 'prep'],
    en:{ outcome:E('cold', 'beat_thumb', 'stun_grab', 'intercepted', 'covered', 'cornered', 'tackled', 'perimeter'), by:E('kelechi', 'uche', 'perimeter'),
      alertedBy:E('sight', 'noise', 'close', 'scan', 'fumble', 'tunde', 'tunde_glance', 'knock', 'loud', null) } },
  'enc:m3_laptop':{ req:['outcome', 'pct', 'files', 'ledger', 'total', 'firstAt', 'armedAt', 'mg'], en:{ outcome:E('never_started', 'halted', 'lost', 'abandoned') } },
  'enc:m3_child':{ req:['choice', 'by', 'calm', 'outAt', 'gentle'], en:{ choice:E('gentle', 'stay', null), by:E('kelechi', 'uche', null) } },
  m3_summary:{ req:['entry', 'door', 'power', 'uche', 'obi', 'seen', 'wipe', 'child', 'secs', 'build'] },
  seen_read:{ req:['who', 'enc', 'ms', 'via', 'words', 'end'], en:{ via:E('eye', 'toast', 'both', null), end:E('overlay', 'hidden', 'replaced', 'scene', 'timeout', 'quit') } },
  ov_dwell:{ req:['id', 'secs', 'obj'] },
  pt_player:{ req:['label', 'dev', 'prev', 'ps0', 'w', 'h', 'touch', 'orient', 'settings'] },
  pt_export:{ req:['via', 'events', 'chars', 'file'], en:{ via:E('share', 'claude', 'link', 'declined', 'failed') } },
  pt_dropped:{ req:['byType'] },
  orient:{ req:['o', 'w', 'h'], en:{ o:E('portrait', 'landscape') } },
};
P.SCHEMA = SCHEMA;
P.TACTICS = /^(seen|evaded|radio|tac_mission|geo_drift|enc|order|ally_done|m2_summary|m3_summary|seen_read|ov_dwell|pt_player|pt_export|pt_dropped|orient)$/;
P.check = evs => {
  const bad = [];
  for (const e of evs) {
    const d = e.d || {}, key = e.type === 'enc' ? 'enc:' + d.enc : e.type, s = SCHEMA[key];
    const where = `${e.type}${e.type === 'enc' ? ' ' + d.enc : ''}@${e.t}`;
    const max = (e.type === 'survey' || e.type === 'pt_player') ? 4000 : 1500;
    if (P.chars(e) > max) bad.push(`${where}: ${P.chars(e)} chars > ${max}`);
    if (e.type === 'seen' && d.level === 'calm') bad.push(`${where}: seen with level calm (use evaded)`);
    if (e.type === 'seen' && /^(knock|loud)$/.test(d.cause)) bad.push(`${where}: seen.cause ${d.cause} (that is enc m3_obi.alertedBy)`);
    if (!s) { if (e.type === 'enc' && /^m[23]_/.test(d.enc || '')) bad.push(`${where}: an enc the contract doesn't list`); continue; }
    for (const k of s.req) if (!(k in d)) bad.push(`${where}: missing ${k}`);
    for (const [k, vals] of Object.entries(s.en || {})) if (k in d && !vals.includes(d[k])) bad.push(`${where}: ${k}=${JSON.stringify(d[k])} not in ${JSON.stringify(vals)}`);
    for (const [k, sub] of Object.entries(s.sub || {})) if (d[k] && typeof d[k] === 'object') for (const f of sub) if (!(f in d[k])) bad.push(`${where}: missing ${k}.${f}`);
    if (e.type === 'seen_read' && d.via == null && d.ms) bad.push(`${where}: ms ${d.ms} with no via`);
    if (e.type === 'enc' && d.enc === 'm3_obi' && Array.isArray(d.states) && d.states.length > 8) bad.push(`${where}: states > 8`);
  }
  return bad;
};

/* ---------- the slices: real events against the contract ---------- */
// records, for every seen, the eye's line on the frame after it (A's HUD draws on its tick, after the log call)
P.eyeProbe = h => h.ev(() => {
  window.__ptEye = [];
  if (!V12.log.__ptEye) {
    const o = V12.log;
    const f = function(t, d){ if (t === 'seen' && d) window.__ptEye.push({ who:d.who, level:d.level, why:d.why, at:null, shown:null, top:null }); return o.apply(this, arguments); };
    f.__ptEye = true; f.__tacCap = o.__tacCap; V12.log = f;
  }
  if (!window.__ptEyeOff) window.__ptEyeOff = TAC.onFrame(() => {
    for (const r of window.__ptEye) if (r.at == null) {
      const el = document.getElementById('eye-ind'), w = el && el.querySelector('.eye-why'), top = TAC.sight.top();
      r.at = w ? w.textContent.trim() : null; r.shown = !!(el && el.classList.contains('show')); r.top = top ? top.id : null;
    }
  }, { order:1000 });
});
P.eyeRecords = h => h.ev(() => window.__ptEye || []);
// the shared slice asserts: schema, size, once-only summaries, nothing per tick
P.sliceAsserts = (h, evs, o = {}) => {
  const tac = evs.filter(e => P.TACTICS.test(e.type));
  const bad = P.check(evs);
  bad.slice(0, 12).forEach(b => h.log('  contract: ' + b));
  h.assert(bad.length === 0, `${o.name}: every event matches DESIGN §4 (${bad.length} problems)`);
  h.assert(evs.every(e => P.chars(e) <= ((e.type === 'survey' || e.type === 'pt_player') ? 4000 : 1500)), `${o.name}: every event ≤ 1500 chars`);
  for (const t of (o.once || [])) {
    const n = evs.filter(e => e.type === t || (e.type === 'enc' && e.d.enc === t)).length;
    h.assert(n === 1, `${o.name}: ${t} exactly once (got ${n})`);
  }
  return tac;
};

/* ---------- scripted runs (fixtures and slices) ---------- */
P.hasB = h => h.ev(() => !!(window.TAC && TAC.m2));
P.hasC = h => h.ev(() => !!(window.TAC && TAC.m3));
// log a §4 event only if the real emitter logged none of that kind since t0 (Team B / C not in the build)
P.standIn = (h, t0, type, data, standIns) => h.ev(([t0, type, data]) => {
  const evs = V12.ptKit.events().filter(e => e.t >= t0 && e.type === type && (type !== 'enc' || (e.d && e.d.enc === data.enc)));
  if (evs.length) return false;
  if (type === 'enc') { const rest = Object.assign({}, data); delete rest.enc; V12.enc(data.enc, rest); } else V12.log(type, data);
  return true;
}, [t0, type, data]).then(r => { if (r && standIns) standIns.push(type === 'enc' ? 'enc ' + data.enc : type); return r; });
const at = (h, x, z) => h.ev(([x, z]) => { const p = ENGINE.player.position; p.x = x; p.z = z; }, [x, z]);
const press = async (h, ms = 450) => { await h.ev(() => tryInteract()); await h.step(ms); };
// the alarm and its read, through the kernel's fallback watcher when no tactics module watches KC
P.kcAlarm = async (h, why, visibleSecs) => {
  const own = await h.ev(why => {
    const ws = TAC.sight.watchers(); let w = ws.find(x => x.cfg.id === 'kc');
    const own = !w;
    if (!w) w = TAC.sight.watch({ id:'kc', enc:'m2_kc', mesh:ENGINE._marketKC, eyeH:1.5, range:{ lit:12, dark:6 }, hearing:0.6, surface:'on the street',
      active:() => !CHASE.active, logExtra:() => ({ phase:'lookup', scanned:!!S.game._marketScanned, post:'van' }) });
    if (own) { w.reset(100, { cause:'sight', why }); window.__ptKcW = w; }
    return own;
  }, why);
  if (own) {
    await P.eye(h, why);
    await h.ev(s => __wf.run(s), visibleSecs);
    await P.eye(h, null);
    await h.ev(() => { if (window.__ptKcW){ window.__ptKcW.reset(0); window.__ptKcW.unwatch(); window.__ptKcW = null; } if (typeof setEye === 'function') setEye(null); });
    await h.step(100);
  }
  return own;
};
// M2 from the van to the van. style 'sneaky' (P1) or 'direct' (P2)
P.driveM2 = async (h, o = {}) => {
  const standIns = o.standIns || [];
  const t0 = await P.mark(h);
  const sneaky = o.style !== 'direct';
  // misses: P2 taps just out of reach of Tunde, three times in a row (coalesced)
  if (!sneaky) { await at(h, -6, 1.4); for (let i = 0; i < 3; i++) await h.ev(() => tryInteract()); await h.step(300); }
  await P.play(h, sneaky ? 35 : 20);
  // Tunde
  await at(h, -6, -0.4);
  await press(h, 300);
  for (let i = 0; i < 6; i++) { const r = await T.finishDialogue(h); if (r === 'choice') { await T.choose(h, sneaky ? 0 : 1); continue; } break; }
  await h.step(200);
  await P.standIn(h, t0, 'enc', { enc:'m2_tunde', side:sneaky ? 'stall' : 'road', seen:!sneaky, dist:sneaky ? 13.1 : 9.4, ang:sneaky ? 118 : 22, bark:!sneaky,
    choice:sneaky ? 'quiet' : 'loud', tip:sneaky, habit:sneaky, wary:!sneaky }, standIns);
  if (sneaky) await P.standIn(h, t0, 'order', { who:'uche', order:'post', post:'corner', prev:'van', withTip:true, src:'talk', ok:true, def:false, obj:'o2_scan', t:21.4 }, standIns);
  // stuck at the scan (P1): two minutes of play with no progress, seen by the logger's own sampler
  if (sneaky) {
    await h.ev(() => { showOverlay(null); ENGINE.movementEnabled = true; const S0 = V12._ptState; S0.lastProg = S0.play - 120000; S0.stuckAt = 0; S0.sig = progressSig(); });
    await at(h, 2, 0);
    await h.step(2600);
    await P.play(h, 150);
  }
  // the phone: the document opens (ov_dwell), then it is solved
  await at(h, 6.4, 4.2);
  await press(h, 300);
  await h.step(sneaky ? 1600 : 900);
  // the phone unlock (a field-skill mini-game) is won, then the document opens; it is solved by the driver
  await h.ev(() => { if (typeof MINI !== 'undefined' && MINI.active) miniClose({ ok:true, won:true }); });
  await h.step(sneaky ? 1400 : 700);
  await h.ev(() => { showOverlay(null); ENGINE.movementEnabled = true; if (!S.game._marketScanned) { S.game._marketScanned = true; completeObjective('o2_scan'); } });
  await h.step(200);
  standIns.includes('document solved') || standIns.push('document solved');
  await P.play(h, sneaky ? 40 : 25);
  // the alarm and its read (KC's watcher)
  if (sneaky) await P.kcAlarm(h, 'He saw you crossing the open road, standing', 2.6);
  else { await P.kcAlarm(h, 'He saw you crossing the open road, standing', 0.7); await h.step(300); await P.kcAlarm(h, 'He saw you crossing the open road, standing', 0.6); }
  // P1: the scanned phone keeps stealing the press at the counter (wrong target ×3)
  if (sneaky) { await at(h, 5.8, 4.6); for (let i = 0; i < 3; i++) await press(h, 450); }
  // the confront: from the side (P1) or the front (P2); today's chase, then a tackle
  await h.ev(() => { showOverlay(null); ENGINE.movementEnabled = true; });
  await at(h, sneaky ? 8 : 6.0, sneaky ? 6.3 : 5.4);
  await press(h, 500);
  const chased = await h.ev(() => !!CHASE.active);
  if (chased) {
    await T.pursue(h, { strategy:'follow', maxT:40, v:sneaky ? 5.2 : 4.8 });
    await h.step(400);
    for (let i = 0; i < 6; i++) { const r = await T.finishDialogue(h); if (r === 'choice') { await T.choose(h, 0); continue; } break; }
  }
  await h.step(300);
  await P.play(h, sneaky ? 30 : 45);
  if (sneaky) await P.standIn(h, t0, 'ally_done', { who:'uche', task:'veer', outcome:'done', post:'corner', secs:3.2 }, standIns);
  await P.standIn(h, t0, 'enc', { enc:'m2_kc', approach:sneaky ? 'soft' : 'seen', intent:sneaky ? 'stealth' : 'direct', susp:sneaky ? 28 : 100, level:sneaky ? 'notice' : 'alarm',
    exposed:!sneaky, gap:sneaky ? 2.3 : 2.0, scanSeen:false, side:sneaky ? 'side' : 'front', outcome:'caught', how:'tackle', secs:sneaky ? 6.1 : 9.8, bumps:sneaky ? 0 : 2, bumpsLane:sneaky ? 0 : 1,
    trust:sneaky ? 3 : 1, cutReached:false, ribbon:'off', prep:{ tip:sneaky, habit:sneaky, post:sneaky ? 'corner' : 'van', posted:sneaky, pursuit:false, tier:1, greyman:false, sources:false },
    uche:{ post:sneaky ? 'corner' : 'van', arrived:sneaky, role:sneaky ? 'veer' : null } }, standIns);
  // the van: the summary, then the silent completion and M3
  await P.standIn(h, t0, 'm2_summary', { kc:'caught', how:'tackle', approach:sneaky ? 'soft' : 'seen', scanSeen:false, alarms:sneaky ? 1 : 2, notices:sneaky ? 1 : 2, suspPeak:100,
    eyeSecs:sneaky ? 6.4 : 3.1, crouchNearSecs:sneaky ? 7.5 : 0, watchSecs:sneaky ? 61 : 44, tunde:{ side:sneaky ? 'stall' : 'road', seen:!sneaky, choice:sneaky ? 'quiet' : 'loud', tip:sneaky, habit:sneaky },
    post:sneaky ? 'corner' : 'van', posted:sneaky, ucheArrived:sneaky, ucheRole:sneaky ? 'veer' : null, chase:{ secs:sneaky ? 6.1 : 9.8, bumps:sneaky ? 0 : 2, bumpsLane:sneaky ? 0 : 1, trust:sneaky ? 3 : 1, cutsShown:0, cutReached:false, cutoff:false, ribbon:'off' },
    trust:sneaky ? 6 : -1, secs:sneaky ? 412 : 268, caps:{ pursuit:false, greyman:false, sources:false, tier:1 }, diff:{ casework:'senior', pace:'standard' }, hints:[], build:'stand-in',
    intent:sneaky ? 'stealth' : 'direct', wary:!sneaky, ribbon:'off' }, standIns);
  await h.ev(() => { if (!S.game.moralChoices.market_runner) S.game.moralChoices.market_runner = 'caught'; const o3 = S.game.objectives.find(x => x.id === 'o3_runner' && !x.done); if (o3) completeObjective('o3_runner'); });
  // the operations table: open it, ink the links (the driver completes the objective), close it
  await h.ev(() => { showOverlay(null); if (typeof V12.openOps === 'function') V12.openOps(); });
  await h.step(sneaky ? 2200 : 1200);
  await h.ev(() => { if (typeof V12.closeOps === 'function') V12.closeOps(); showOverlay(null); ENGINE.movementEnabled = true; const o4 = S.game.objectives.find(x => x.id === 'o4_table' && !x.done); if (o4) completeObjective('o4_table'); });
  standIns.includes('links inked') || standIns.push('links inked');
  await h.step(300);
  await at(h, 0, 12.5);
  await press(h, 900);
  // the van still wants three links that hold on the table: the driver boards it the way the van does
  if (await h.ev(() => S.game.currentMission === 'm2')) await h.ev(() => { showOverlay(null); completeMission('m2', { silent:true }); loadMission('m3'); });
  await h.step(900);
  return standIns;
};
// M3, legacy house (P2: a loud entry, then a grab while he's stunned)
P.driveM3 = async (h, o = {}) => {
  const standIns = o.standIns || [];
  const t0 = await P.mark(h);
  await h.ev(() => { if (document.querySelector('#screen-controls.show')) beginMission('m3'); });
  await h.step(600);
  for (let i = 0; i < 6; i++) { const r = await T.finishDialogue(h); if (r === 'choice') { await T.choose(h, 0); continue; } break; }
  await h.ev(() => { showOverlay(null); ENGINE.movementEnabled = true; });
  await h.step(300);
  await P.play(h, 190);
  await P.standIn(h, t0, 'enc', { enc:'m3_entry', entry:'loud', door:'front', power:'on', uche:'with', leak:false, armed:true, spawn:[0.35, 4.6], wipeTotal:55, variant:'legacy',
    prep:{ sims:false, kcFair:false, tip:false, civ:false, warrant:'signed' }, def:{ entry:false, power:true } }, standIns);
  await P.standIn(h, t0, 'enc', { enc:'m3_obi', outcome:'stun_grab', by:'kelechi', alertedBy:'loud', secs:4.2, runSecs:0, ranM:0, dist:1.3, duringMinigame:false,
    states:[['stunned', 0], ['grabbed', 4.2]], ucheJob:null, prep:{ sims:false, kcFair:false } }, standIns);
  await P.standIn(h, t0, 'enc', { enc:'m3_laptop', outcome:'halted', pct:34, files:5, ledger:true, total:7, firstAt:22.5, armedAt:0, mg:{ strikes:1, secs:9.1, yank:false } }, standIns);
  await P.standIn(h, t0, 'enc', { enc:'m3_child', choice:'gentle', by:'kelechi', calm:false, outAt:71.2, gentle:true }, standIns);
  await P.standIn(h, t0, 'm3_summary', { entry:'loud', door:'front', power:'on', uche:'with', spawn:'front', obi:{ first:'stunned', alertedBy:'loud', alertedAt:0, outcome:'stun_grab', by:'kelechi', arrest:'professional' },
    seen:{ notices:0, alarms:0, evaded:0, causes:{ sight:0, noise:0, close:0 } }, crouchSecs:0, wipe:{ armed:true, outcome:'halted', pct:34, files:5, total:7 },
    child:{ choice:'gentle', out:true, by:'kelechi' }, uche:{ orders:[], acts:[] }, extract:{ refusals:0, missing:[] }, prep:{ sims:false, kcFair:false, tip:false, tipped:false, warrant:'signed' },
    secs:188, force:0, trust:2, grade:'B', diff:{ casework:'senior', pace:'standard' }, hints:[], build:'stand-in' }, standIns);
  return standIns;
};
P.survey = async (h, a1, a2) => {
  await h.ev(() => { V12.ptSurvey('slice:m3'); });
  await h.step(150);
  await h.ev(([a1, a2]) => { document.getElementById('pt-a1').value = a1; document.getElementById('pt-a2').value = a2; document.getElementById('pt-save').click(); }, [a1, a2]);
  await h.step(200);
};
P.exportTo = async (h, file, o = {}) => {
  await P.stubSave(h);
  if (o.share) await P.stubShare(h, 'ok');
  await h.ev(o => V12.ptExport({ player:o.player || null }), o);
  await h.step(300);
  let body, name;
  if (o.share) { const t = await P.sharedText(h); body = t[t.length - 1][0]; name = (await h.ev(() => window.__shared))[0][0].name; }
  else { const s = await h.ev(() => window.__saved); body = s[s.length - 1].data; name = s[s.length - 1].name; }
  fs.mkdirSync(path.dirname(file), { recursive:true });
  fs.writeFileSync(file, body);
  return name;
};

/* ---------- fixture generation (PT_FIXTURES=A|B|C) ---------- */
P.README = `# Playtest analyser fixtures (Team D)

Generated, never edited by hand (except \`broken.json\`, a deliberately truncated file). Each log is the real logger's
output from a scripted run of the build named below, exported through \`V12.ptExport\` (the phone one through the share
sheet, as \`.txt\`). Regenerate with \`tools/harness/scenarios/pt_lib.cjs\` (see its header).

Where Team B's market or Team C's mansion emitters were not in the build, the driver logged their DESIGN §4-shaped events
itself, only when the real emitter logged nothing ("standIns" below). After B and C merge, regenerate: the real events then
replace every stand-in, and \`pt_report_core\` must still pass.

- \`deviceA-desk.json\` / \`deviceA-desk-early.json\`: one desktop device, P1, exported twice (the early export is a
  subset: the dedupe case).
- \`deviceB-phone.txt\`: one phone, P2, shared as text.
- \`deviceC-old.json\`: a v1 log, from the logger without the tactics layer.
- \`broken.json\`: not a playtest log (the CLI skips it).
`;
P.generate = async (h, which) => {
  fs.mkdirSync(P.FIX, { recursive:true });
  const notes = {};
  const manifest = path.join(P.FIX, 'README.md');
  let prev = {};
  try { const m = fs.readFileSync(manifest, 'utf8').match(/```json\n([\s\S]*?)\n```/); if (m) prev = JSON.parse(m[1]); } catch (e) {}
  const build = await h.ev(() => (window.NACECA_BUILD || {}).src || null);
  if (which === 'C') {
    // a v1 log: the logger without the tactics layer (build without src/tactics)
    h.assert(await h.ev(() => !V12.ptKit), 'PT_FIXTURES=C wants a build without the tactics layer');
    await T.start(h, 'm2', { seed:3 });
    await at(h, -6, -0.4); await press(h, 300);
    await T.finishDialogue(h); await T.choose(h, 0); await T.finishDialogue(h);
    await at(h, 6.4, 4.2); await h.ev(() => { S.game._marketTunde = false; }); await press(h, 500); await h.ev(() => { S.game._marketTunde = true; });
    await h.ev(() => { showOverlay(null); ENGINE.movementEnabled = true; const S0 = V12._ptState; S0.play += 140000; if (S0.o) S0.o.t0 = S0.play - 140000; });
    await h.step(1200);
    await h.ev(() => { const S0 = V12._ptState; S0.o = S0.o || { id:'o2_scan', t0:0 }; S0.o.t0 = S0.play - 140000; window.dispatchEvent(new Event('pagehide')); });
    await h.step(200);
    await P.stubSave(h);
    await h.ev(() => V12.ptExport());
    await h.step(300);
    const s = await h.ev(() => window.__saved);
    fs.writeFileSync(path.join(P.FIX, 'deviceC-old.json'), s[s.length - 1].data);
    notes.C = { file:'deviceC-old.json', build, what:'v1 log (no tactics layer): Tunde, a refused scan, a quit 140 s into o2_scan', standIns:[] };
  } else if (which === 'A') {
    await T.start(h, 'm2', { seed:11 });
    await h.ev(() => { localStorage.removeItem('naceca_pt_v1'); V12.ptKit.clear(); });
    await h.ev(() => V12.ptKit.player('P1'));
    await h.ev(() => { if (typeof openNewGameSheet === 'function') { openNewGameSheet(); const go = document.querySelector('#screen-newgame [data-act="go"]'); if (go) { const startNI = window.startNewInvestigation; window.startNewInvestigation = () => {}; go.click(); window.startNewInvestigation = startNI; } } showOverlay(null); });
    await T.start(h, 'm2', { seed:11 });
    const standIns = [];
    await P.driveM2(h, { style:'sneaky', standIns });
    const early = await P.exportTo(h, path.join(P.FIX, 'deviceA-desk-early.json'));
    await h.step(200);
    await P.survey(h, 'Posting Uche at the corner before I went in', 'The phone kept taking my button when I wanted KC');
    await h.step(200);
    const name = await P.exportTo(h, path.join(P.FIX, 'deviceA-desk.json'));
    notes.A = { file:'deviceA-desk.json', early:'deviceA-desk-early.json', exportName:name, earlyName:early, build, what:'desktop P1: sneaky M2 (stuck at the scan, wrong target ×3, one alarm read 2.6 s, Tunde quiet + tip, Uche posted at the corner and veered), the two questions', standIns };
  } else if (which === 'B') {
    await T.start(h, 'm2', { seed:12 });
    await h.ev(() => { localStorage.removeItem('naceca_pt_v1'); V12.ptKit.clear(); });
    await h.ev(() => V12.ptKit.player('P2'));
    await h.ev(() => { if (typeof openNewGameSheet === 'function') { openNewGameSheet(); const go = document.querySelector('#screen-newgame [data-act="go"]'); if (go) { const startNI = window.startNewInvestigation; window.startNewInvestigation = () => {}; go.click(); window.startNewInvestigation = startNI; } } showOverlay(null); });
    await T.start(h, 'm2', { seed:12 });
    const standIns = [];
    await P.driveM2(h, { style:'direct', standIns });
    await P.driveM3(h, { standIns });
    await P.survey(h, 'Kicking the door in', 'KC saw me even though I was behind the stall');
    await h.ev(() => { const S0 = V12._ptState; S0.o = S0.o || { id:null, t0:0 }; S0.o.t0 = S0.play - 95000; window.dispatchEvent(new Event('pagehide')); });
    await h.step(200);
    const name = await P.exportTo(h, path.join(P.FIX, 'deviceB-phone.txt'), { share:true, player:'P2' });
    notes.B = { file:'deviceB-phone.txt', exportName:name, build, what:'phone P2: three taps just out of reach, Tunde loud, two alarms on screen under 1 s, a front confront and a tackle, the ops table, a loud M3 entry, an unfair answer about being seen, a quit right after the questions', standIns };
  } else throw new Error('PT_FIXTURES must be A, B or C');
  fs.writeFileSync(manifest, P.README + '\n```json\n' + JSON.stringify(Object.assign(prev, notes), null, 1) + '\n```\n');
  h.log('fixtures written: ' + JSON.stringify(notes));
};

module.exports = P;
