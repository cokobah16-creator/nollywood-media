// Season 2 test harness: node tests/t_s2.js <scenario | probe:<name>> [desktop|phone]
//   NACECA_PAGE  folder holding the built naceca.html (and any a_*.js packs); default ../out
//   THREE_JS     path to three.min.js r128; default: node_modules/three/build/three.min.js (npm i three@0.128.0)
//   SHOTS        screenshot folder; default tests/shots
// Needs playwright with chromium (npm i -D playwright; npx playwright install chromium).
// The only console error a clean run prints is the voice-line 404 (vo/vo01.mp3: no recordings yet).
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), http = require('http');
const DIR = __dirname, OUT = process.env.SHOTS || path.join(DIR, 'shots'); fs.mkdirSync(OUT, { recursive: true });
const threePath = process.env.THREE_JS || (() => { try { return require.resolve('three/build/three.min.js'); } catch (e) { return path.join(DIR, '..', 'node_modules', 'three', 'build', 'three.min.js'); } })();
const THREE = fs.readFileSync(threePath);
const scen = process.argv[2] || 's2m9', mode = process.argv[3] || 'desktop';
const scenarios = require('./scen13.js');
(async () => {
  const WEB = path.resolve(process.env.NACECA_PAGE || path.join(DIR, '..', 'out'));
  const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8' };
  const server = http.createServer((q, r) => {
    const f = path.join(WEB, decodeURIComponent(q.url.split('?')[0]).replace(/^\/+/, ''));
    if (!f.startsWith(WEB) || !fs.existsSync(f)) { r.writeHead(404); r.end(); return; }
    r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
  });
  await new Promise(res => server.listen(0, '127.0.0.1', res));
  const PORT = server.address().port;
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await browser.newContext(mode === 'phone'
    ? { viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
    : { viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', m => { if (m.type() === 'error' || (m.type() === 'warning' && /v12|v13|v14|NACECA/.test(m.text()))) errs.push(`[${m.type()}] ${m.text()}`.slice(0, 400)); });
  page.on('response', r => { if (r.status() >= 400) errs.push(`[http ${r.status()}] ${r.url().slice(-80)}`); });
  page.on('pageerror', e => errs.push(`[pageerror] ${String(e.stack || e).slice(0, 600)}`));
  await page.route('**/three.min.js', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: THREE }));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await page.goto(`http://127.0.0.1:${PORT}/naceca.html`, { waitUntil: 'load', timeout: 180000 });
  await page.waitForTimeout(4000);
  const T = {
    page, mode,
    wait: ms => page.waitForTimeout(ms),
    ev: (fn, arg) => page.evaluate(fn, arg),
    shot: async name => { await page.screenshot({ path: path.join(OUT, `${scen.replace(/[:\/]/g, '_')}_${mode}_${name}.png`) }); console.log('  shot', name); },
    click: async sel => { await page.click(sel, { timeout: 45000 }); },
    log: (...a) => console.log('  ', ...a),
    until: async (fn, ms = 30000, arg) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await page.evaluate(fn, arg)) return true; await page.waitForTimeout(400); } return false; },
  };
  try { await (scen.startsWith('probe:') ? require('./probes/' + scen.slice(6) + '.js') : scenarios[scen])(T); } catch (e) { console.log('SCENARIO ERROR', e.stack || e); }
  console.log('errors:', errs.length); errs.slice(0, 25).forEach(e => console.log(' ', e));
  await browser.close(); server.close();
})();
