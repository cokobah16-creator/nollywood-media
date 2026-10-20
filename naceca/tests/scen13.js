// Season 2 scenarios for t13.js
const S1DONE = "S.game.completedMissions=['m0','m1','m2','m3','m3n','m4','m5','m6','m7','t7','m8']; S.game.seasonOneComplete=true;" +
  "S.game.moralChoices=Object.assign(S.game.moralChoices||{}, {market_runner:'caught',choice:'flip',arrest:'professional',checkpoint:'flip_driver',asaba:'rescue',tower:'hold',finale:'contested'});" +
  "S.game.mem={hubs:{h2:1,h4:1,h5:1,h6:1,h7:1}};";

/* start a Season 2 case straight away (no office first) */
async function s2start(T, id, prep) {
  await T.ev(([id, prep]) => {
    (new Function(prep))();
    V13.s2().hubs = Object.assign(V13.s2().hubs || {}, { skip: 1 });
    V13._skipHubs = true;
    showOverlay(null); loadMission(id); beginMission(id);
  }, [id, S1DONE + (prep || '')]);
  const ok = await T.until(id => S.game.currentMission === id && ENGINE.player && S.game._opStart && ENGINE.movementEnabled && !V13._pendingBegin, 90000, id);
  await T.wait(2200);
  return ok;
}
/* walk up to an interactable (teleport beside it) and use it */
async function use(T, re) {
  await T.until(src => { const r = new RegExp(src, 'i'); return !document.querySelector('#title-card.show') && !isOverlayOpen() && ENGINE.interactables.some(i => r.test(i.label || '')); }, 20000, re);
  const r = await T.ev(src => {
    const re = new RegExp(src, 'i'); const it = ENGINE.interactables.find(i => re.test(i.label || ''));
    if (!it) return 'none: ' + ENGINE.interactables.map(i => i.label).join(' | ');
    const p = new THREE.Vector3(); it.mesh.getWorldPosition(p);
    const P = ENGINE.player.position; const dx = P.x - p.x, dz = P.z - p.z, d = Math.hypot(dx, dz) || 1;
    P.x = p.x + dx / d * 1.2; P.z = p.z + dz / d * 1.2;
    it.onInteract(); return 'ok ' + it.label;
  }, re);
  T.log('use', re, '→', r);
  await T.wait(500);
  return r;
}
/* click through whatever conversation is open; picks: regex strings or indexes, in order */
async function talk(T, picks) {
  picks = (picks || []).slice();
  for (let k = 0; k < 80; k++) {
    const st = await T.ev(() => {
      const ov = document.getElementById('screen-dialogue'); if (!ov.classList.contains('show')) return 'closed';
      skipTypewriter(); const ch = [...document.querySelectorAll('#dlg-choices .dialogue-choice')];
      return ch.length ? 'choices:' + ch.map(c => c.textContent.slice(0, 60)).join(' || ') : 'line:' + (document.getElementById('dlg-speaker').textContent) + ': ' + document.getElementById('dlg-text').textContent.slice(0, 90);
    });
    if (st === 'closed') return true;
    if (st.startsWith('choices')) {
      const c = picks.length ? picks.shift() : 0;
      T.log('   choose', c, 'from', st.slice(8, 300));
      await T.ev(c => { const ch = [...document.querySelectorAll('#dlg-choices .dialogue-choice')]; let b = typeof c === 'number' ? ch[c] : ch.find(x => new RegExp(c, 'i').test(x.textContent)); if (!b) b = ch[0]; b.click(); if (b.dataset.armed) b.click(); }, c);
    } else await T.ev(() => advanceDialogue());
    await T.wait(160);
  }
  return false;
}
/* solve the open document: the right conclusion and its proof line (or a wrong one, if wrong=true) */
async function solve(T, key, wrong) {
  await T.until(() => document.querySelector('#screen-puzzle.show .v12-opt'), 15000);
  const r = await T.ev(([key, wrong]) => {
    const P = PUZZLES[key], D = V12.DOCS[key];
    const scope = document.querySelector('#screen-puzzle.show') || document; const oi = P.options.findIndex(o => wrong ? !o.correct : o.correct);
    scope.querySelectorAll('.v12-opt')[oi].click();
    const lines = [...scope.querySelectorAll('.v12-line.live')];
    const ln = wrong ? lines.find(l => !D.proof.some(p => l.textContent.includes(p))) : lines.find(l => D.proof.some(p => l.textContent.includes(p)));
    if (ln) ln.click();
    document.getElementById('v12-doc-go').click();
    return { oi, line: ln && ln.textContent.slice(0, 60) };
  }, [key, !!wrong]);
  T.log('   doc', key, JSON.stringify(r));
  await T.wait(1800);
  if (wrong) { await T.ev(() => { const b = document.getElementById('v12-doc-go'); if (b) b.click(); }); await T.wait(1500); }
}
/* skip the title cards (time skips) quickly */
async function waitCards(T) { await T.until(() => !document.querySelector('#title-card.show'), 20000); await T.wait(700); }
const state = T => T.ev(() => ({ m: S.game.currentMission, objs: (S.game.objectives || []).map(o => (o.done ? '✓' : '·') + o.id).join(' '), ev: (S.game.evidence || []).filter(e => /^(drive|upstream|evidence_reg|pos_|bvn|cash_b|lucky|fuel|waybill|felix|barge|loading|tank3|cac|bank|gate_reg|transfer|dg_rec|visitor|ereba|senator)/.test(e.id)).map(e => e.id + ':' + (S.game.evQ || {})[e.id]).join(' '), mc: JSON.stringify(Object.fromEntries(Object.entries(S.game.moralChoices || {}).filter(([k]) => k.startsWith('s2_')))) }));

