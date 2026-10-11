#!/usr/bin/env node
// NACECA · the playtest report, offline (Team D).
//
//   node tools/pt_report.cjs <file|folder>... [--player B7QX·P3] [--slice m2,h2,m3] [--around 2026-10-17T14:32]
//                            [--detail] [--json out.json] [--md out.md]
//
// Reads exported playtest logs (the desktop .json, or the .txt the phone's share sheet sends; folders are read
// one level deep) and prints the four answers per player, then across players. A file that isn't a playtest log is
// skipped with a line saying why. Players are keyed by device + label (B7QX·P3); the same event exported twice
// counts once. The answers come from src/tactics/tac_pt_report.js, the same code the in-game sheet runs.
//
// Exit code: 0, also when files were skipped; 2 when no events were found. No network, no dependencies:
// fs, path and vm only.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');

const argv = process.argv.slice(2);
const FLAGS = { player:1, slice:1, around:1, json:1, md:1, detail:0, help:0 };
const opt = {}, inputs = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith('--')) {
    const k = a.slice(2).split('=')[0], inline = a.includes('=') ? a.slice(a.indexOf('=') + 1) : null;
    if (!(k in FLAGS)) { console.error('unknown option ' + a); process.exit(1); }
    opt[k] = FLAGS[k] ? (inline != null ? inline : argv[++i]) : true;
  } else inputs.push(a);
}
if (opt.help || !inputs.length) {
  console.log('usage: node tools/pt_report.cjs <file|folder>... [--player B7QX·P3] [--slice m2,h2,m3] [--around YYYY-MM-DDTHH:MM] [--detail] [--json out.json] [--md out.md]');
  process.exit(inputs.length || opt.help ? 0 : 2);
}

// the shared analyser, loaded with vm (the repo root's package.json is "type":"module", so it can't be required)
const SRC = path.join(__dirname, '..', 'src', 'tactics', 'tac_pt_report.js');
const box = {};
vm.runInNewContext(fs.readFileSync(SRC, 'utf8'), box, { filename:SRC });
const R = box.PT_REPORT;
if (!R) { console.error('the analyser did not load: ' + SRC); process.exit(1); }

// inputs: files and folders (one level), .json and .txt
const files = [];
for (const a of inputs) {
  let st = null; try { st = fs.statSync(a); } catch (e) {}
  if (!st) { console.log('skip (not a playtest log): ' + a + ' — no such file or folder'); continue; }
  if (st.isDirectory()) fs.readdirSync(a).filter(f => /\.(json|txt)$/i.test(f)).sort().forEach(f => files.push(path.join(a, f)));
  else files.push(a);
}
let all = [];
for (const f of files) {
  let raw;
  try { raw = fs.readFileSync(f, 'utf8'); } catch (e) { console.log('skip (not a playtest log): ' + f + ' — ' + e.message); continue; }
  const p = R.parse(raw, path.basename(f));
  if (!p.ok) { console.log('skip (not a playtest log): ' + f + ' — ' + p.reason); continue; }
  all = all.concat(R.normalize(p));
}
all = R.dedupe(all);
if (opt.slice) {
  const keep = new Set(String(opt.slice).split(',').map(s => s.trim()).filter(Boolean));
  all = all.filter(e => keep.has(e.m) || ['survey', 'pt_player', 'session'].includes(e.type));
}
if (!all.length) { console.log('No playtest events found.'); process.exit(2); }

let players = R.players(all);
if (opt.player) {
  players = players.filter(p => R.matchPlayer(p, opt.player));
  if (!players.length) { console.log('No player matches ' + opt.player + '. Players: ' + R.players(all).map(p => p.name).join(', ')); process.exit(2); }
}

// device-local time: each session records tz (getTimezoneOffset, minutes); fall back to this machine's zone
const tzBySid = {};
for (const e of all) if (e.type === 'session' && e.d && typeof e.d.tz === 'number') tzBySid[e.sid] = e.d.tz;
// the session's tz, else the zone the export was written in (its local ISO time), else this machine's
const local = e => { const tz = e.sid in tzBySid ? tzBySid[e.sid] : e._tz != null ? e._tz : new Date(e.t).getTimezoneOffset(); return new Date(e.t - tz * 60000); };   // read with getUTC*
const two = n => String(n).padStart(2, '0');
const stamp = e => { const d = local(e); return `${d.getUTCFullYear()}-${two(d.getUTCMonth() + 1)}-${two(d.getUTCDate())} ${two(d.getUTCHours())}:${two(d.getUTCMinutes())}:${two(d.getUTCSeconds())}`; };

const out = [];
const line = s => console.log(s);
if (opt.around) {
  const m = String(opt.around).match(/^(?:(\d{4})-(\d{2})-(\d{2})[T ])?(\d{1,2}):(\d{2})$/);
  if (!m) { console.error('--around wants YYYY-MM-DDTHH:MM (or HH:MM)'); process.exit(1); }
  const day = m[1] ? `${m[1]}-${m[2]}-${m[3]}` : null, mins = +m[4] * 60 + +m[5];
  let n = 0;
  for (const p of players) {
    const hit = p.events.filter(e => {
      const d = local(e), dd = `${d.getUTCFullYear()}-${two(d.getUTCMonth() + 1)}-${two(d.getUTCDate())}`;
      return (!day || dd === day) && Math.abs(d.getUTCHours() * 60 + d.getUTCMinutes() - mins) <= 1;
    });
    if (!hit.length) continue;
    line(`\n${p.name} around ${opt.around} (device time):`);
    hit.forEach(e => { n++; line(`  ${stamp(e)} ${(e.m || '--').padEnd(4)} ${e.type.padEnd(16)} ${JSON.stringify(e.d || {}).slice(0, 140)}`); });
  }
  if (!n) line(`No events within a minute of ${opt.around}.`);
  process.exit(0);
}

const ctx = { txt:R.objTexts(all) };   // objective names from every loaded log
for (const p of players) {
  const res = R.analyze(p.events, ctx);
  out.push({ name:p.name, dev:p.dev, label:p.label, res });
  line('\n' + '='.repeat(78));
  R.text(res, p.name).forEach(line);
  if (opt.detail) {
    const det = p.events.filter(e => e.type === 'enc' || /_summary$/.test(e.type) || ['order', 'ally_done', 'radio', 'tac_mission', 'geo_drift', 'seen_read', 'pt_dropped'].includes(e.type));
    if (det.length) { line(''); line('DETAIL'); det.forEach(e => line(`  ${stamp(e)} ${(e.m || '--').padEnd(4)} ${e.type} ${JSON.stringify(e.d || {})}`)); }
  }
}
const A = out.length > 1 ? R.across(out) : null;
if (A) { line('\n' + '='.repeat(78)); R.acrossText(A).forEach(line); }
if (opt.json) fs.writeFileSync(opt.json, JSON.stringify({ players:out.map(o => ({ name:o.name, dev:o.dev, label:o.label, res:o.res })), across:A }, null, 1));
if (opt.md) fs.writeFileSync(opt.md, R.markdown(out, A));
process.exit(0);
