// Headless test harness for NACECA's game logic and UI (no 3D rendering).
//
//   node tools/harness/run.cjs <scenario.cjs> [--html naceca.html] [--w 390 --h 844] [--shots <dir>]
//
// three.js r128 comes from cdnjs, which some environments can't reach, so the page gets
// tools/harness/three_stub.js instead: every THREE call is a no-op proxy, so scenes build,
// the tick loop runs, and all DOM/state logic works — nothing is drawn on the canvas.
// ART is marked failed, so missions use the legacy scene builders.
//
// A scenario module exports `async function (h)` where h = {
//   page, ev(fn, arg)   — page.evaluate shortcut
//   start(missionId, {completed:[...], state:fn})  — fresh state, begin a mission
//   step(ms)            — let the game loop run
//   shot(name)          — screenshot into --shots
//   errors              — page errors so far (array of strings)
//   log(...)            — print
//   assert(cond, msg)   — throws on failure
// }
// Exit code 0 when the scenario finishes without throwing and the page raised no errors.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const args = process.argv.slice(2);
const scenarioPath = path.resolve(args[0]);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i > 0 ? args[i + 1] : d; };
const root = path.resolve(__dirname, '..', '..');
const htmlFile = opt('html', 'naceca.html');
const W = +opt('w', 390), H = +opt('h', 844), shots = opt('shots', null);
const stub = fs.readFileSync(path.join(__dirname, 'three_stub.js'));

// --html may be an absolute path to a private build (NACECA_OUT_DIR); it is served as /naceca.html
const htmlAbs = path.isAbsolute(htmlFile) ? htmlFile : null;
const srv = http.createServer((q, r) => {
  const url = decodeURIComponent(q.url.split('?')[0]);
  if (htmlAbs && url === '/naceca.html') { r.writeHead(200, { 'Content-Type': 'text/html' }); return fs.createReadStream(htmlAbs).pipe(r); }
  const p = path.resolve(root, url.slice(1));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200); fs.createReadStream(p).pipe(r);
});

(async () => {
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const port = srv.address().port;
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, hasTouch: opt('touch', '') === '1' });
  if (opt('touch', '') === '1') await ctx.addInitScript(() => { window.ontouchstart = null; });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e).slice(0, 400)));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console.error: ' + m.text().slice(0, 300)); });
  await page.route('**/three.min.js', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: stub }));
  await page.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await page.route('**/assets/music/**', r => r.abort());
  await page.goto(`http://127.0.0.1:${port}/${htmlAbs ? 'naceca.html' : htmlFile}`, { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(1500);
  const h = {
    page, errors,
    ev: (fn, arg) => page.evaluate(fn, arg),
    step: ms => page.waitForTimeout(ms),
    log: (...a) => console.log(...a),
    assert: (c, m) => { if (!c) throw new Error('ASSERT: ' + m); },
    shot: async name => { if (!shots) return; fs.mkdirSync(shots, { recursive: true }); await page.screenshot({ path: path.join(shots, name + '.png') }); },
    start: async (id, o = {}) => {
      await page.evaluate(({ id, completed, extra }) => {
        ART.failed = true; ART.promise = null;
        S = defaultState(); S.game.completedMissions = completed || [];
        if (extra) (new Function('S', extra))(S);
        showOverlay(null); loadMission(id);
      }, { id, completed: o.completed, extra: o.state ? `(${o.state.toString()})(S)` : null });
      await page.waitForTimeout(600);
      await page.evaluate(id => { if (document.querySelector('#screen-controls.show')) beginMission(id); }, id);
      await page.waitForTimeout(o.wait || 1500);
    },
  };
  let ok = true;
  try { await require(scenarioPath)(h); }
  catch (e) { ok = false; console.log('SCENARIO FAILED:', e.message); }
  if (errors.length) { ok = false; console.log(`PAGE ERRORS (${errors.length}):`); [...new Set(errors)].slice(0, 15).forEach(e => console.log('  ' + e)); }
  console.log(ok ? 'PASS' : 'FAIL');
  await b.close(); srv.close();
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
