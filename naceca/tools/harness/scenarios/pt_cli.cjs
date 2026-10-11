// pt_cli (Team D): node tools/pt_report.cjs, offline, on a folder of exported logs: files captured from the page in
// this run (V12.ptExport), the analyser fixtures and a broken file.
//   node tools/harness/run.cjs tools/harness/scenarios/pt_cli.cjs --html <build>/naceca.html
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const P = require('./pt_lib.cjs');
module.exports = async h => {
  const CLI = path.join(P.ROOT, 'tools', 'pt_report.cjs');
  const run = (...args) => { const r = cp.spawnSync(process.execPath, [CLI, ...args], { encoding:'utf8', cwd:P.ROOT, timeout:60000 }); return { code:r.status, out:(r.stdout || '') + (r.stderr || '') }; };
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pt_cli_'));
  const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'pt_cli_empty_'));
  try {
    // a log captured from the page: a player, a few real events, exported through V12.ptExport (desktop path)
    await P.T.start(h, 'm2', { seed:31 });
    await h.ev(() => { localStorage.removeItem('naceca_pt_v1'); V12.ptKit.clear(); V12.ptKit.player('P1'); });
    await h.ev(() => { const p = ENGINE.player.position; p.x = 40; p.z = 40; tryInteract(); });
    await h.ev(() => { const p = ENGINE.player.position; p.x = -6; p.z = -0.4; tryInteract(); });
    await h.step(400);
    await P.T.finishDialogue(h); await P.T.choose(h, 0); await P.T.finishDialogue(h);
    await h.ev(() => { showOverlay(null); toast('NOT YET', 'pt_cli gate', 400); });
    await h.step(300);
    await h.ev(() => { document.body.classList.remove('touch-active'); });
    const pageName = await P.exportTo(h, path.join(tmp, 'page-export.json'));
    const pageDev = await h.ev(() => V12.ptKit.device());
    h.log('page export', pageName, pageDev);
    h.assert(/^naceca-playtest-[A-Z0-9]{4}-ALL-\d{8}-\d{4}\.json$/.test(pageName), 'the page exported ' + pageName);
    for (const f of ['deviceA-desk.json', 'deviceA-desk-early.json', 'deviceB-phone.txt', 'deviceC-old.json', 'broken.json']) fs.copyFileSync(path.join(P.FIX, f), path.join(tmp, f));
    fs.writeFileSync(path.join(tmp, 'notes.txt'), 'facilitator notes, not a log');

    // the whole folder
    let r = run(tmp);
    h.log(r.out.split('\n').filter(l => /^(skip|=|[A-Z0-9]{4}·|ACROSS)/.test(l) || /·/.test(l.slice(0, 12))).slice(0, 14).join('\n'));
    h.assert(r.code === 0, 'exit 0 (also with skipped files): ' + r.code);
    h.assert(/^skip \(not a playtest log\): .*broken\.json — not JSON/m.test(r.out) && /^skip \(not a playtest log\): .*notes\.txt — /m.test(r.out), 'a skip line for broken.json (and a note file)');
    // D-11: the skip reason is clipped before its closing parenthesis
    const skipB = r.out.split('\n').find(l => /broken\.json — /.test(l)) || '', why = skipB.replace(/^.*? — /, '');
    h.assert((why.match(/\(/g) || []).length === (why.match(/\)/g) || []).length && /\)$/.test(why), 'the skip line\'s parentheses close: ' + skipB);
    const heads = ['WHERE DID THEY GET LOST?', 'WHICH INTERACTIONS FAILED?', 'DID THEY UNDERSTAND WHY THEY WERE SEEN?', 'DID THEY USE MORE THAN ONE APPROACH?'];
    const blocks = r.out.split('='.repeat(78)).slice(1);
    const players = blocks.filter(b => !/^\s*ACROSS/.test(b));
    h.assert(players.length === 4, 'four players (page P1, the fixtures\' P1 and P2, the v1 log; the two exports of one device are one player): ' + players.length);
    h.assert(players.every(b => heads.every(q => b.includes(q))), 'each player has the four headings');
    h.assert(players.some(b => b.trim().startsWith(pageDev + '·P1 · ')), 'the page\'s player prints as dev·label');
    // D-8: every per-player export names its build (from the export header: CLEAR removed the session event)
    const fxA = JSON.parse(P.fixture('deviceA-desk.json')), pa = players.find(b => b.trim().startsWith(fxA.dev + '·P1 · '));
    h.assert(pa && pa.split('\n').find(l => l.trim()).includes('build ' + fxA.src) && players.every(b => / · build \S+/.test(b.split('\n').find(l => l.trim()))), 'every player\'s lead line names the build ' + (pa || '').trim().split('\n')[0]);
    h.assert(blocks.some(b => /^\s*ACROSS 4 PLAYERS/.test(b)), 'ACROSS N PLAYERS');
    h.assert(/LIKELY UNDERSTOOD/.test(r.out) && /ASK THEM/.test(r.out) && /No detection data in this build/.test(r.out), 'the stamps and the v1 answer');

    // --player dev·label prints one player
    const fxDev = JSON.parse(P.fixture('deviceB-phone.txt')).dev;
    r = run(tmp, '--player', fxDev + '·P2');
    let pb = r.out.split('='.repeat(78)).slice(1);
    h.assert(r.code === 0 && pb.length === 1 && pb[0].trim().startsWith(fxDev + '·P2 · ') && !/ACROSS/.test(r.out), '--player ' + fxDev + '·P2 prints one player');
    r = run(tmp, '--player', 'P1');
    pb = r.out.split('='.repeat(78)).slice(1).filter(b => !/^\s*ACROSS/.test(b));
    h.assert(pb.length === 2, '--player P1 matches the label on both devices (' + pb.length + ')');
    r = run(tmp, '--player', 'ZZZZ·P9');
    h.assert(r.code === 2 && /No player matches/.test(r.out), 'an unknown player exits 2');

    // --around: device-local date and time (from the session's tz)
    const A = JSON.parse(P.fixture('deviceA-desk.json')).events;
    const ss = A.find(e => e.type === 'session'), tz = ss && typeof ss.d.tz === 'number' ? ss.d.tz : 0;
    const ref = A.find(e => e.type === 'stuck') || A[Math.floor(A.length / 2)];
    const d = new Date(ref.t - tz * 60000), two = n => String(n).padStart(2, '0');
    const at = `${d.getUTCFullYear()}-${two(d.getUTCMonth() + 1)}-${two(d.getUTCDate())}T${two(d.getUTCHours())}:${two(d.getUTCMinutes())}`;
    r = run(tmp, '--around', at);
    h.log('--around ' + at + '\n' + r.out.split('\n').slice(0, 6).join('\n'));
    h.assert(r.code === 0 && new RegExp(' around ' + at).test(r.out) && r.out.includes(' ' + ref.type + ' '), '--around ' + at + ' prints the events either side');
    r = run(tmp, '--around', '1999-01-01T00:00');
    h.assert(r.code === 0 && /No events within a minute/.test(r.out), '--around a time with nothing logged');

    // --json and --md write files that parse; --slice and --detail
    const jf = path.join(tmp, 'out.json.out'), mf = path.join(tmp, 'out.md');
    r = run(tmp, '--json', jf, '--md', mf);
    const j = JSON.parse(fs.readFileSync(jf, 'utf8')), md = fs.readFileSync(mf, 'utf8');
    h.assert(r.code === 0 && Array.isArray(j.players) && j.players.length === 4 && j.players.every(p => p.res && p.res.detection && p.name) && j.across && j.across.players === 4, '--json writes {players, across}');
    h.assert(/^# NACECA playtest report/.test(md) && (md.match(/^## /gm) || []).length === 5 && md.includes('### Did they use more than one approach?'), '--md writes the report as Markdown');
    r = run(tmp, '--slice', 'm3', '--player', fxDev + '·P2', '--detail');
    h.assert(r.code === 0 && /DETAIL/.test(r.out) && /m3_summary/.test(r.out) && !/ m2 +enc /.test(r.out), '--slice m3 keeps M3 (and --detail prints the encounters)');

    // no network: the script requires none of http, https, net or dns
    const src = fs.readFileSync(CLI, 'utf8');
    h.assert(!/require\(\s*['"](node:)?(http|https|net|dns)['"]\s*\)/.test(src) && !/\bfetch\s*\(/.test(src), 'tools/pt_report.cjs requires no http, https, net or dns');
    // an empty folder exits 2
    r = run(empty);
    h.assert(r.code === 2 && /No playtest events found/.test(r.out), 'an empty folder exits 2');
    r = run();
    h.assert(r.code === 2, 'no input exits 2');
  } finally {
    fs.rmSync(tmp, { recursive:true, force:true }); fs.rmSync(empty, { recursive:true, force:true });
  }
  h.assert(h.errors.length === 0, 'no page errors');
};
