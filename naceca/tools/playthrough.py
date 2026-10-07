"""NACECA playthrough test — plays every mission to its end under 3 choice policies.
Usage:  pip install playwright && playwright install chromium
        python3 tools/playthrough.py 8800            # all missions
        python3 tools/playthrough.py 8800 m5,m6      # a subset
Exit criteria for a release: every line ✅, no ERR lines."""
"""Plays every playable mission to its end, once per dialogue-choice policy, and reports."""
import http.server, threading, socketserver, os, sys, json
from playwright.sync_api import sync_playwright
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
socketserver.TCPServer.allow_reuse_address=True
port=int(sys.argv[1]); srv = socketserver.TCPServer(('127.0.0.1',port), Q); threading.Thread(target=srv.serve_forever, daemon=True).start()
THREE_PATH = os.environ.get('THREE_JS')  # optional local copy of three.min.js r128 if the CDN is blocked
THREE = open(THREE_PATH,'rb').read() if THREE_PATH else None
MISSIONS = sys.argv[2].split(',') if len(sys.argv)>2 else ['m1','m2','m3','m4','m5','m6','m7']
POLICIES = [0,1,2]
DRIVER = r"""
async ({mid, k}) => {
  const sleep = ms => new Promise(r=>setTimeout(r,ms));
  const shown = () => [...document.querySelectorAll('.overlay.show')].map(e=>e.id);
  const log = [];
  // fresh state with every earlier mission done
  S = defaultState();
  const order = MISSIONS.map(m=>m.id); const idx = order.indexOf(mid);
  S.game.completedMissions = order.slice(0, idx);
  S.game.moralChoices.asaba = ['chase','rescue',null][k];
  showOverlay(null); loadMission(mid); await sleep(150);
  if(shown().includes('screen-controls')) beginMission(mid);
  await sleep(500);
  const terminal = /Extract|Deploy|Board NACECA/;
  const done = () => shown().includes('screen-aftermath') || S.game.completedMissions.includes(mid) && (shown().includes('screen-controls') || shown().includes('screen-aftermath'));
  let steps = 0, stall = 0, lastSig = '';
  const touched = new Set();
  async function handleOverlays(){
    for(let g=0; g<60; g++){
      const sh = shown();
      if(sh.includes('screen-dialogue')){
        if(typeof skipTypewriter==='function') skipTypewriter();
        const ch=[...document.querySelectorAll('#dlg-choices button')];
        if(ch.length){ const c = ch[Math.min(k, ch.length-1)]; log.push('choice:'+c.textContent.trim().slice(0,40)); c.click(); }
        else if(!document.querySelector('#dlg-continue').classList.contains('hide')) advanceDialogue();
        await sleep(40); continue;
      }
      if(sh.includes('screen-puzzle')){
        const title = document.querySelector('#puzzle-title').textContent;
        const key = Object.keys(PUZZLES).find(x=>PUZZLES[x].title===title);
        const ci = key ? PUZZLES[key].options.findIndex(o=>o.correct) : 0;
        log.push('puzzle:'+(key||title));
        document.querySelectorAll('#puzzle-options .puzzle-option')[ci].click();
        await sleep(1600); continue;
      }
      return;
    }
  }
  while(steps < 140){
    steps++;
    await handleOverlays();
    if(done()) break;
    const its = ENGINE.interactables.slice();
    const sig = JSON.stringify([S.game.objectives?.map(o=>o.done), S.game._opEv, S.game.flags, S.game.moralChoices, S.game.completedMissions.length, its.length]);
    if(sig===lastSig) stall++; else { stall=0; lastSig=sig; }
    let pool = stall>=2 ? its : its.filter(i=>!terminal.test(i.label));
    if(k%2===1) pool = pool.slice().reverse();   // odd policies approach targets in the other order
    for(const it of pool){
      if(done()) break;
      const pos = it.mesh.position;
      if(ENGINE.player){ ENGINE.player.position.x = pos.x+0.8; ENGINE.player.position.z = pos.z+0.8; }
      await sleep(120);
      await handleOverlays();   // a player can't press E while a screen is open
      // evidence markers within reach get picked up by the game's own proximity check
      try{ it.onInteract(); touched.add(it.label); }catch(e){ log.push('THROW '+it.label+': '+e.message); }
      await sleep(80);
      await handleOverlays();
    }
    // walk over any remaining evidence markers
    for(const m of (ENGINE.evidenceMarkers||[])){ if(!m.collected && ENGINE.player){ ENGINE.player.position.x=m.worldPos.x; ENGINE.player.position.z=m.worldPos.z; await sleep(150); } }
    if(stall>=6) break;
    await sleep(400);
  }
  const ah = document.querySelector('.headline-block .head');
  return {
    mid, k, steps, stall,
    completed: S.game.completedMissions.includes(mid),
    overlays: shown(),
    headline: shown().includes('screen-aftermath') && ah ? ah.textContent : null,
    ev: (document.querySelector('#ev-cur')||{}).textContent + '/' + (document.querySelector('#ev-max')||{}).textContent,
    opEv: (S.game._opEv||[]).length,
    objectives: (S.game.objectives||[]).map(o=>(o.done?'✓':'·')+o.id).join(' '),
    flags: JSON.stringify(S.game.flags),
    log: log.slice(-6),
  };
}
"""
results=[]
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required'])
    ctx = b.new_context(viewport={'width':800,'height':450})
    pg = ctx.new_page(); errs=[]
    pg.on('pageerror', lambda e: errs.append('PAGEERROR: '+str(e)[:300]))
    pg.on('console', lambda m: errs.append(f'console.error: {m.text[:200]}') if m.type=='error' else None)
    pg.route('**/assets/music/**', lambda r: r.abort())
    if THREE: pg.route('**/three.min.js', lambda r: r.fulfill(status=200, content_type='application/javascript', body=THREE))
    pg.route('**/fonts.googleapis.com/**', lambda r: r.fulfill(status=200, content_type='text/css', body=''))
    pg.goto(f'http://127.0.0.1:{port}/naceca.html', wait_until='load', timeout=60000)
    pg.wait_for_timeout(2500)
    for mid in MISSIONS:
        for k in POLICIES:
            n0=len(errs)
            try:
                r = pg.evaluate(DRIVER, {'mid':mid,'k':k})
            except Exception as e:
                r = {'mid':mid,'k':k,'completed':False,'error':str(e)[:200]}
            r['errors'] = errs[n0:]
            results.append(r)
            ok = '✅' if r.get('completed') else '❌'
            print(f"{ok} {mid} k={k} steps={r.get('steps')} ev={r.get('ev')} obj=[{r.get('objectives','')}]")
            print(f"     headline: {r.get('headline')}")
            if not r.get('completed'): print('     overlays:', r.get('overlays'), 'flags:', r.get('flags'), 'log:', r.get('log'), r.get('error',''))
            for e in r['errors'][:3]: print('     ERR', e)
    b.close()
json.dump(results, open('/home/claude/playthrough.json','w'), indent=1)
srv.shutdown()