module.exports = {
  async s2m9(T) {
    const ok = await s2start(T, 'm9');
    T.log('m9 started', ok, JSON.stringify(await state(T)));
    await T.shot('m9_start');
    await talk(T);                                  // intro
    await use(T, 'Report to Commander Osagie'); await talk(T, [0]);
    await use(T, 'Sign for exhibit 14'); await T.shot('m9_ikpe'); await talk(T, ['Sign it out']);
    await use(T, 'Examine the drive'); await talk(T, ['Write-blocker']);
    await waitCards(T); await solve(T, 'm9_hash'); await talk(T);
    await solve(T, 'm9_ledger'); await T.shot('m9_after_ledger'); await talk(T);
    await waitCards(T); await T.wait(600);
    await use(T, 'Answer the Commander'); await talk(T, ['It has']);
    await waitCards(T); await T.wait(3500);
    await T.shot('m9_escort');
    await use(T, 'Meet the transfer team'); await talk(T, ['stays in Benin', 'Sign the register']);
    await talk(T);
    await T.until(() => document.getElementById('screen-aftermath').classList.contains('show'), 15000);
    await T.shot('m9_aftermath');
    T.log('m9 end', JSON.stringify(await state(T)));
  },
};
/* read every unread thread in the open phone, then close it */
async function phone(T) {
  await T.until(() => document.getElementById('screen-phone') && document.getElementById('screen-phone').classList.contains('show'), 8000);
  for (let k = 0; k < 20; k++) {
    const r = await T.ev(() => { const b = [...document.querySelectorAll('#screen-phone .ph-row')].find(x => x.querySelector('.ph-dot')); if (!b) return null; b.click();
      const o = document.querySelector('#screen-phone .ph-opt'); if (o) o.click(); return b.textContent.slice(0, 80); });
    if (!r) break; T.log('   phone:', r); await T.wait(300);
  }
  await T.ev(() => document.querySelector('#screen-phone .ph-x').click()); await T.wait(400);
}
module.exports.s2h9 = async function (T) {
  await T.ev(prep => { (new Function(prep))(); S.game.completedMissions.push('m9');
    Object.assign(S.game.moralChoices, { s2_custody:'signed', s2_method:'image', s2_abuja_call:'truth', s2_original:'kept' });
    V13.s1Sources(); V13._skipHubs = false; showOverlay(null); V13.hubBefore('m10'); }, S1DONE);
  const ok = await T.until(() => S.game.currentMission === 'h9' && ENGINE.player && ENGINE.movementEnabled && !document.querySelector('#title-card.show'), 90000);
  await T.wait(1500);
  T.log('h9 started', ok, JSON.stringify(await state(T)), await T.ev(() => ENGINE.interactables.map(i => i.label).join(' | ')));
  await T.shot('h9_start');
  await use(T, 'Talk to Uche'); await talk(T);
  await use(T, 'Check your phone'); await T.shot('h9_phone'); await phone(T);
  await use(T, 'Check your sources'); await T.shot('h9_sources');
  await T.ev(() => { const b = document.querySelector('#screen-sources .src-corr'); if (b) b.click(); }); await T.wait(300); await T.shot('h9_sources_checked');
  await T.ev(() => document.querySelector('#screen-sources .src-done').click()); await T.wait(400);
  await use(T, 'Talk to Commander Osagie'); await talk(T);
  T.log('h9 objs', JSON.stringify(await state(T)));
  await use(T, 'Drive to Sapele');
  await T.until(() => S.game.currentMission === 'm10', 15000);
  T.log('after hub', await T.ev(() => S.game.currentMission + ' hubs=' + JSON.stringify(V13.s2().hubs)));
};
module.exports.phone = phone;
module.exports.s2start = s2start; module.exports.use = use; module.exports.talk = talk; module.exports.solve = solve; module.exports.waitCards = waitCards; module.exports.state = state; module.exports.S1DONE = S1DONE;
