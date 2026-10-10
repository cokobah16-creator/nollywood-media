// v13 port · tools/playthrough.py with the INTEGRATED semantics: one save per choice policy, played from
// Case 01 to Case 07's aftermath through everything the friends beta and v12.2 put between the missions —
// the aftermath's CONTINUE, the offices (Uche, the phone, the Commander), the charge sheets and warrants
// at h2/h5 (V12.raidGate), the M2 operations-table gate, Night Shift, the v13 briefings in the Commander's
// call (policy 2), the title cards. Each mission is played by the drop's driver (teleport to each
// interactable, press E; dialogue choice k; v11 field skills, v12 documents and puzzles solved; the raid
// plan committed), plus a chase handler (wayfind_lib: the player runs the route line at 85% of touch
// sprint, so the KC and Ifeanyi chases can be caught under the three.js stub).
// Policies (the drop's k: dialogue choice index; odd k approaches targets in reverse, so Asaba is a
// chase for even k and a rescue for odd k):
//   0 · by the book — four links that hold on the M2 table, the right charge sheets, signed warrants
//   1 · fail forward — three wrong links (refused at three strikes), KC on the Lagos sheet, exigent entry
//       at Lekki and Asaba (the beta's costs: Agency −5, contested raid evidence; v13: 'warrantless', once)
//   2 · v13 on — as 0, but every v13 briefing runs in its office's call (h.start(..., {briefings:true}))
// Asserted per policy: every mission M1–M7 (and Night Shift) completes, every office on the way is done,
// and the key flags above. PT_KS=0,1,2 picks policies (default all three).
const LIB = require('./v13_port_lib.cjs');

