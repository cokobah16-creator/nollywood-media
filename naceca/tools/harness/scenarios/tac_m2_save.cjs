// tac_m2_save · saves (market.md §2.7): an old-format save from mid-M2 (_marketTunde set, no m2_* flags) resumes with KC's
// watcher awake and calm, Uche at the van, and today's opening for a confront in the first second; a run restored after
// posting Uche puts him at his post at once; a save past M2 keeps kcIsFair() and V12.m3Intel().gate.known and gains no m2_* flag.
const M = require('./tac_m2_lib.cjs');
const T = M.T;

// write a save in the old format and resume it through the game's own load
const resume = (h, game) => h.ev(async game => {
  const d = defaultState();
  const save = { player:d.player, game:Object.assign(d.game, game) };
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  const ok = loadGame();
  S.game.intel = { briefed:{ m3:1, m4:1, m5:1, m6:1, m7:1 } };
  if (V12.mem){ const m = V12.mem(); m.hubs = m.hubs || {}; ['h1','h2','h3','h4','h5','h6','h7'].forEach(k => { m.hubs[k] = true; }); }
  ART.failed = true; ART.promise = null;
  showOverlay(null); loadMission(game.currentMission || 'm2');
  await new Promise(r => setTimeout(r, 600));
  if (document.querySelector('#screen-controls.show')) beginMission(game.currentMission || 'm2');
  await new Promise(r => setTimeout(r, 900));
  return { ok, cur:S.game.currentMission, flags:Object.keys(S.game.flags || {}) };
}, game);

