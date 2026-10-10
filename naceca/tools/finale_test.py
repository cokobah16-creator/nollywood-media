"""NOTE: targets the vendor drop's standalone v13 semantics (before the friends-beta integration); superseded by tools/harness/scenarios/v13_port_finale.cjs.
NACECA finale test — plays Mission 8 down every route.
Usage: python3 tools/finale_test.py 8890 '[{"name":"A","mc":{"tower":"hold"},"reveal":0}]'
Case keys: mc (moralChoices), flags, back (use back gate), follow (tail properly), k (call choices), reveal (choice index), epilogue."""
import http.server, threading, socketserver, os, sys, json
from playwright.sync_api import sync_playwright
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
socketserver.TCPServer.allow_reuse_address=True
port=int(sys.argv[1]); srv = socketserver.TCPServer(('127.0.0.1',port), Q); threading.Thread(target=srv.serve_forever, daemon=True).start()
THREE_PATH = os.environ.get('THREE_JS')  # optional local three.min.js r128 if the CDN is blocked
THREE = open(THREE_PATH,'rb').read() if THREE_PATH else None
CASES = json.loads(sys.argv[2])
DRIVER = r"""
async (cs) => {
  const sleep = ms => new Promise(r=>setTimeout(r,ms));
  const shown = () => [...document.querySelectorAll('.overlay.show')].map(e=>e.id);
  const log = [];
  S = defaultState();
  S.game.completedMissions = ['m1','m2','m3','m4','m5','m6','m7'];
  Object.assign(S.game.moralChoices, cs.mc || {}); Object.assign(S.game.flags, cs.flags || {});
  S.game.completedMissions.splice(0, 0, 'm0'); S.game.completedMissions.splice(4, 0, 'm3n');
  if(typeof I === 'function'){ const d = I(); d.briefed = { m3:1, m4:1, m5:1, m6:1, m7:1 }; Object.assign(d, cs.intel || {}); }
  showOverlay(null); loadMission('m8'); await sleep(150);
  if(shown().includes('screen-controls')) beginMission('m8');
  await sleep(400);
  const route = finaleRoute();
  async function talk(k){
    for(let g=0; g<120; g++){
      const sh = shown();
      if(sh.includes('screen-minigame') && typeof MINI!=='undefined' && MINI.active){
        const run = MINI.active;
        if(run.phase === 'play'){ miniSuccess(run, {stars:3}); log.push('mini:'+(run.cfg.id||run.cfg.type)); }
        else { const b = document.querySelector('#mg-actions button'); if(b) b.click(); }
        await sleep(80); continue;
      }
      if(sh.includes('screen-dialogue')){
        skipTypewriter();
        const ch=[...document.querySelectorAll('#dlg-choices button')];
        if(ch.length){ const c=ch[Math.min(k, ch.length-1)]; log.push('»'+c.textContent.trim().slice(2,34)); c.click(); await sleep(30); if(c.isConnected && c.classList.contains('armed')) c.click(); }
        else if(!document.querySelector('#dlg-continue').classList.contains('hide')) advanceDialogue();
        await sleep(40); continue;
      }
      if(sh.includes('screen-puzzle')){ const t=document.querySelector('#puzzle-title').textContent; const key=Object.keys(PUZZLES).find(x=>PUZZLES[x].title===t); document.querySelectorAll('#puzzle-options .puzzle-option')[PUZZLES[key].options.findIndex(o=>o.correct)].click(); await sleep(1600); continue; }
      return;
    }
  }
  function use(label){ const it=ENGINE.interactables.find(i=>i.label===label); if(!it) return false; ENGINE.player.position.x=it.mesh.position.x+0.8; ENGINE.player.position.z=it.mesh.position.z+0.8; onBeforeInteract(it); it.onInteract(it); return true; }
  use('Brief with Sgt. Uche'); await sleep(200); await talk(0); await sleep(300);
  if(route==='B'){
    if(cs.mc && cs.mc.market_runner==='caught' && cs.mc.choice!=='force'){ use('Talk to KC'); await sleep(200); await talk(0); }
    // follow: stay ~6 m behind her; crouch when she looks back
    if(cs.follow){
      for(let t=0; t<400 && TAIL.active; t++){
        const c=TAIL.active, r=c.target, yaw=r.rotation.y;
        ENGINE.player.position.x = r.position.x - Math.sin(yaw)*6.2; ENGINE.player.position.z = r.position.z - Math.cos(yaw)*6.2;
        ENGINE.keys['KeyC'] = c.lookT > 0;
        await sleep(100);
      }
      ENGINE.keys['KeyC'] = false;
    } else { ENGINE.player.position.set(-20,0,8); for(let t=0;t<120 && TAIL.active;t++) await sleep(100); }
    await sleep(300); await talk(0);
    log.push('tail→ phone:'+!!S.game._finCourierPhone+' risk:'+(S.game._finRisk||0));
  }
  if(route==='C'){ use('Take the call in the van'); await sleep(200); await talk(cs.k||0); await sleep(400); await talk(0); log.push('trace:'+S.game._finTrace+' rec:'+!!S.game._finRecording); }
  // entry
  if(cs.back){ use('Try the back gate'); await sleep(250); await talk(0); }
  if(!S.game._finInside){ use('Breach the front gate'); await sleep(250); await talk(0); }
  log.push('inside:'+S.game._finInside);
  use('Free Osas'); await sleep(250); await talk(0);
  // v12: before they arrive, name the Voice and put three pieces of evidence to them
  for(let t=0; t<40 && !shown().includes('screen-accuse'); t++) await sleep(100);
  if(shown().includes('screen-accuse')){
    const who = cs.who || 'adaeze';
    const card = document.querySelector(`#screen-accuse .acc-card[data-id="${who}"]`); if(card) card.click(); await sleep(40);
    const strong = (typeof V12!=='undefined' && V12.strongAgainstAdaeze) ? V12.strongAgainstAdaeze() : {};
    const ids = [...document.querySelectorAll('#screen-accuse .acc-item')].map(b=>b.dataset.id);
    const pick = ids.filter(id=>strong[id]).concat(ids.filter(id=>!strong[id])).slice(0, 3);
    for(const id of pick){ const b=document.querySelector(`#screen-accuse .acc-item[data-id="${id}"]`); if(b) b.click(); await sleep(30); }
    const go=document.getElementById('acc-go'); if(go){ go.click(); await sleep(30); go.click(); }
    log.push('accused:'+who+' picks:'+pick.join(','));
    await sleep(600);
  }
  await sleep(1400); await talk(cs.reveal||0); await sleep(500); await talk(0); await sleep(600);
  const ah=document.querySelector('.headline-block .head');
  const res = { route, outcome:S.game.moralChoices.finale, osas:S.game.flags.fin_osas, proofs:finaleProofs().length,
    completed:S.game.completedMissions.includes('m8'), overlays:shown(), headline: ah&&ah.textContent, grade:(document.querySelector('.grade-letter')||{}).textContent,
    ev: document.querySelector('#ev-cur').textContent+'/'+document.querySelector('#ev-max').textContent,
    objs:(S.game.objectives||[]).map(o=>(o.done?'✓':'·')+o.id).join(' '), log:log.slice(-8) };
  if(cs.epilogue){
    document.querySelector('#btn-aftermath-continue').click(); await sleep(400);
    if(shown().includes('screen-court')){
      const best = { s84:'cert', custody:'keeper', noorder:'s14', warrantless:'s14', inducement:'corroborate', accomplice:'corroborate', hearsay:'witness', photocopy:'ctc', ident:'plate', deception:'s14', contested:'explain', none:'tender' };
      if(cs.prep){ [...document.querySelectorAll('[data-ct="cert"]')].slice(0,2).forEach(b=>b.click()); const c=document.querySelector('[data-ct="ctc"]'); if(c) c.click(); }
      document.querySelector('[data-ct="begin"]').click(); await sleep(40);
      for(let n=0; n<80 && shown().includes('screen-court'); n++){
        if(COURT.phase==='cred') document.querySelector('[data-ct="cred"]').click();
        else if(COURT.phase==='ex'){ const x=COURT.ex[COURT.i]; (document.querySelector(`[data-ct="resp"][data-v="${best[x.k]}"]:not([disabled])`)||document.querySelector('[data-ct="resp"][data-v="trust"]')||document.querySelector('[data-ct="resp"][data-v="withdraw"]')||document.querySelector('[data-ct="resp"]')).click(); }
        else if(COURT.phase==='ruling') document.querySelector('[data-ct="next"]').click();
        else if(COURT.phase==='judgment') document.querySelector('[data-ct="end"]').click();
        await sleep(25);
      }
      res.court = S.game.intel && S.game.intel.court ? S.game.intel.court.proven.length + '/4' : null;
    }
    const slides=[]; for(let i=0;i<20 && shown().includes('screen-epilogue');i++){ slides.push((document.querySelector('.epi-name')||document.querySelector('.epi-title')||document.querySelector('.epi-place')||{}).textContent); advanceEpilogue(); await sleep(60); }
    res.review = shown().includes('screen-review');
    if(res.review){ document.getElementById('btn-review-done').click(); await sleep(80); }
    res.epilogue = slides; res.after = shown(); res.s1 = !!S.game.seasonOneComplete;
  }
  return res;
}
"""
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=swiftshader','--autoplay-policy=no-user-gesture-required'])
    pg = b.new_context(viewport={'width':800,'height':450}).new_page(); errs=[]
    pg.on('pageerror', lambda e: errs.append('PAGEERROR: '+str(e)[:300]))
    pg.on('console', lambda m: errs.append('console.error: '+m.text[:200]) if m.type=='error' else None)
    pg.route('**/assets/music/**', lambda r: r.abort())
    if THREE: pg.route('**/three.min.js', lambda r: r.fulfill(status=200, content_type='application/javascript', body=THREE))
    pg.route('**/fonts.googleapis.com/**', lambda r: r.fulfill(status=200, content_type='text/css', body=''))
    pg.goto(f'http://127.0.0.1:{port}/naceca.html', wait_until='load', timeout=60000); pg.wait_for_timeout(2000)
    for cs in CASES:
        n0=len(errs)
        try: r = pg.evaluate(DRIVER, cs)
        except Exception as e: r={'error':str(e)[:300]}
        ok = '✅' if r.get('completed') else '❌'
        print(ok, cs.get('name'), json.dumps({k:r.get(k) for k in ['route','outcome','osas','proofs','grade','ev','headline']}))
        print('    ', r.get('objs'), '|', r.get('log'))
        if r.get('epilogue'): print('     epilogue:', r['epilogue'], '→', r.get('after'), 's1:', r.get('s1'), 'court:', r.get('court'), 'review:', r.get('review'))
        if r.get('error'): print('     ERR', r['error'])
        for e in errs[n0:n0+4]: print('     ', e)
    b.close()
srv.shutdown()