// ---------------- the drop's driver (tools/playthrough.py DRIVER), as one mission's play ----------------
// Differences: no state reset (the save carries on); returns early when the beta or v13 puts up a screen
// the driver doesn't own (a charge sheet, a warrant, a briefing, the phone); a chase is run on foot; the
// M2 table gate is worked by the policy before the van.
const PLAY = async ({ mid, k, table }) => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const shown = () => [...document.querySelectorAll('.overlay.show')].map(e => e.id);
  const log = [];
  const FOREIGN = ['screen-briefing', 'screen-charge', 'screen-warrant', 'screen-phone', 'screen-accuse', 'screen-desk', 'screen-so', 'screen-uc'];
  const foreign = () => shown().find(x => FOREIGN.includes(x)) || null;
  const terminal = /Extract|Deploy|Board NACECA|^Go home/;
  const done = () => shown().includes('screen-aftermath') || (S.game.completedMissions.includes(mid) && (shown().includes('screen-controls') || shown().includes('screen-aftermath') || !!document.querySelector('#title-card.show') || S.game.currentMission !== mid));
  let steps = 0, stall = 0, lastSig = '', yielded = null;
  // the M2 table: the policy files its links once the phone is scanned and KC is dealt with
  const tableWork = () => {
    if(mid !== 'm2' || S.game._portTable || !S.game._marketScanned || !S.game.moralChoices.market_runner) return;
    S.game._portTable = true;
    const links = table === 'wrong' ? [['s_obi', 'l_market'], ['s_tunde', 's_kc'], ['s_mama', 'l_mushin']] : [['s_obi', 'e_wallet'], ['e_wallet', 'm_pos'], ['m_pos', 'l_market'], ['s_kc', 'l_market']];
    // one at a time, like a player filing as they go (a link filed with the third strike doesn't count)
    links.forEach(([a, b]) => { V12.pencil(a, b); V12.fileLinks(); });
    if(document.querySelector('#screen-ops.show') && V12.closeOps) V12.closeOps();
    if(typeof V12.m2TableCheck === 'function') V12.m2TableCheck();
    showOverlay(null); showHUD(true); ENGINE.movementEnabled = true;
    log.push('table:' + table + ' inked:' + V12.ops().inked.length + ' strikes:' + V12.caseStrikes('lagos'));
  };
  // three.js stub: a fleeing Ifeanyi steers with Vector3.length(), which the stub can't do (its
  // 'length' is 0). Stub-only shim: when that throws, he has reached the van (what the real update does).
  const rn = typeof ENGINE !== 'undefined' && ENGINE._asabaRunner;
  // (the mark goes on the function: any unknown property of a stub object reads as a truthy stub)
  if(mid === 'm6' && rn && typeof rn.update === 'function' && rn.update._port !== true){
    const up = rn.update;
    rn.update = function(dt){ try{ return up.call(this, dt); }catch(e){ if(rn.userData && rn.userData._fled){ rn.visible = false; rn.userData._escaped = true; } } };
    rn.update._port = true;
  }
  const chase = () => {
    if(typeof CHASE === 'undefined' || !CHASE.active || typeof __portPursue !== 'function') return false;
    if(mid === 'm6' && k % 2 === 1) return false;       // odd policies go for the hostage, and let Ifeanyi run
    const r = __portPursue(60); log.push('chase:' + (CHASE.active ? 'running' : r.caught ? 'caught' : 'over') + ' ' + r.t.toFixed(1) + 's');
    return true;
  };
  async function handleOverlays(){
    for(let g = 0; g < 60; g++){
      if((yielded = foreign())) return;
      const sh = shown();
      if(sh.includes('screen-dialogue')){
        if(typeof skipTypewriter === 'function') skipTypewriter();
        const ch = [...document.querySelectorAll('#dlg-choices button')];
        if(ch.length){ const c = ch[Math.min(k, ch.length - 1)]; log.push('choice:' + c.textContent.trim().slice(0, 40)); c.click(); await sleep(30); if(c.isConnected && c.classList.contains('armed')) c.click(); }
        else if(!document.querySelector('#dlg-continue').classList.contains('hide')) advanceDialogue();
        await sleep(40); continue;
      }
      if(sh.includes('screen-minigame') && typeof MINI !== 'undefined' && MINI.active){
        const run = MINI.active;
        if(run.phase === 'play'){ miniSuccess(run, { stars:3 }); log.push('mini:' + (run.cfg.id || run.cfg.type)); }
        else { const b = document.querySelector('#mg-actions button'); if(b) b.click(); }
        await sleep(80); continue;
      }
      if(sh.includes('screen-puzzle') && document.querySelector('.puzzle-frame.v12-doc')){
        const title = (document.querySelector('.puzzle-frame.v12-doc h2') || {}).textContent;
        const key = Object.keys(PUZZLES).find(x => PUZZLES[x].title === title);
        // v12.2 documents opened straight through V12.openDoc (Night Shift's notebook) have no PUZZLES entry
        const spec = (window.__portDoc && window.__portDoc.title === title) ? window.__portDoc : key && V12.docFromPuzzle && V12.docFromPuzzle(key);
        if(spec){
          const oi = spec.options.findIndex(o => o.correct); const ob = document.querySelectorAll('#v12-opts .v12-opt')[oi]; if(ob) ob.click();
          const line = [...document.querySelectorAll('#v12-lines .v12-line.live')].find(l => spec.proof.some(x => l.textContent.includes(x))); if(line) line.click();
          const go = document.getElementById('v12-doc-go'); if(go && !go.disabled) go.click();
          log.push('doc:' + (spec.key || key));
        } else { const x = document.getElementById('v12-doc-x'); if(x) x.click(); }
        await sleep(1600); continue;
      }
      if(sh.includes('screen-plan')){ const g2 = document.getElementById('plan-go'); if(g2){ g2.click(); log.push('plan'); } await sleep(200); continue; }
      if(sh.includes('screen-ops')){ if(typeof V12 !== 'undefined' && V12.closeOps) V12.closeOps(); else showOverlay(null); await sleep(80); continue; }
      if(sh.includes('screen-puzzle')){
        const title = document.querySelector('#puzzle-title').textContent;
        const key = Object.keys(PUZZLES).find(x => PUZZLES[x].title === title);
        const ci = key ? PUZZLES[key].options.findIndex(o => o.correct) : 0;
        log.push('puzzle:' + (key || title));
        document.querySelectorAll('#puzzle-options .puzzle-option')[Math.max(0, ci)].click();
        await sleep(1600); continue;
      }
      if(chase()){ await sleep(60); continue; }
      return;
    }
  }
  while(steps < 140){
    steps++;
    await handleOverlays(); if(yielded) break;
    tableWork();
    if(done()) break;
    const its = ENGINE.interactables.slice();
    const sig = JSON.stringify([S.game.objectives && S.game.objectives.map(o => o.done), S.game._opEv, S.game.flags, S.game.moralChoices, S.game.completedMissions.length, its.length]);
    if(sig === lastSig) stall++; else { stall = 0; lastSig = sig; }
    let pool = stall >= 2 ? its : its.filter(i => !terminal.test(i.label));
    if(k % 2 === 1) pool = pool.slice().reverse();      // odd policies approach targets in the other order
    for(const it of pool){
      if(done() || yielded) break;
      const pos = it.mesh && it.mesh.position;
      if(ENGINE.player && pos){ ENGINE.player.position.x = pos.x + 0.8; ENGINE.player.position.z = pos.z + 0.8; }
      await sleep(120);
      await handleOverlays(); if(yielded) break;
      try{ if(typeof onBeforeInteract === 'function') onBeforeInteract(it); it.onInteract(it); }catch(e){ log.push('THROW ' + it.label + ': ' + e.message); }
      await sleep(80);
      await handleOverlays(); if(yielded) break;
      tableWork();
    }
    if(yielded) break;
    for(const m of (ENGINE.evidenceMarkers || [])){ if(!m.collected && ENGINE.player && m.worldPos){ ENGINE.player.position.x = m.worldPos.x; ENGINE.player.position.z = m.worldPos.z; await sleep(150); } }
    if(stall >= 6) break;
    await sleep(300);
  }
  const ah = document.querySelector('.headline-block .head');
  return { mid, k, steps, stall, yielded, completed:S.game.completedMissions.includes(mid), cur:S.game.currentMission, overlays:shown(),
    headline:shown().includes('screen-aftermath') && ah ? ah.textContent : null,
    objectives:(S.game.objectives || []).map(o => (o.done ? '+' : '.') + o.id).join(' '), log:log.slice(-8) };
};

