// Season 2 · text lint (fix team "text"). A static scan, no gameplay: every string literal, template literal
// and regex literal in src/season2/*.js, plus docs/season2/CASES.md, docs/season2/COURT.md and the Season 2
// section of docs/STORY-CANON.md. It asserts the absence of:
//   - the wrong agency name (ANTI-CYBERCRIME, "the anti-fraud agency"), "AKS", and '←' (no Season 2 text uses it);
//   - the old names of the binding rename table (PLAN.md §3.3): Osagie / Grace / G.O., Bassey Okon, Hauwa,
//     Danjuma, Oke, Coker-Odusote, Mama Efe, Tari, Ebi, Tamuno, Divine Grace, 4B / 4 Harbour Close,
//     PORT HARCOURT TIDE, FRN v Akaeze, Lagos Cybercrime;
//   - the old cars and plate (grey saloon / grey one / grey car / grey Corolla / Corolla, ABJ-418KD, black jeep,
//     black SUV), the upper-case GRACE / EFE of the painted signs, and KESTREL (a real company name);
//   - "kidnapping for ransom";
//   - any Season 2 date after 12 Sep 2026 still in September or October (CN03), outside the two visitor-book
//     rows canon keeps (30/09 and 09/10, canon.md CN03 §2), and the old season words (before Christmas, ...).
// Code ids are not player text and are skipped: property keys, cond strings, `who` / id / art / key fields,
// lower-case identifiers ('osagie', 'hauwa_neutral') and single upper-case tokens ('OSAGIE', the phone thread id).
// Doc lines inside <!-- lint:renames --> ... <!-- /lint:renames --> (the rename record) are skipped.
//   node tools/harness/run.cjs tools/harness/scenarios/s2_text_lint.cjs --html <build>/naceca.html
// LINT_SCOPE=text limits the source scan to the text team's files (s2_dlg_*, s2_court_data, s2_mtex_*).
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..', '..');
let acorn = null, walk = null;
try { acorn = require('/opt/node-tools/node_modules/acorn'); walk = require('/opt/node-tools/node_modules/acorn-walk'); } catch (e) {}

