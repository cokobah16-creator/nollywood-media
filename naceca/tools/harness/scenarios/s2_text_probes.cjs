// Season 2 · stale probe strings (fix team "text", TX5). A static scan, no gameplay: the fix pass renamed
// on-screen strings that the Season 2 probes wait for (docs/season2/CASES.md section 6, "The on-screen strings a
// probe may wait for"). A probe that waits for a string the game no longer shows never finds it, and the kit's
// until() helpers return false without failing, so the probe walks on and still reports "0 scenario errors".
// This flags any Season 2 probe or scenario that names an old string but not its new one (a probe that accepts
// both, e.g. /COMMANDER (OSAGIE|OKUNDAYE)/, or that asserts the old string is gone next to the new one, passes;
// comment lines, and a line that asserts the old strings are absent and says so with "// renamed: absent", are skipped).
//   node tools/harness/run.cjs tools/harness/scenarios/s2_text_probes.cjs --html <build>/naceca.html
// Scanned: tests/probes/*.js, tools/harness/scenarios/s2_*.cjs (not the text lints themselves), and every
// directory in KIT_PROBES (a colon list, e.g. the shared kit's probes/ folder).
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..', '..');

// [label, old string, the new one that must sit beside it]
const PAIRS = [
  ['speaker', /COMMANDER OSAGIE/, /OKUNDAYE/],
  ['speaker', /MAMA EFE/, /MAMA TEGA/],
  ['epilogue', /Grace Osagie kept your drive/, /Okundaye kept your drive/],
  ['epilogue', /Hauwa Danladi prosecuted/, /Zainab Danladi prosecuted/],
  ['names', /Cdr\.? (G\.|Grace) Osagie/, /Itohan Okundaye|Cdr\.? I\. Okundaye/],
  ['names', /Barr\.? (H\.|Hauwa) Danladi/, /Zainab Danladi|Barr\.? Z\. Danladi/],
  ['choice', /Commander Osagie for that/, /Commander Okundaye for that/],
  ['choice', /Inspector Okon/, /Inspector Asuquo/],
  ['radio', /Straight for the blue kiosk/, /He's coming in\./],
  ['court', /a black SUV that has been idling/, /a black Prado that has been idling/],
  ['sign', /GRACE PURE WATER|EFE & SONS/, /CLEAR DROP PURE WATER|IGHO & SONS/],
  ['cause list', /KESTREL LOGISTICS/, /ADEJO-IKIME HAULAGE/],
];
const SELF = new Set(['s2_text_lint.cjs', 's2_text_probes.cjs']);

function filesIn(dir, re) {
  try { return fs.readdirSync(dir).filter(f => re.test(f) && !SELF.has(f)).map(f => path.join(dir, f)); } catch (e) { return []; }
}

module.exports = async function (h) {
  const files = [
    ...filesIn(path.join(ROOT, 'tests', 'probes'), /\.js$/),
    ...filesIn(path.join(ROOT, 'tools', 'harness', 'scenarios'), /^s2_.*\.cjs$/),
  ];
  const kit = (process.env.KIT_PROBES || '').split(':').filter(Boolean);
  for (const d of kit) files.push(...filesIn(path.resolve(d), /\.js$/));
  h.assert(files.length >= 10, 'probe files found: ' + files.length);
  h.log(`scanning ${files.length} probe files` + (kit.length ? ` (with ${kit.join(', ')})` : ''));
  const bad = [];
  for (const f of files) {
    // comment lines, and lines marked "// renamed: absent" (a check that the old string is gone), are not waits
    const lines = fs.readFileSync(f, 'utf8').split('\n').map(l => (/^\s*(\/\/|\/?\*)/.test(l) || /\/\/ renamed: absent/.test(l)) ? '' : l);
    const src = lines.join('\n');
    for (const [label, oldRe, newRe] of PAIRS) {
      if (!oldRe.test(src) || newRe.test(src)) continue;
      const line = lines.findIndex(l => oldRe.test(l)) + 1;
      bad.push(`${path.relative(ROOT, f).startsWith('..') ? f : path.relative(ROOT, f)}:${line} [${label}] waits for "${src.match(oldRe)[0]}" and never for the new string`);
    }
  }
  bad.forEach(b => h.log('  FLAG ' + b));
  h.log(`s2_text_probes: ${bad.length} flagged`);
  h.assert(bad.length === 0, `${bad.length} probes wait for renamed strings (see FLAG lines; the new strings are in CASES.md section 6)`);
};