// the pursuit (wayfind_catch's player): run the route line at 85% of touch sprint, blocked by the stalls
const PURSUE = () => {
  // remember the document on screen (the driver reads its answer like the drop's driver read PUZZLES)
  if(!V12.openDoc._port){ const od = V12.openDoc; V12.openDoc = function(spec){ window.__portDoc = spec; return od.apply(this, arguments); }; V12.openDoc._port = true; }
  window.__portPursue = maxT => {
    const c = CHASE.active, P = ENGINE.player.position, b = ENGINE.bounds || { minX:-1e9, maxX:1e9, minZ:-1e9, maxZ:1e9 };
    const v = 0.85 * 5.2, dt = 1 / 60;
    let i = 0, t = 0;
    for(; i < maxT * 60 && CHASE.active === c; i++){
      const R = c.runner.position, pts = WAY.routePoints(c, P, R, c.seg);
      let aim = pts[1] || R; if(pts.length > 2 && Math.hypot(aim.x - P.x, aim.z - P.z) < 0.3) aim = pts[2];
      const dx = aim.x - P.x, dz = aim.z - P.z, d = Math.hypot(dx, dz) || 1, st = v * (ENGINE.speedMul || 1) * dt;
      const nx = P.x + dx / d * st, nz = P.z + dz / d * st;
      if(!blockedAt(nx, P.z) && nx > b.minX && nx < b.maxX) P.x = nx;
      if(!blockedAt(P.x, nz) && nz > b.minZ && nz < b.maxZ) P.z = nz;
      updatePressure(dt); if(typeof sideTick === 'function') sideTick(dt);
      t += dt;
    }
    return { caught:CHASE.active !== c && c.runner.visible !== false, t };
  };
};