const RULES = [
  ['agency', /anti-?cybercrime/i], ['agency', /\banti-fraud\b/i], ['aks', /\bAKS\b/], ['arrow', /←/],
  ['name', /\bOsagie\b/i], ['name', /\bGrace\b/], ['name', /— G\.O\./], ['name', /\bCdr\. G\./], ['name', /\bBassey\b/],
  ['name', /\bOkon\b/], ['name', /\bHauwa\b/i], ['name', /\bDanjuma\b/], ['name', /\bOke\b/], ['name', /\bCoker\b/i],
  ['name', /\bMama Efe\b/i], ['name', /\bTari\b/], ['name', /\bEbi\b/], ['name', /\bTamuno\b/i], ['name', /Divine Grace/i],
  ['name', /\b4B Harbour\b/], ['name', /(^|[^0-9])4 Harbour\b/], ['name', /PORT HARCOURT TIDE/i], ['name', /Akaeze/i],
  ['name', /Lagos Cybercrime/i], ['name', /Mr\. K\. Kuti|signed: K\.(?!F)|for the DG: K\.(?!F)/],
  ['car', /grey saloon/i], ['car', /small grey (one|car)/i], ['car', /grey Corolla/i], ['car', /\bCorolla\b/],
  ['car', /ABJ-418KD/], ['car', /black jeep/i], ['car', /black SUV/i],
  // painted signs and boards are upper case: the echoes of Season 1's Efe and "Grace Divine", and the cause-list
  // company that may be real (TX6)
  ['name', /\bGRACE\b/], ['name', /\bEFE\b/], ['company', /\bKESTREL\b/i],
  ['ransom', /kidnapping for ransom/i],
  ['season', /dock before Christmas/i], ['season', /At Christmas, Kelechi/], ['season', /listed again for January/i],
  ['season', /SEP \/ OCT/], ['season', /\bOCTOBER 2026\b/i], ['season', /a Friday in October/i],
];
const MON = { SEP: 9, SEPT: 9, SEPTEMBER: 9, OCT: 10, OCTOBER: 10 };
// a date in Season 2 text that is after 12 Sep 2026 but still in Sep/Oct (CN03 moved them all +63 days)
function badDates(t) {
  const out = [];
  // canon keeps two pre-season rows in the visitor book (30/09, 09/10) and the option hint that lists the pairs
  const keep = l => /Generator service/.test(l) || (/\b09\/10\b/.test(l) && /CHAIRMAN|Hon\. K\.F\./.test(l)) || /11\/09, 09\/10, 13\/11/.test(l);
  for (const line of String(t).split('\n')) {
    if (keep(line)) continue;
    let m; const re1 = /\b(\d{1,2})\s+(SEP|SEPT|OCT|Sep|Sept|Oct|September|October)\b/g;
    while ((m = re1.exec(line))) { const d = +m[1], mo = MON[m[2].toUpperCase()]; if (mo === 10 || d > 12) out.push(m[0]); }
    const re2 = /\b(September|October)\s+(\d{1,2})\b/g;
    while ((m = re2.exec(line))) { const d = +m[2], mo = MON[m[1].toUpperCase()]; if (mo === 10 || d > 12) out.push(m[0]); }
    const re3 = /(^|[^\d/])(\d{2})\/(09|10)(?![\d/])/g;
    while ((m = re3.exec(line))) { const d = +m[2], mo = +m[3]; if (mo === 10 || d > 12) out.push(m[2] + '/' + m[3]); }
  }
  return out;
}
function scanText(t) {
  const hits = [];
  for (const [k, re] of RULES) { const m = String(t).match(re); if (m) hits.push(k + ':' + m[0]); }
  for (const d of badDates(t)) hits.push('date:' + d);
  return hits;
}
const CODE_KEYS = new Set(['who', 'id', 'art', 'portrait', 'mood', 'tag', 'next', 'evidenceId', 'mark', 'cond', 'key', 'kind', 'when',
  'needs', 'fixes', 'speak', 'region', 'look', 'music', 'host', 'after', 'src', 'scene', 'anim', 'clip', 'gear', 'hat', 'kindOf', 'who_alt']);
