// tac_interact: spent targets step aside (the default table, DESIGN §3.4) and a press on nothing says why (§5.5).
// Drives m2 and m3 through tryInteract() and the #ctx-main click (F-M9), the Senior hidden-trace case (F-M4) and the
// priority-reassignment case (F-M6).
// Owner: Team A.
const T = require('./tactics_lib.cjs');
const lib = T.lib;

// in-page: who wins each reachable cell of a rectangle
const CELLS = `window.__cells = function(rect, step, labels){
  const P = ENGINE.player.position, x0 = P.x, z0 = P.z, out = { cells:0, win:{} };
  for (let x = rect[0]; x <= rect[1] + 1e-9; x += step) for (let z = rect[2]; z <= rect[3] + 1e-9; z += step) {
    if (blockedAt(x, z)) continue;
    P.x = x; P.z = z;
    const it = nearestInteractable(); if (!it || (labels && !labels.includes(it.label))) continue;
    out.cells++; out.win[it.label] = (out.win[it.label] || 0) + 1;
  }
  P.x = x0; P.z = z0; return out;
};`;

module.exports = async h => {
  // ---------- m2: the scanned phone steps aside for KC ----------
  await T.deviceMarket(h, { seed:2 });
  await h.ev(src => { eval(src); }, CELLS);
  const pre = await h.ev(() => {
    S.game._marketTunde = true; S.game._marketScanned = false;
    // before the scan: every out-of-cone cell within 2.0 m of the phone picks the phone (M-M2)
    const P = ENGINE.player.position, kc = ENGINE._marketKC, phone = ENGINE.interactables.find(i => i.label === 'Scan suspect phone').mesh;
    let n = 0, phoneWins = 0, other = [];
    for (let x = 5; x <= 10.5; x += 0.25) for (let z = 1; z <= 7; z += 0.25) {
      if (blockedAt(x, z)) continue;
      if (Math.hypot(x - phone.position.x, z - phone.position.z) >= 2.0) continue;
      const dx = x - kc.position.x, dz = z - kc.position.z, d = Math.hypot(dx, dz);
      const ang = Math.acos(Math.max(-1, Math.min(1, (dx * Math.sin(kc.rotation.y) + dz * Math.cos(kc.rotation.y)) / (d || 1)))) * 180 / Math.PI;
      if (ang <= 50) continue;
      P.x = x; P.z = z; n++;
      const it = nearestInteractable(); if (it && it.label === 'Scan suspect phone') phoneWins++; else other.push([x, z, it && it.label]);
    }
    return { n, phoneWins, other:other.slice(0, 5) };
  });
  h.log('before the scan, out-of-cone cells within 2.0 m of the phone:', JSON.stringify(pre));
  h.assert(pre.n > 10 && pre.phoneWins === pre.n, 'before the scan the phone wins every out-of-cone cell within 2.0 m');
  const post = await h.ev(() => { S.game._marketScanned = true; return __cells([5, 10.5, 1, 7], 0.25, ['Scan suspect phone', 'Confront teen suspect']); });
  h.log('after the scan, counter cells:', JSON.stringify(post));
  h.assert(post.cells > 100 && !post.win['Scan suspect phone'] && post.win['Confront teen suspect'] === post.cells, 'after the scan the phone wins 0 counter cells and KC all of them');
  const lone = await h.ev(() => {
    const kcIt = ENGINE.interactables.find(i => i.label === 'Confront teen suspect'); kcIt.consumed = true;   // KC out of reach: the phone is alone
    const P = ENGINE.player.position; P.x = 6.3; P.z = 4.2;
    const it = nearestInteractable(); let toastTxt = null;
    tryInteract(); const t = document.getElementById('toast'); toastTxt = t ? t.textContent : null;
    kcIt.consumed = false;
    return { label:it && it.label, toastTxt };
  });
  h.log('lone spent phone', JSON.stringify(lone));
  h.assert(lone.label === 'Scan suspect phone' && /ALREADY SCANNED/.test(lone.toastTxt || ''), 'a lone spent phone still answers ALREADY SCANNED');
  // the pt_logger Test gate (priority 99) still wins
  const gate = await h.ev(() => { const P = ENGINE.player.position; P.x = 6.8; P.z = 4;
    const g = { mesh:{ position:{ x:P.x, y:0, z:P.z } }, label:'Test gate', range:3, priority:99, onInteract:() => {} }; ENGINE.interactables.push(g);
    const w = (nearestInteractable() || {}).label; ENGINE.interactables.splice(ENGINE.interactables.indexOf(g), 1); return w; });
  h.assert(gate === 'Test gate', "pt_logger's Test gate (priority 99) still wins");
  // tryInteract() at (6.8, 4) starts the chase
  const go = await h.ev(() => { completeObjective('o1_tunde'); completeObjective('o2_scan'); const P = ENGINE.player.position; P.x = 6.8; P.z = 4;
    const it = nearestInteractable(); tryInteract(); const c = !!CHASE.active; if (c) stopChase(); return { label:it && it.label, chase:c }; });
  h.log('tryInteract at (6.8, 4):', JSON.stringify(go));
  h.assert(go.label === 'Confront teen suspect' && go.chase, 'tryInteract() at (6.8, 4) after the scan starts the chase');
  // the #ctx-main click does the same (a fresh run)
  await T.deviceMarket(h, { seed:2 });
  const click = await h.ev(() => {
    S.game._marketTunde = true; S.game._marketScanned = true; completeObjective('o1_tunde'); completeObjective('o2_scan');
    const P = ENGINE.player.position; P.x = 6.8; P.z = 4;
    document.getElementById('ctx-main').click();
    const c = !!CHASE.active; if (c) stopChase(); return c;
  });
  h.assert(click, 'the #ctx-main click at (6.8, 4) starts the chase');

  // ---------- the miss line ----------
  await T.start(h, 'm2', { seed:4 });
  await h.ev(() => __wf.run(0.3));
  const miss = await h.ev(() => {
    const P = ENGINE.player.position; P.x = 0; P.z = 0; TAC._miss.at = -1e9;
    const txt = () => { const c = document.querySelector('#hint-chip.show .hc-text'); return c ? c.textContent : null; };
    tryInteract();
    const first = { text:txt(), n:TAC._miss.n };
    tryInteract();
    const second = { text:txt(), n:TAC._miss.n };
    return { first, second, tracker:WAY.trackerText() };
  });
  h.log('miss line', JSON.stringify(miss));
  h.assert(/^Nothing in reach — .+ is \d+ m away$/.test(miss.first.text || ''), 'the miss line: "Nothing in reach — <tracker> is N m away"');
  h.assert(miss.first.text.indexOf(miss.tracker) > 0, 'it repeats the tracker text');
  h.assert(miss.second.n === miss.first.n, 'a second press within 4 s shows nothing new');
  // over a teaching hint: nothing
  const teach = await h.ev(() => {
    TAC._miss.at = -1e9; const n0 = TAC._miss.n;
    showHint('tac_test_teach', 'A teaching hint', 'A teaching hint', 5000);
    tryInteract();
    const c = document.querySelector('#hint-chip.show .hc-text');
    return { n:TAC._miss.n - n0, text:c ? c.textContent : null };
  });
  h.assert(teach.n === 0 && teach.text === 'A teaching hint', 'no miss line over a teaching hint');
  // in a chase: nothing
  await h.ev(() => { clearHint(); });
  await lib.marketChase(h);
  const chase = await h.ev(() => { const P = ENGINE.player.position; P.x = 0; P.z = 0; TAC._miss.at = -1e9; const n0 = TAC._miss.n;
    const active = !!CHASE.active; tryInteract(); const r = { active, n:TAC._miss.n - n0, shown:!!document.querySelector('#hint-chip.show') }; stopChase(); return r; });
  h.assert(chase.active && chase.n === 0 && !chase.shown, 'no miss line in a chase');
  // tac_mission: one summary per completeMission (silent included), with this scene's counts
  await T.capture(h);
  await h.ev(() => { ENGINE.keys.KeyC = true; __wf.run(0.5); ENGINE.keys.KeyC = false; __wf.run(0.1); completeMission('m2', { silent:true }); });
  const tm = (await T.events(h, 'tac_mission')).map(e => e[1]);
  h.log('tac_mission', JSON.stringify(tm));
  const tf = ['m', 'crouchMode', 'crouchSecs', 'crouchOn', 'missShown', 'missSuppressed', 'radio', 'seen', 'evaded', 'geo'];
  h.assert(tm.length === 1 && tf.every(f => f in tm[0]) && tm[0].m === 'm2', 'tac_mission is logged once on completeMission("m2", {silent}) with every §4 field');
  h.assert(tm[0].missShown === 1 && tm[0].missSuppressed === 3 && tm[0].crouchOn === 1 && Math.abs(tm[0].crouchSecs - 0.5) < 0.05, 'tac_mission counts the miss lines and the crouch');
  h.assert(['shown', 'dropped', 'preempted'].every(k => k in tm[0].radio) && ['notice', 'alarm'].every(k => k in tm[0].seen) && ['boxes', 'ghost', 'unknown'].every(k => k in tm[0].geo) && tm[0].geo.unknown === 0,
    'tac_mission radio{shown,dropped,preempted}, seen{notice,alarm}, geo{boxes,ghost,unknown}');
  // m0 (the cold open runs its own chips): nothing
  // ---------- Senior: a hidden SCAN trace 1 m beyond its range is never named; Recruit gets "Move closer" ----------
  await T.start(h, 'm2', { seed:4 });
  await h.ev(() => __wf.run(0.3));
  const sen = await h.ev(() => {
    const P = ENGINE.player.position; P.x = -1; P.z = -8;
    const trace = { mesh:{ position:{ x:P.x + 2.9, y:0.25, z:P.z }, visible:false }, label:'Log trace: Burner SIM', verb:'collect', range:1.9, optional:true, onInteract:() => {} };
    ENGINE.interactables.push(trace);
    const txt = () => { const c = document.querySelector('#hint-chip.show .hc-text'); return c ? c.textContent : ''; };
    S.game.difficulty = 'senior'; TAC._miss.at = -1e9; tryInteract(); const senior = txt();
    S.game.difficulty = 'recruit'; TAC._miss.at = -1e9; tryInteract(); const recruit = txt();
    // a visible non-tracker target just out of reach: Recruit is told to move closer, Senior is not
    trace.mesh.visible = true;
    S.game.difficulty = 'recruit'; TAC._miss.at = -1e9; tryInteract(); const recruitVis = txt();
    S.game.difficulty = 'senior'; TAC._miss.at = -1e9; tryInteract(); const seniorVis = txt();
    ENGINE.interactables.splice(ENGINE.interactables.indexOf(trace), 1);
    // the tracker's own target just out of reach: Senior may name it (it is what the HUD already says)
    const tunde = ENGINE.interactables.find(i => i.label === 'Speak with Informant Tunde');
    P.x = tunde.mesh.position.x + 3.2; P.z = tunde.mesh.position.z;
    TAC._miss.at = -1e9; tryInteract(); const seniorTracker = txt();
    return { senior, recruit, recruitVis, seniorVis, seniorTracker, resolved:(WAY.resolve() || {}).label };
  });
  h.log('senior/recruit', JSON.stringify(sen));
  h.assert(!/trace|Burner/i.test(sen.senior) && !/trace|Burner/i.test(sen.recruit), 'an unrevealed SCAN trace 1 m beyond its range is never named (Senior or Recruit)');
  h.assert(/^Move closer — Log trace: Burner SIM$/.test(sen.recruitVis), 'Recruit: "Move closer — <label>" for any live target within range + 1.5 m');
  h.assert(/^Nothing in reach — /.test(sen.seniorVis) && !/Burner/.test(sen.seniorVis), 'Senior: a live target that is not the tracker\'s is not named');
  h.assert(/^Move closer — Speak with Informant Tunde$/.test(sen.seniorTracker), 'Senior: the tracker\'s own target is named');

  // ---------- m3: after the arrest, Obi steps aside for the drawer and the safe ----------
  await T.deviceMansion(h, { seed:6 });
  await h.ev(src => { eval(src); }, CELLS);
  const m3 = await h.ev(() => {
    S.game._mansionPreBriefed = true; S.game.moralChoices.arrest = 'professional';
    const labels = ['Move on suspect', 'Search the open drawer', 'Crack the safe'];
    const inDS = () => { const P = ENGINE.player.position; const d = ENGINE.interactables.find(i => i.label === 'Search the open drawer'), s = ENGINE.interactables.find(i => i.label === 'Crack the safe');
      return Math.hypot(P.x - d.mesh.position.x, P.z - d.mesh.position.z) < d.range || Math.hypot(P.x - s.mesh.position.x, P.z - s.mesh.position.z) < s.range; };
    const count = () => { const P = ENGINE.player.position, x0 = P.x, z0 = P.z, out = { cells:0, obi:0 };
      for (let x = 1; x <= 5; x += 0.25) for (let z = -4.4; z <= 1; z += 0.25) { if (blockedAt(x, z)) continue; P.x = x; P.z = z; if (!inDS()) continue; out.cells++; const it = nearestInteractable(); if (it && it.label === 'Move on suspect') out.obi++; }
      P.x = x0; P.z = z0; return out; };
    const a = count();
    __wf.run(1 / 60);
    const obi = ENGINE.interactables.find(i => i.label === 'Move on suspect'); obi.priority = () => 3;
    __wf.run(1 / 60);
    const b = count();
    return { a, b };
  });
  h.log('m3 drawer/safe cells:', JSON.stringify(m3));
  h.assert(m3.a.cells > 5 && m3.a.obi === 0, "after the arrest 'Move on suspect' wins 0 drawer/safe cells");
  h.assert(m3.b.obi === 0, 'assigning it.priority = () => 3 on Obi does not bring the steal back');
  const m3go = await h.ev(() => {
    S.game._evLaptop = true;            // the laptop is secured (spent), so its wipe priority doesn't decide this cell
    const P = ENGINE.player.position; P.x = 2.0; P.z = -0.3;
    const it = nearestInteractable(); tryInteract();
    return { label:it && it.label, searched:!!S.game._drawerSearched };
  });
  h.log('m3 tryInteract by the drawer:', JSON.stringify(m3go));
  h.assert(m3go.label === 'Search the open drawer' && m3go.searched, 'tryInteract() by the drawer searches it (Obi in reach, arrested)');
  const m3click = await h.ev(() => {
    const P = ENGINE.player.position; P.x = 3.6; P.z = -2.9;
    const it = nearestInteractable(); const ov0 = [...document.querySelectorAll('.overlay.show')].map(o => o.id);
    document.getElementById('ctx-main').click();
    const ov1 = [...document.querySelectorAll('.overlay.show')].map(o => o.id);
    return { label:it && it.label, ov0, ov1 };
  });
  h.log('m3 #ctx-main by the safe:', JSON.stringify(m3click));
  h.assert(m3click.label === 'Crack the safe' && m3click.ov1.length > m3click.ov0.length && !m3click.ov1.includes('screen-dialogue'), 'the #ctx-main click by the safe opens the safe, not the arrest');
  await T.restoreArt(h);
  h.assert(!h.errors.length, 'no page errors');
};
