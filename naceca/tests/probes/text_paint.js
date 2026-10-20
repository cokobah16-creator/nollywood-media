// text team: every string the Season 2 canvas painters (MTEX in src/season2/s2_mtex_*.js) paint, on the built page.
// CanvasRenderingContext2D.prototype.fillText / strokeText are wrapped while each painter runs once.
// Run: run_probe.sh <build> text_paint desktop <log>
// (an ES module: this repo's package.json says "type":"module"; the kit's harness loads it with require(esm))
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const probe = async function (T) {
  let pass = 0, total = 0;
  const check = (id, ok, detail) => { total++; if (ok) pass++; console.log(`CHECK ${id} ${ok ? 'PASS' : 'FAIL'} ${detail}`.slice(0, 700)); };
  // the painter names, from the Season 2 sources next to this probe (tests/probes -> src/season2)
  const dir = path.resolve(HERE, '..', '..', 'src', 'season2');
  const names = new Set();
  for (const f of ['s2_mtex_a.js', 's2_mtex_b.js', 's2_mtex_c.js']) {
    const src = fs.readFileSync(path.join(dir, f), 'utf8'); let m; const re = /\b([a-z]{2}_[a-z0-9]+(?:_[a-z0-9]+)*)\(\)\s*\{/g;
    while ((m = re.exec(src))) names.add(m[1]);
  }
  const r = await T.ev(list => {
    const P = CanvasRenderingContext2D.prototype, of = P.fillText, os = P.strokeText, got = [], ran = [], errs = [], missing = [];
    P.fillText = function (s) { got.push(String(s)); return of.apply(this, arguments); };
    P.strokeText = function (s) { got.push(String(s)); return os.apply(this, arguments); };
    try {
      for (const n of list) {
        if (typeof MTEX === 'undefined' || typeof MTEX[n] !== 'function') { missing.push(n); continue; }
        try { MTEX[n](); ran.push(n); } catch (e) { errs.push(n + ': ' + String(e && e.message || e).slice(0, 120)); }
      }
    } finally { P.fillText = of; P.strokeText = os; }
    return { got, ran, errs, missing };
  }, [...names]);
  T.log(`painters: ${r.ran.length} ran, ${r.missing.length} not in MTEX (${r.missing.join(', ')}), ${r.errs.length} threw`);
  r.errs.forEach(e => T.log('  threw', e));
  const norm = s => s.replace(/\s+/g, ' ').trim();
  const all = r.got.map(norm), has = s => all.includes(norm(s)), any = re => all.filter(t => re.test(t));
  console.log('CHK painted ' + JSON.stringify([...new Set(all)].filter(t => t.length > 3).slice(0, 400)));
  check('setup', r.ran.length >= 40 && r.got.length > 200, `${r.ran.length} painters ran, ${r.got.length} strings painted`);
  check('R01/agency', has('NATIONAL ANTI-CORRUPTION & ECONOMIC CRIMES AGENCY') && any(/ANTI-?CYBERCRIME/i).length === 0, 'flag: ' + JSON.stringify(any(/AGENCY/)));
  check('CN03/whiteboard', has('TANK STOCK 10/12') && any(/TANK STOCK 08\/10/).length === 0, JSON.stringify(any(/TANK STOCK/)));
  check('CN03/calendar', has('DECEMBER 2026') && any(/OCTOBER 2026/).length === 0, JSON.stringify(any(/20\d\d/)));
  check('CN21/buka', has('MAMA TEGA KITCHEN') && any(/MAMA EFE/i).length === 0, JSON.stringify(any(/KITCHEN/)));
  check('CN03/gatehouse', ['23/11  A. BELLO   ELECTRICIAN  09:10', '04/12  ROSE (CLEANER)   11:00', '09/12  —  DELIVERY   15:40'].every(has)
    && any(/^(21\/09|02\/10|07\/10)\b/).length === 0, JSON.stringify(any(/BELLO|ROSE|DELIVERY/)));
  check('CN20/kuti-plate', has('A. KUTI'), 'desk plate A. KUTI (the docket now says A.K.)');
  check('rules/aks', any(/\bAKS\b/).length === 0, 'no AKS painted');
  check('names', any(/OSAGIE|COKER|TAMUNO|HAUWA|TIDE\b|CYBERCRIME & ECON/i).length === 0, JSON.stringify(any(/OSAGIE|COKER|TAMUNO|HAUWA|TIDE\b/i)));
  // TX6: the market signs that echoed Season 1 (Efe; "Grace Divine") and the cause-list company that may be real
  check('TX6/signs', has('IGHO & SONS ELECTRICALS') && has('CLEAR DROP PURE WATER') && any(/\bGRACE\b|\bEFE\b/).length === 0, JSON.stringify(any(/ELECTRICALS|PURE WATER|GRACE|\bEFE\b/)));
  check('TX6/cause-list', any(/FRN v\. ADEJO-IKIME HAULAGE LTD$/).length === 1 && any(/KESTREL/i).length === 0, JSON.stringify(any(/^\d\.\s+FRN v\./)));
  console.log(`CHECKS ${pass}/${total}`);
};
export { probe as 'module.exports' };
