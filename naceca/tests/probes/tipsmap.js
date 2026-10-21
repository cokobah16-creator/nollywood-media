global.window = global; global.DIALOGUE = {}; global.PUZZLES = {}; global.V12 = { DOCS: {} };
global.S = { game:{ moralChoices:{}, s2:{}, evidence:[], evQ:{}, flags:{} }, player:{ reputation:{ integrity:60, publicTrust:55, agencyFavour:50, underworldHeat:20 } } };
for (const f of ['s2_dlg_a.js', 's2_dlg_b.js', 's2_dlg_c.js']) require(require('path').join(__dirname, '..', '..', 'src', 'season2', f));
const V13 = global.V13;
for (const [k, L] of Object.entries(V13.TIPS)) { console.log('TIPS', k, L.length); L.slice(0, 3).forEach(t => console.log('   ', JSON.stringify(t).slice(0, 220))); }
for (const [k, L] of Object.entries(V13.PHONE)) { console.log('PHONE', k, L.length); L.slice(0, 2).forEach(t => console.log('   ', JSON.stringify(t).slice(0, 220))); }
console.log('AFTER', Object.keys(V13.AFTER), JSON.stringify(V13.AFTER.m9).slice(0, 300));
console.log('C', Object.keys(V13.C || {}), 'CAND', JSON.stringify(V13.S2_CANDIDATES).slice(0, 300));