const isCodeId = s => /^[a-z0-9_.:\-\/#]*$/.test(s) || /^[A-Z][A-Z0-9_]*$/.test(s) || /^#[0-9a-fA-F]{3,8}$/.test(s);
const isCond = s => /S\.game|moralChoices|\b(V13|V12)\.\w+\(|===|!==|&&|\|\|/.test(s);

function literalsOf(src, file) {
  const out = [];
  if (!acorn) {   // fallback: quoted runs (less exact)
    const re = /'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g; let m;
    while ((m = re.exec(src))) out.push({ text: m[0].slice(1, -1), line: src.slice(0, m.index).split('\n').length, kind: 'str' });
    return out;
  }
  let ast;
  try { ast = acorn.parse(src, { ecmaVersion: 2022, sourceType: 'script', locations: true }); }
  catch (e) { out.push({ text: '', line: 0, kind: 'parse-error ' + e.message }); return out; }
  walk.fullAncestor(ast, (node, _st, anc) => {
    const parent = anc[anc.length - 2];
    if (node.type === 'Literal' && typeof node.value === 'string') {
      if (parent && parent.type === 'Property' && parent.key === node && !parent.computed) return;          // a key
      const pk = parent && parent.type === 'Property' && parent.value === node ? (parent.key.name || parent.key.value) : null;
      if (pk && CODE_KEYS.has(pk)) return;
      if (isCodeId(node.value) || isCond(node.value)) return;
      out.push({ text: node.value, line: node.loc.start.line, kind: 'str' });
    } else if (node.type === 'Literal' && node.regex) {
      out.push({ text: node.regex.pattern, line: node.loc.start.line, kind: 'regex' });
    } else if (node.type === 'TemplateLiteral') {
      const t = node.quasis.map(q => q.value.cooked == null ? q.value.raw : q.value.cooked).join('${}');
      if (!isCond(t)) out.push({ text: t, line: node.loc.start.line, kind: 'tpl' });
    }
  });
  return out;
}

function docLines(file, sectionRe) {
  const lines = fs.readFileSync(file, 'utf8').split('\n'); const out = [];
  let skip = false, inSec = !sectionRe;
  lines.forEach((l, i) => {
    if (sectionRe) { if (/^## /.test(l)) inSec = sectionRe.test(l); }
    if (/<!-- lint:renames -->/.test(l)) { skip = true; return; }
    if (/<!-- \/lint:renames -->/.test(l)) { skip = false; return; }
    if (!skip && inSec) out.push({ text: l, line: i + 1 });
  });
  return out;
}

module.exports = async function (h) {
  const dir = path.join(ROOT, 'src', 'season2');
  const scope = process.env.LINT_SCOPE || 'all';
  const mine = f => /^s2_(dlg_[abc]|court_data|mtex_[abc])\.js$/.test(f);
  const files = fs.readdirSync(dir).filter(f => /^s2_.*\.js$/.test(f) && (scope !== 'text' || mine(f))).sort();
  h.assert(files.length >= 7, 'season2 sources found: ' + files.length);
  h.log('parser:', acorn ? 'acorn' : 'regex fallback', '· scope:', scope, '·', files.length, 'files');
  const bad = [];
  for (const f of files) {
    const lits = literalsOf(fs.readFileSync(path.join(dir, f), 'utf8'), f);
    let n = 0;
    for (const L of lits) {
      if (/^parse-error/.test(L.kind)) { bad.push(`${f}: ${L.kind}`); continue; }
      const hits = L.kind === 'regex' ? RULES.filter(([k]) => k === 'name').filter(([, re]) => re.test(L.text)).map(([k, re]) => 'matcher-' + k + ':' + (L.text.match(re) || [''])[0]) : scanText(L.text);
      if (hits.length) { n++; bad.push(`${f}:${L.line} [${hits.join(', ')}] ${L.text.replace(/\s+/g, ' ').slice(0, 110)}`); }
    }
    h.log(`  ${f}: ${lits.length} literals, ${n} flagged`);
  }
  const docs = [
    [path.join(ROOT, 'docs', 'season2', 'CASES.md'), null],
    [path.join(ROOT, 'docs', 'season2', 'COURT.md'), null],
    [path.join(ROOT, 'docs', 'STORY-CANON.md'), /^## Season 2\b/],
  ];
  if (scope !== 'src') for (const [file, sec] of docs) {
    const rel = path.relative(ROOT, file); let n = 0;
    for (const L of docLines(file, sec)) {
      // the docs may state the rule about '←' and 'AKS'; every other rule applies to them as to the game text
      // (and may date Season 1 itself, or the fix pass)
      const s1line = /Season 1|day one|fix pass|decided|binding,/i.test(L.text);
      const hits = scanText(L.text).filter(x => !/^(arrow|aks):/.test(x) && !(s1line && /^date:/.test(x)));
      if (hits.length) { n++; bad.push(`${rel}:${L.line} [${hits.join(', ')}] ${L.text.slice(0, 110)}`); }
    }
    h.log(`  ${rel}: ${n} flagged`);
  }
  // the Season 2 section of the canon exists and records the decisions
  const canon = fs.readFileSync(path.join(ROOT, 'docs', 'STORY-CANON.md'), 'utf8');
  const sec = canon.split(/\n(?=## )/).filter(s => /^## Season 2\b/.test(s.trim())).join('\n');
  for (const need of ['s1snap', 's1fate', 'Okundaye', 'Igbinosa', 'second paymaster', '11 Jan', '+63', 'tobiAlive'])
    if (!sec.includes(need)) bad.push(`docs/STORY-CANON.md: the Season 2 section does not mention "${need}"`);
  bad.forEach(b => h.log('  FLAG ' + b));
  h.log(`s2_text_lint: ${bad.length} flagged`);
  h.assert(bad.length === 0, `${bad.length} Season 2 text problems (see FLAG lines)`);
};
