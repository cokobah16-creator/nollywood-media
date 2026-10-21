// node tests/probes/dlgmap.js <prefix> : list dialogue keys with their choices (flags, next)
global.window = global; global.DIALOGUE = {}; global.PUZZLES = {}; global.V12 = { DOCS: {} };
global.S = { game:{ moralChoices:{}, s2:{}, evidence:[], evQ:{}, flags:{} }, player:{ reputation:{ integrity:60, publicTrust:55, agencyFavour:50, underworldHeat:20 } } };
for (const f of ['s2_dlg_a.js', 's2_dlg_b.js', 's2_dlg_c.js']) require(require('path').join(__dirname, '..', '..', 'src', 'season2', f));
const pre = process.argv[2] || 'm9_';
for (const k of Object.keys(DIALOGUE).filter(k => k.startsWith(pre))) {
  const L = DIALOGUE[k]; const ch = L.filter(l => l.choices);
  const sp = [...new Set(L.map(l => l.speaker))].join(', ');
  console.log(`${k} [${L.length}] ${sp}`);
  for (const l of ch) for (const c of l.choices) console.log(`    · ${c.text.slice(0, 70)}  ${c.flag ? JSON.stringify(c.flag) : ''} ${c.next ? '→ ' + c.next : ''} ${c.trace != null ? 'trace ' + c.trace : ''}`);
}
console.log('PUZZLES:', Object.keys(PUZZLES).filter(k => k.startsWith(pre)).join(', '));