module.exports = async h => {
  await T.lib.boot(h);
  // ---- mid-M2 on an older build: Tunde done, nothing else ----
  const r = await resume(h, { completedMissions:['m0', 'm1'], _marketTunde:true, flags:{}, moralChoices:{} });
  await T.lib.frozenClock(h); await T.lib.stepper(h); await M.install(h);
  const a = await h.ev(() => {
    const R = TAC.m2.run(), U = TAC.m2.uche();
    const P = ENGINE.player.position; P.x = 5.8; P.z = 4.6; TAC.player._reset();
    __wf.run(0.3);
    const st = TAC.m2.kc().state;
    const out = { awake:R.awake, wary:R.wary, active:st.active, level:st.level, watch:+R.watchSecs.toFixed(2), uche:[U.mesh.position.x, U.mesh.position.z], post:U.post, posted:U.posted,
      m2flags:Object.keys(S.game.flags).filter(k => /^m2_/.test(k)), tunde:!!S.game._marketTunde };
    S.game._marketScanned = true;
    const it = ENGINE.interactables.find(i => i.label === 'Confront teen suspect'); it.onInteract(it);
    const c = CHASE.active;
    out.row = c && c.tac.row; out.cfg = c && { burst:c.burst, head:c.headStart, speed:c.speed }; out.stagger = ENGINE._stagger;
    out.small = (document.querySelector('#toast .small') || {}).textContent;
    stopChase();
    return out;
  });
  h.log('resume mid-M2', JSON.stringify(r), JSON.stringify(a));
  h.assert(r.ok && r.cur === 'm2' && a.tunde, 'the old save loads into M2 with Tunde done');
  h.assert(a.awake && a.active && a.level === 'calm' && a.watch < 1 && !a.wary, 'KC\'s watcher is awake and calm, with no history (and not wary: no m2_met)');
  h.assert(a.uche[0] === -2.4 && a.uche[1] === 11.6 && a.post === 'van' && !a.posted, 'Uche is at the van');
  h.assert(a.m2flags.length === 0, 'no m2_* flag is read or created from an old save');
  h.assert(a.row === 'legacy' && a.cfg.burst && a.cfg.burst[0] === 1.2 && a.cfg.head === 0.4 && a.stagger === 0.5 && /shoves a tray/.test(a.small), 'the first confront within 1 s gets today\'s opening');

  // ---- a run restored after posting Uche (and the quiet tip): he is at his post at once; the back gate is ringed ----
  await resume(h, { completedMissions:['m0', 'm1'], _marketTunde:true, flags:{ m2_tunde:'quiet', m2_post:'back' }, moralChoices:{} });
  const b = await h.ev(() => { const U = TAC.m2.uche(); return { at:[U.mesh.position.x, U.mesh.position.z], post:U.post, arrived:U.arrived, crouch:U.mesh.scale.y,
    ring:MINIMAP.pois.some(p => p.color === '#0b6e4f'), gate:MINIMAP.pois.some(p => p.color === '#6b6b63'), flags:S.game.flags.m2_post }; });
  h.log('restored after posting', JSON.stringify(b));
  h.assert(b.post === 'back' && b.arrived && b.at[0] === 12.1 && b.at[1] === -19.9 && b.crouch === 0.8 && b.ring && b.gate && b.flags === 'back', 'restored after posting: Uche at the gate at once, crouched; the post ring and the back-gate ring');

  // ---- seen at the meeting, then saved and reloaded: KC is still wary (the brief: "for the rest of the run"; B-MIN-3) ----
  for (const seen of [true, false]) {
    await resume(h, { completedMissions:['m0', 'm1'], _marketTunde:true, flags:{ m2_tunde:'loud', m2_met:{ seen, habit:!seen, tip:false } }, moralChoices:{} });
    const w = await h.ev(() => { const R = TAC.m2.run(); return { wary:R.wary, phase:R.phase, len:+R.phaseLen.toFixed(3), tu:{ wary:R.tunde.wary, choice:R.tunde.choice, habit:R.tunde.habit }, met:S.game.flags.m2_met }; });
    h.log('reload, seen at the meeting: ' + seen, JSON.stringify(w));
    if (seen) h.assert(w.wary && w.tu.wary && w.phase === 'phone' && Math.abs(w.len - 4.6 * 0.75) < 1e-6 && w.tu.choice === 'loud', 'reloaded after a seen meeting: KC is still wary (phone ×0.75 from the first phase)');
    else h.assert(!w.wary && !w.tu.wary && Math.abs(w.len - 4.6) < 1e-6 && w.tu.habit, 'reloaded after an unseen meeting: not wary');
  }

  // ---- a save past M2: KC's fate and the M3 intel are exactly as before; no m2_* flag appears ----
  const past = { completedMissions:['m0', 'm1', 'm2'], flags:{ kc_statement:true }, moralChoices:{ market_runner:'caught', choice:'detain' }, _marketTunde:true, _marketScanned:true };
  const before = await h.ev(game => { const d = defaultState(); S = { player:d.player, game:Object.assign(d.game, JSON.parse(JSON.stringify(game))) };
    return { fair:kcIsFair(), gate:V12.m3Intel().gate.known, laptop:V12.m3Intel().laptop.known }; }, past);
  await resume(h, Object.assign({ currentMission:'m3' }, past));
  const c = await h.ev(() => ({ cur:S.game.currentMission, fair:kcIsFair(), gate:V12.m3Intel().gate.known, laptop:V12.m3Intel().laptop.known,
    m2flags:Object.keys(S.game.flags).filter(k => /^m2_/.test(k)), mr:S.game.moralChoices.market_runner, choice:S.game.moralChoices.choice }));
  h.log('past M2', JSON.stringify({ before, c }));
  h.assert(c.cur === 'm3' && before.fair && c.fair === before.fair && c.gate === before.gate && c.laptop === before.laptop, 'past M2: kcIsFair() and V12.m3Intel().gate.known unchanged');
  h.assert(c.m2flags.length === 0 && c.mr === 'caught' && c.choice === 'detain', 'past M2: no m2_* flag is created; market_runner and choice untouched');
  h.assert(!h.errors.length, 'no page errors: ' + h.errors.join(' | '));
};