const POLICY = {
  0:{ name:'by the book', table:'right', lagos:{ suspect:'obi', method:'phish', money:'wallet' }, route:{ suspect:'ifeanyi', method:'route', money:'asaba' }, routeBoard:true, briefings:false },
  1:{ name:'fail forward', table:'wrong', lagos:{ suspect:'kc', method:'phish', money:'wallet' }, route:{ suspect:'ifeanyi', method:'route', money:'asaba' }, routeBoard:false, briefings:false },
  2:{ name:'v13 on', table:'right', lagos:{ suspect:'obi', method:'phish', money:'wallet' }, route:{ suspect:'ifeanyi', method:'route', money:'asaba' }, routeBoard:true, briefings:true },
};
const MISSIONS = ['m1', 'm2', 'm3', 'm3n', 'm4', 'm5', 'm6', 'm7'];

// one policy's save, Case 01 to Case 07's aftermath
async function campaign(h, P, k){
  const B = P.B, pol = POLICY[k];
  let routeTable = null;                 // 'board': the route links signed it for real · 'stub': P.board signed it
  const vp = await h.ev(() => innerWidth + 'x' + innerHeight);
  h.log(`\n=== policy ${k} · ${pol.name} (${vp}) ===`);
  // ---------- the office between operations ----------
  const fileFor = async () => {
    const c = await h.ev(() => (document.querySelector('#screen-charge .cw-meta') || {}).textContent || '');
    await B.fileSheet(/LAGOS/.test(c) ? pol.lagos : pol.route);
    await B.dialogues();
  };
  const exigent = async () => {
    await B.click('#screen-warrant [data-act="exigent"]');
    await B.click('#screen-warrant [data-act="exigent"]');
    await h.step(150);
    await B.dialogues();
  };
  // a plain player at the briefing: the first option of each decision, the first leads on offer
  const runBriefing = async () => {
    // every tap redraws the plan, so each next button is looked up again
    const plan = await h.ev(() => {
      for(let i = 0; i < 6; i++){ const b = [...document.querySelectorAll('#screen-briefing [data-b="dec"]')].find(x => !BRF.dec[x.dataset.k]); if(!b) break; b.click(); }
      for(let i = 0; i < 6; i++){
        const c = document.querySelector('#screen-briefing [data-b="commit"]'); if(c && !c.disabled) break;
        const b = [...document.querySelectorAll('#screen-briefing [data-b="lead"]:not([disabled])')].find(x => !BRF.sel.includes(x.dataset.id)); if(!b) break;
        b.click();
      }
      return { k:BRF.k, dec:Object.assign({}, BRF.dec), sel:BRF.sel.slice() };
    });
    h.log(`  briefing ${plan.k}: ${JSON.stringify(plan.dec)} ${plan.sel.join('+')}`);
    if(await B.has('#screen-briefing [data-b="commit"]')) await B.click('#screen-briefing [data-b="commit"]', 2);
    await B.runToEnd();
    await B.click('#screen-briefing [data-b="done"]');
    await h.step(200);
  };
  const runHub = async hub => {
    if(hub === 'h5' && pol.routeBoard){
      // the player works the route case on the office's operations table: links that hold, one filing at a time
      // (a card whose fieldwork isn't in yet just isn't on the table: its pencil is dropped, never a strike)
      const w = await P.inkLinks('route', P.ROUTE_LINKS);
      h.log(`  h5 table: route strength ${w.strength}, ${w.signed ? 'signed' : 'not signed'} (strikes ${w.strikes})`);
      routeTable = w.signed ? 'board' : 'stub';
      if(!w.signed) await P.board(['route']);                          // short of a signature: the board signs (logged)
    }
    const ov = await P.office();
    if(ov.includes('screen-charge')) await fileFor();
    await B.dialogues();
    if(await P.shown('screen-warrant')) await exigent();
    await B.dialogues();
    if(await P.shown('screen-briefing')) await runBriefing();
    await B.dialogues();
    if(hub === 'h5') await P.boardReal();
    await P.until(() => !!document.querySelector('#title-card.show') || !(V12.HUBS && V12.HUBS[S.game.currentMission]), null, { timeout:4000 });
  };

  await P.WF.boot(h);
  await P.start('m1', { completed:['m0'], briefings:pol.briefings, state:pol.briefings ? (S => { S.game.intel = {}; }) : undefined });
  await h.ev(PURSUE);
  const runs = [], hubs = [], t0 = Date.now();
  let last = '';
  for(let guard = 0; guard < 160; guard++){
    const st = await h.ev(() => ({ cur:S.game.currentMission, done:(S.game.completedMissions || []).slice(), ov:[...document.querySelectorAll('.overlay.show')].map(o => o.id),
      card:!!document.querySelector('#title-card.show'), move:!!ENGINE.movementEnabled, hub:!!(V12.HUBS && V12.HUBS[S.game.currentMission]) }));
    if(st.done.includes('m7') && st.ov.includes('screen-aftermath')) break;
    const sig = JSON.stringify([st.cur, st.done.length, st.ov, st.card]);
    if(sig === last) await h.step(250);
    last = sig;
    if(st.card){ await P.noCard({ timeout:5000 }); continue; }
    if(st.ov.includes('screen-aftermath')){ await h.ev(() => document.getElementById('btn-aftermath-continue').click()); await h.step(200); continue; }
    if(st.ov.includes('screen-controls')){ await h.ev(id => beginMission(id), st.cur); await h.step(300); continue; }
    if(st.ov.includes('screen-briefing')){ await runBriefing(); continue; }
    if(st.ov.includes('screen-charge')){ await fileFor(); continue; }
    if(st.ov.includes('screen-warrant')){ await exigent(); continue; }
    if(st.hub && st.move){ if(!hubs.includes(st.cur)) hubs.push(st.cur); await runHub(st.cur); continue; }
    if(MISSIONS.includes(st.cur) && st.move){
      const r = await h.ev(PLAY, { mid:st.cur, k, table:pol.table });
      const prev = runs.find(x => x.mid === r.mid); if(prev) Object.assign(prev, r, { calls:prev.calls + 1 }); else runs.push(Object.assign(r, { calls:1 }));
      if(!r.yielded && !r.completed && r.stall >= 6){ h.log('  stalled in', r.mid, JSON.stringify(r)); break; }
      continue;
    }
    await h.step(250);
  }
  // ---- what this save looks like at Case 07's aftermath ----
  const f = await h.ev(() => {
    const acc = c => { const r = (S.game.accusations || {})[c]; return r ? { suspect:r.suspect, ok:r.ok, warrant:r.warrant, settled:!!r.settled } : null; };
    const fl = id => (typeof intelItemFlaws === 'function' ? intelItemFlaws(id).map(x => x.k) : []);
    return { done:S.game.completedMissions.slice(), hubs:Object.keys(V12.mem().hubs || {}), lagos:acc('lagos'), route:acc('route'),
      w:['w_lekki', 'w_asaba', 'w_cdr', 'w_eko'].map(id => V12.warrantState(id).status), inked:V12.ops().inked.length, strikes:V12.caseStrikes('lagos'),
      asaba:S.game.moralChoices.asaba, briefed:Object.assign({}, (S.game.intel || {}).briefed), brf:!!(S.game.intel || {}).brf,
      held:['laptop', 'cash', 'safe_drives', 'asaba_sims'].filter(id => V12.hasEv(id)), flaws:{ laptop:fl('laptop'), cash:fl('cash'), safe_drives:fl('safe_drives'), asaba_sims:fl('asaba_sims') },
      evQ:Object.assign({}, S.game.evQ || {}) };
  });
  const secs = ((Date.now() - t0) / 1000).toFixed(0);
  runs.forEach(r => h.log(`  ${r.completed ? 'OK ' : 'NO '} ${r.mid} steps=${r.steps} calls=${r.calls} obj=[${r.objectives}]  headline: ${r.headline || '-'}  log: ${JSON.stringify(r.log.slice(-3))}`));
  h.log(`  offices: ${hubs.join(' ')} · ${secs}s · ${JSON.stringify({ lagos:f.lagos, route:f.route, w:f.w, inked:f.inked, strikes:f.strikes, asaba:f.asaba, briefed:f.briefed, flaws:f.flaws })}`);
  await P.boardReal();
  h.assert(MISSIONS.every(m => f.done.includes(m)), `policy ${k}: the campaign completes M1–M7 and Night Shift (done: ${f.done.join(',')})`);
  h.assert(['h2', 'h4', 'h5', 'h6'].every(x => f.hubs.includes(x)), `policy ${k}: every office on the way was played (${f.hubs.join(',')})`);
  h.assert(f.lagos && f.lagos.settled && f.route && f.route.settled, `policy ${k}: both charge sheets filed and settled`);
  if(pol.table === 'right'){
    h.assert(f.inked >= 3 && f.strikes === 0, `policy ${k}: the M2 table gate passed on links that hold`);
    h.assert(f.lagos.warrant === 'signed' && f.w[0] === 'signed' && f.lagos.ok.suspect && f.lagos.ok.method && f.lagos.ok.money, `policy ${k}: Lekki signed on the board through the h2 sheet`);
    h.assert(f.route.warrant === 'signed' && f.w[1] === 'signed', `policy ${k}: Asaba signed through the h5 sheet`);
    for(const id of f.held) h.assert(!f.flaws[id].includes('warrantless'), `policy ${k}: no warrantless flaw on ${id} (signed raid)`);
  } else {
    h.assert(f.strikes >= 3, `policy ${k}: three strikes at the M2 table, the van went anyway`);
    h.assert(f.lagos.warrant === 'exigent' && f.w[0] === 'exigent' && f.lagos.ok.suspect === false, `policy ${k}: KC on the sheet, refused, exigent entry at Lekki`);
    h.assert(f.route.warrant === 'exigent' && f.w[1] === 'exigent', `policy ${k}: no signature for Asaba either: exigent`);
    for(const id of f.held) h.assert(f.flaws[id].includes('warrantless') && !f.flaws[id].includes('contested'), `policy ${k}: ${id} carries 'warrantless' once, not 'contested' as well (A6)`);
    h.assert(f.held.some(id => f.evQ[id]), `policy ${k}: the beta contested the raid exhibits (evQ)`);
  }
  h.assert(f.asaba === (k % 2 ? 'rescue' : 'chase'), `policy ${k}: Asaba is a ${k % 2 ? 'rescue' : 'chase'} (got ${f.asaba})`);
  if(pol.briefings){
    h.assert(['m3', 'm4', 'm5', 'm6'].every(x => f.briefed[x] === true) && !f.brf, `policy ${k}: every v13 briefing on the way ran and closed (${JSON.stringify(f.briefed)})`);
    h.assert(f.w[2] !== 'pending', `policy ${k}: the Ugbowo order was decided at h6 (${f.w[2]})`);
    // the order follows the board at decision time: a route case that really signed at h5 still signs at h6
    if(routeTable === 'board') h.assert(f.w[2] === 'signed', `policy ${k}: the route board signed, so the Ugbowo order is signed (${f.w[2]})`);
  } else h.assert(['m3', 'm4', 'm5', 'm6', 'm7'].every(x => f.briefed[x] === 1), `policy ${k}: briefings pre-marked, as the drop's playthrough did`);
  return { k, secs, runs:runs.map(r => r.mid + (r.completed ? '' : '!')).join(' '), lagos:f.lagos.warrant, route:f.route.warrant, asaba:f.asaba };
}

module.exports = async h => {
  const P = LIB.lib(h);
  const ks = (process.env.PT_KS || '0,1,2').split(',').map(Number);
  const out = [];
  for(const k of ks) out.push(await campaign(h, P, k));
  h.log('\n' + out.map(s => `policy ${s.k}: ${s.runs} · lagos ${s.lagos} · route ${s.route} · asaba ${s.asaba} · ${s.secs}s`).join('\n'));
  h.log('PASS v13_port_playthrough');
};
