"""NOTE: targets the vendor drop's standalone v13 semantics (before the friends-beta integration); superseded by tools/harness/scenarios/v13_port_flow.cjs.
NACECA v13 test — the investigation layer on top of v12, through v12's real flows:
raid-plan warrant, Night Shift → weekly briefing, pre-operation briefings (loadMission),
gatekeeper calls, stakeout, undercover, production order, Ekosodin warrant routing,
v12's accusation reading the findings, trial, epilogue, review. Phone viewport, screenshots.
Usage: THREE_JS=/path/three.min.js python3 tools/v13_test.py 8870 [outdir]"""
import http.server, threading, socketserver, os, sys, json
from playwright.sync_api import sync_playwright
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
socketserver.TCPServer.allow_reuse_address=True
port=int(sys.argv[1]); OUT = sys.argv[2] if len(sys.argv)>2 else '/tmp/v13_shots'
os.makedirs(OUT, exist_ok=True)
srv = socketserver.TCPServer(('127.0.0.1',port), Q); threading.Thread(target=srv.serve_forever, daemon=True).start()
THREE = open(os.environ['THREE_JS'],'rb').read() if os.environ.get('THREE_JS') else None
HELPERS = r"""
window.T = {
  sleep: ms => new Promise(r=>setTimeout(r,ms)),
  shown: () => [...document.querySelectorAll('.overlay.show')].map(e=>e.id),
  async talk(k){ for(let g=0; g<80; g++){ if(!T.shown().includes('screen-dialogue')) return; skipTypewriter();
      const ch=[...document.querySelectorAll('#dlg-choices button')];
      if(ch.length){ const c = ch[Math.min(k, ch.length-1)]; c.click(); if(c.isConnected && c.classList.contains('armed')) c.click(); } else advanceDialogue();
      await T.sleep(30); } },
  async next(n=6){ for(let i=0;i<n;i++){ const b=document.querySelector('[data-b="next"]'); if(!b) return; b.click(); await T.sleep(70); } },
};
"""
results = []
def check(name, cond, info=''):
    results.append((name, bool(cond), info)); print(('✅' if cond else '❌'), name, (info if not cond else str(info)[:160]))
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
    ctx = b.new_context(viewport={'width':390,'height':844}, device_scale_factor=2, has_touch=True, is_mobile=True)
    pg = ctx.new_page(); errs=[]
    pg.on('pageerror', lambda e: errs.append('PAGEERROR: '+str(e)[:300]))
    pg.on('console', lambda m: errs.append('console.'+m.type+': '+m.text[:200]) if m.type in ('error','warning') and '[v13]' in m.text or m.type=='error' else None)
    pg.on('response', lambda resp: errs.append('404: '+resp.url[-80:]) if resp.status==404 else None)
    pg.route('**/assets/music/**', lambda r: r.abort())
    if THREE: pg.route('**/three.min.js', lambda r: r.fulfill(status=200, content_type='application/javascript', body=THREE))
    pg.route('**/fonts.googleapis.com/**', lambda r: r.fulfill(status=200, content_type='text/css', body=''))
    pg.goto(f'http://127.0.0.1:{port}/naceca.html', wait_until='load', timeout=90000)
    pg.wait_for_timeout(3000)
    pg.add_script_tag(content=HELPERS)
    run = lambda js: pg.evaluate(js)
    shot = lambda n: pg.screenshot(path=f'{OUT}/{n}.png')

    r = run("""async () => ({ v: V12.version, tag: (document.getElementById('v12-build')||{}).textContent, desk: !!document.getElementById('btn-missions-desk') && !!document.getElementById('btn-pause-desk'), warrantFn: V12.warrant() })""")
    check('v13 boots on v12 (version, build tag, desk buttons)', r['v']=='v13' and 'v13' in (r['tag'] or '') and r['desk'] and r['warrantFn'] is False, str(r))

    # ---- after M2: KC's phone, money, the Lekki warrant from the raid plan ----
    r = run("""async () => {
      S = defaultState(); S.game.completedMissions = ['m0','m1','m2']; S.game.currentMission = 'm2';
      collectEvidence({id:'phishing_template', name:'Phishing Template', xp:50});
      ['kc_msg_engineer','kc_msg_control','kc_call_control','kc_ph_gate','kc_ph_van','kc_bank_150k','kc_del_control'].forEach(id=>flagClue(id,true));
      return { phones: PHONES.filter(phoneUnlocked).map(p=>p.id), money:I().money.open, score: warrantScore(WARRANTS[0]) };
    }""")
    check("KC's phone unlocks; flagging opens the money trail", r['phones']==['kc'] and r['money'], str(r))
    r = run("""async () => {
      S.game.currentMission = 'm3'; S.game._plan = null;
      let went = false; V12.planM3(()=>{ went = true; }); await T.sleep(150);
      const btn = document.getElementById('plan-warrant'); const before = !!btn;
      btn.click(); await T.sleep(120); const deskOpen = T.shown().includes('screen-desk');
      deskDo('warrant', {id:'w_lekki', route:'standard'}); closeDesk(); await T.sleep(150);
      const signed = /SIGNED|Signed/.test(document.getElementById('screen-plan').textContent);
      return { before, deskOpen, granted: warrantGranted('w_lekki'), signed, v12w: V12.warrant(), noBtn: !document.getElementById('plan-warrant') };
    }""")
    check('Raid plan offers the warrant; desk grants it; plan redraws as signed', r['before'] and r['deskOpen'] and r['granted'] and r['v12w'] and r['noBtn'], str(r))
    shot('01_plan_warrant')
    run("""async () => { document.getElementById('plan-go').click(); await T.sleep(100); showOverlay(null); }""")
    r = run("""async () => ({ closed: warrantClosed(WARRANTS[0]), plan: !!S.game._plan })""")
    check('Committing the plan closes the Lekki window', r['closed'] and r['plan'], str(r))

    # ---- M3 → Night Shift → the briefing before "BENIN BYPASS" ----
    r = run("""async () => {
      S.game.completedMissions.push('m3'); collectEvidence({id:'laptop', name:'Encrypted Laptop', xp:80}); collectEvidence({id:'safe_drives', name:'Drives', xp:80});
      intelOnMissionEnd('m3'); S.game.completedMissions.push('m3n'); S.game.currentMission = 'm3n';
      window._toM4 = false;
      titleCard(['BENIN BYPASS', 'TWO DAYS LATER'], 200, ()=>{ window._toM4 = true; });
      await T.sleep(150);
      return { shown: T.shown(), key: briefingKeyBefore('m4'), certOpen: certWindowOpen('laptop') };
    }""")
    check('Night Shift → Week 1 briefing opens before the Bypass title card', 'screen-briefing' in r['shown'] and r['key']=='m3' and r['certOpen'], str(r))
    shot('02_brief_w1')
    r = run("""async () => {
      document.querySelector('[data-b="cert"][data-id="laptop"]').click();
      document.querySelector('[data-b="lead"][data-id="pos"]').click();
      document.querySelector('[data-b="lead"][data-id="gatehouse"]').click();
      document.querySelector('[data-b="commit"]').click(); await T.sleep(200);
      await T.talk(1); await T.sleep(120); await T.talk(0); await T.sleep(150);
      await T.next(4); document.querySelector('[data-b="done"]').click(); await T.sleep(1500);
      return { toM4: window._toM4, gate: intelHas('inv_gatehouse'), ev: S.game.evidence.some(e=>e.id==='inv_gatehouse'), cert: I().items.laptop.cert };
    }""")
    check('Week 1 → title card → onward; gatehouse log became an exhibit', r['toM4'] and r['gate'] and r['ev'] and r['cert'], str(r))

    # ---- M4 → Week 2 via loadMission (the real trigger) ----
    r = run("""async () => {
      S.game.completedMissions.push('m4'); S.game.currentMission = 'm4';
      collectEvidence({id:'ransom_ledger', name:'Ransom Route Ledger', xp:140}); intelOnMissionEnd('m4');
      const real = loadMission._v12orig; let called = null;
      loadMission._probe = true;
      // intercept the original so the test doesn't load a 3D scene
      const W = window.loadMission; const inner = W._v12orig; W._v12orig = id => { called = id; };
      maybeBriefingBefore('m5', ()=>{ called = 'm5'; });
      await T.sleep(100);
      const open = T.shown().includes('screen-briefing');
      document.querySelector('[data-b="dec"][data-k="custody"][data-v="kept"]').click();
      document.querySelector('[data-b="lead"][data-id="musa"]').click();
      document.querySelector('[data-b="lead"][data-id="cac"]').click();
      document.querySelector('[data-b="commit"]').click(); await T.sleep(100);
      await T.next(5); document.querySelector('[data-b="done"]').click(); await T.sleep(80);
      W._v12orig = inner;
      return { open, called, kept: I().custodyAsk, reg: Object.keys(I().reg.found), key5: briefingKeyBefore('m5') };
    }""")
    check('Week 2 runs before Case 05; ledger kept; CAC unlocked', r['open'] and r['called']=='m5' and r['kept']=='kept' and 'bluewater' in r['reg'] and r['key5'] is None, str(r))
    r = run("""async () => {
      // the actual loadMission wrapper defers to the briefing when one is pending
      S.game.completedMissions.push('m5'); S.game.currentMission = 'm5'; intelOnMissionEnd('m5');
      const before = T.shown(); let reached = false;
      const W = window.loadMission, inner = W._v12orig; W._v12orig = function(){ reached = true; };
      loadMission('m6'); await T.sleep(100);
      const open = T.shown().includes('screen-briefing');
      return { open, reached, before };
    }""")
    check('loadMission("m6") opens Week 3 first and holds the mission', r['open'] and not r['reached'], str(r))
    regs = run("""async () => { regSearch('C.A. Consulting'); regSearch('Serpentine'); regSearch('Ugbowo'); return regAtAddress(ZUMA).length; }""")
    r = run("""async () => {
      document.querySelector('[data-b="dec"][data-k="order"][data-v="quiet"]').click();
      document.querySelector('[data-b="lead"][data-id="stakeout"]').click();
      const n = document.querySelectorAll('.lead.on').length;
      document.querySelector('[data-b="commit"]').click(); await T.sleep(150);
      for(let i=0;i<9;i++){
        const txt = document.getElementById('so-txt').textContent;
        if(/Ghana-must-go/.test(txt)) document.querySelector('[data-so="photo"]').click();
        if(/Corolla stops/.test(txt)){ document.querySelector('[data-so="photo"]').click(); document.querySelector('[data-so="plate"]').click(); }
        if(/pulls away/.test(txt)){ document.querySelector('[data-so="follow"]').click(); break; }
        const nx = document.querySelector('[data-so="next"]'); if(nx) nx.click(); await T.sleep(30);
      }
      document.querySelector('[data-so="finish"]').click(); await T.sleep(100);
      await T.next(4); document.querySelector('[data-b="done"]').click(); await T.sleep(100);
      const W = window.loadMission;
      return { oneLead: n === 1, match: intelHas('so_plate_match'), inv: ['inv_engineer','inv_stakeout'].map(intelHas), shown:T.shown() };
    }""")
    check('Quiet investigation uses a lead slot; stakeout matches the plate; both become exhibits', r['oneLead'] and r['match'] and all(r['inv']), str(r))

    # ---- M6 → Week 4: false story + production order step ----
    r = run("""async () => {
      S.game.completedMissions.push('m6'); S.game.currentMission = 'm6'; S.game.moralChoices.asaba = 'rescue';
      collectEvidence({id:'asaba_sims', name:'SIMs', xp:60}); collectEvidence({id:'asaba_hostage', name:'Tobi', xp:160});
      S.game._opBumps = 0; intelOnMissionEnd('m6');
      maybeBriefingBefore('m7', ()=>{}); await T.sleep(100);
      document.querySelector('[data-b="dec"][data-k="press"][data-v="trace"]').click();
      document.querySelector('[data-b="lead"][data-id="burner"]').click();
      document.querySelector('[data-b="lead"][data-id="tobi"]').click();
      document.querySelector('[data-b="commit"]').click(); await T.sleep(120);
      await T.next(4);
      const phase = BRF.phase;
      return { phase, score: warrantScore(WARRANTS[1]) };
    }""")
    check('Week 4 reaches the production-order step', r['phase']=='warrant', str(r))
    shot('03_brief_w4_order')
    r = run("""async () => {
      ['bu_contacts','bu_ping_ugbowo','bu_msg_student','bu_ph_gate','bu_del_foundation','bu_msg_accountant'].forEach(id=>flagClue(id,true));
      renderBriefing(); await T.sleep(50);
      document.querySelector('[data-b="warrant"][data-route="standard"]').click(); await T.sleep(80);
      await T.next(3); document.querySelector('[data-b="done"]').click(); await T.sleep(80);
      moneyTrace('n_kc'); moneyTrace('n_odogwu'); moneyTrace('n_bluewater'); moneyTrace('n_charity'); moneyTrace('n_ca');
      return { cdr: I().warrants.w_cdr, ca: intelHas('inv_ca'), silver: !!I().reg.found.silverline };
    }""")
    check('Production order decided; the C.A. trail becomes an exhibit', r['cdr'] and r['cdr'].get('status') in ('granted','refused') and r['ca'] and r['silver'], json.dumps(r)[:200])

    # ---- M7 → Week 5: caretaker (Igbo) + Ekosodin warrant via Zonal ----
    r = run("""async () => {
      S.game.completedMissions.push('m7'); S.game.currentMission = 'm7'; S.game.moralChoices.tower = 'hold';
      collectEvidence({id:'tower_cdr', name:'Call Records', xp:90}); collectEvidence({id:'tower_fix', name:'Handset Fix', xp:140}); intelOnMissionEnd('m7');
      maybeBriefingBefore('m8', ()=>{}); await T.sleep(100);
      document.querySelector('[data-b="lead"][data-id="caretaker"]').click();
      document.querySelector('[data-b="lead"][data-id="pattern"]').click();
      for(const id of ['tower_cdr','tower_fix']){ const b = document.querySelector(`[data-b="cert"][data-id="${id}"]`); if(b){ b.click(); await T.sleep(20); } }
      document.querySelector('[data-b="commit"]').click(); await T.sleep(150);
      for(let g=0; g<40 && T.shown().includes('screen-dialogue'); g++){ skipTypewriter(); const ch=[...document.querySelectorAll('#dlg-choices button')]; if(ch.length) ch[0].click(); else advanceDialogue(); await T.sleep(30); }
      await T.sleep(100); await T.next(4);
      document.querySelector('[data-b="warrant"][data-route="zonal"]').click(); await T.sleep(80);
      await T.next(3); document.querySelector('[data-b="done"]').click(); await T.sleep(80);
      return { back: musaGaveTip(), eko: I().warrants.w_eko, known: I().known.eko_house || [], cert: I().items.tower_cdr.cert };
    }""")
    check('Caretaker in Igbo opens the back gate; Ekosodin warrant via Zonal stays hidden from her', r['back'] and r['eko']['status']=='granted' and 'Cdr. Adaeze' not in r['known'] and r['cert'], json.dumps(r)[:240])

    # ---- the finale: v12's accusation reads the findings ----
    r = run("""async () => {
      intelOnMissionStart('m8'); S.game.currentMission = 'm8';
      collectEvidence({id:'fin_recording', name:'Recorded Call', xp:120}); collectEvidence({id:'fin_drive', name:'Drive', xp:150});
      S.game.flags.fin_bodycam = true;
      const strong = V12.strongAgainstAdaeze();
      const k = finaleRevealScript(); const L = DIALOGUE[k].map(l=>l.text||'');
      return { strong: Object.keys(strong), budget: L.some(t=>/I found the money/.test(t)), style: !!I().styleAtFinale, items: S.game.evidence.map(e=>e.id).filter(x=>x.startsWith('inv_')) };
    }""")
    check('Accusation counts the C.A. record, gatehouse log and stakeout as strong', all(x in r['strong'] for x in ['inv_ca','inv_gatehouse','inv_stakeout']), str(r['strong']))
    check("Her funding argument and her read of you are in the reveal", r['budget'] and r['style'], str(r))
    r = run("""async () => {
      S.game._acc = { who:'adaeze', picks:['inv_ca','inv_gatehouse','fin_recording'] };
      const strong = V12.strongAgainstAdaeze(); const s = S.game._acc.picks.filter(id=>strong[id]).length + 1;
      S.game.completedMissions.push('m8'); S.game.moralChoices.finale = s >= 3 ? 'proven' : s === 2 ? 'contested' : 'unproven';
      intelOnMissionEnd('m8');
      startEpilogue(); await T.sleep(120);
      return { outcome: S.game.moralChoices.finale, shown: T.shown(), ex: COURT.ex.map(x=>[x.id,x.k]) };
    }""")
    check('A proven finale goes to trial before the epilogue', r['outcome']=='proven' and 'screen-court' in r['shown'] and len(r['ex'])>=8, json.dumps(r)[:300])
    shot('04_court_pretrial')
    r = run("""async () => {
      [...document.querySelectorAll('[data-ct="cert"]')].slice(0,2).forEach(b=>b.click());
      const c = document.querySelector('[data-ct="ctc"]'); if(c) c.click();
      document.querySelector('[data-ct="begin"]').click(); await T.sleep(40);
      const best = { s84:'cert', custody:'keeper', noorder:'s14', warrantless:'s14', inducement:'corroborate', accomplice:'corroborate', hearsay:'witness', photocopy:'ctc', ident:'plate', deception:'s14', contested:'explain', none:'tender' };
      for(let n=0; n<80 && COURT.phase !== 'judgment'; n++){
        if(COURT.phase==='ex'){ const x=COURT.ex[COURT.i]; (document.querySelector(`[data-ct="resp"][data-v="${best[x.k]}"]:not([disabled])`)||document.querySelector('[data-ct="resp"][data-v="withdraw"]')||document.querySelector('[data-ct="resp"]')).click(); }
        else if(COURT.phase==='ruling') document.querySelector('[data-ct="next"]').click();
        await T.sleep(15);
      }
      renderCourt(); await T.sleep(40);
      return { court: I().court, epi: courtEpilogueText() };
    }""")
    check('Trial judgment computed', r['court'] and len(r['court']['proven'])>=2, json.dumps(r)[:260])
    shot('05_court_judgment')
    r = run("""async () => {
      document.querySelector('[data-ct="end"]').click(); await T.sleep(200);
      const s0 = T.shown(); const ad = EPI.slides.find(x=>x.name==='COMMANDER ADAEZE');
      for(let i=0;i<30 && T.shown().includes('screen-epilogue');i++){ advanceEpilogue(); await T.sleep(40); }
      const s1 = T.shown();
      return { s0, adaeze: ad && ad.text, s1, pct: reviewData().pct };
    }""")
    check('Epilogue uses the verdict, then the case review opens', 'screen-epilogue' in r['s0'] and 'Convicted' in (r['adaeze'] or '') and 'screen-review' in r['s1'], str(r))
    shot('06_review')
    r = run("""async () => { document.getElementById('btn-review-done').click(); await T.sleep(100); return T.shown(); }""")
    check('Review → title screen', 'screen-title' in r, str(r))
    # desk + ops-table button + radio
    r = run("""async () => {
      S.game.currentMission = 'm7'; openDesk('locker'); await T.sleep(80); const d = T.shown().includes('screen-desk');
      closeDesk(); V12.openOps(); await T.sleep(150); const ob = !!document.getElementById('ops-desk'); V12.closeOps && V12.closeOps(); showOverlay(null);
      ENGINE.movementEnabled = true; radioPlay('m7'); await T.sleep(300); const rs = document.getElementById('radio-sub');
      return { d, ob, radio: !!rs && rs.classList.contains('show'), lines: I().radio.m7 };
    }""")
    check('Desk opens; ops table has a CASE DESK button; news plays on the radio strip', r['d'] and r['ob'] and r['radio'], str(r))
    shot('07_radio')
    run("async () => { ENGINE.movementEnabled = false; }")
    pg.set_viewport_size({'width':390,'height':844})
    run("async () => { openDesk('locker'); }"); shot('08_locker')
    run("async () => { DESK.tab='money'; renderDesk(); }"); shot('09_money')
    b.close()
    print('\nERRORS:', len(errs)); [print('  ', e) for e in errs[:15]]
    fails = [x for x in results if not x[1]]
    print(f'\n{len(results)-len(fails)}/{len(results)} checks passed')
srv.shutdown()
