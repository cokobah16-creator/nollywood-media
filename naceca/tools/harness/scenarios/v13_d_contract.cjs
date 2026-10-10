// v13 · CASE DESK against the cross-team contract (team D; design §6, A2, A5, A8).
//   node tools/harness/run.cjs tools/harness/scenarios/v13_d_contract.cjs --html <build>/naceca.html
// The desk is written against the model's contract with guarded fallbacks. When the model (team A) is in
// the build, this runs on the real thing; when it is not, it installs a strict stand-in that follows the
// design text (v13OpenOps pushes and pops one entry per close and does NOT re-arm; v13Modal routes Esc;
// intelVerdict locks in Senior; V12.warrantState; intelMoneyOpen; intelAdmissibility; Senior flags never
// unlock money on the spot) — so the desk's use of each call is exercised either way.
module.exports = async h => {
  const D = require('./v13_d_lib.cjs').lib(h);
  await D.inject();
  await h.start('m2', { completed:['m0', 'm1'] });
  await D.seed({ money:{ open:true, req:3, unlocked:{ n_kc:true }, traced:{} }, warrants:{ w_cdr:{ status:'signed', at:'h6' } } });
  const real = await h.ev(() => typeof v13OpenOps === 'function' && typeof v13Modal === 'function' && typeof intelVerdict === 'function' && typeof V12.warrantState === 'function');
  h.log(real ? 'running on the real v13 model contract' : 'installing a strict stand-in for the v13 model contract');
  if(!real) await h.ev(() => {
    window.__stub = { ops:[], modal:[] };
    // A2: one push per open, pop-and-call on close, no re-arm
    window.v13OpenOps = (group, back) => { __stub.ops.push(back); V12._onOpsClose = () => { const f = __stub.ops.pop(); if(f) f(); }; V12.openOps(group); };
    window.v13Modal = (id, o) => { __stub.modal = __stub.modal.filter(m => m.id !== id); __stub.modal.push(Object.assign({ id }, o)); };
    window.v13ModalEnd = id => { __stub.modal = __stub.modal.filter(m => m.id !== id); };
    const tp = window.togglePause;
    window.togglePause = function(){
      if(document.getElementById('screen-pause').classList.contains('show') && __stub.modal.length){ const top = __stub.modal[__stub.modal.length - 1]; if(typeof top.resume === 'function'){ showOverlay(null); top.resume(); return; } }
      const m = [...__stub.modal].reverse().find(x => { const e = document.getElementById(x.id); return e && e.classList.contains('show'); });
      if(m){ if(typeof m.onEsc === 'function') m.onEsc(); return; }
      if(document.getElementById('screen-ops').classList.contains('show') && __stub.ops.length){ V12.closeOps(); return; }
      return tp.apply(this, arguments);
    };
    // the pause menu's RESUME is bound to the original togglePause, so the registry hooks the button too
    document.getElementById('btn-resume').addEventListener('click', e => {
      const top = __stub.modal[__stub.modal.length - 1];
      if(top && typeof top.resume === 'function'){ e.stopImmediatePropagation(); showOverlay(null); top.resume(); }
    }, true);
    window.intelSenior = () => !isRecruit();
    window.intelMoneyOpen = () => !!V12.accused('lagos') || (S.game.completedMissions || []).includes('m3');
    window.intelAdmissibility = id => ({ score:intelIntegrity(id), flaws:intelItemFlaws(id).map(f => ({ k:f.k, label:f.txt, pts:f.w })) });
    window.intelVerdictOf = (st, c) => { const r = (I().st[st] || {})[c]; return r ? (typeof r === 'string' ? { verdict:r, locked:false, held:false } : r) : null; };
    window.intelVerdict = (st, c, v) => {
      const cur = intelVerdictOf(st, c); if(cur && cur.locked) return { locked:true, ok:null };
      const claim = STATEMENTS.find(s => s.id === st).claims.find(x => x.id === c);
      I().st[st] = I().st[st] || {};
      if(!isRecruit()){ const locked = v !== 'unverified' || !!(cur && cur.verdict === 'unverified'); I().st[st][c] = { verdict:v, locked, held:intelHas(claim.proof) }; applyEffect({ intel:+2 }); return { locked, ok:null }; }
      const exp = claim.truth === 'unverifiable' ? 'unverified' : (intelHas(claim.proof) ? claim.truth : 'unverified');
      I().st[st][c] = { verdict:v, locked:false, held:intelHas(claim.proof) }; return { locked:false, ok:v === exp };
    };
    const W = { w_lekki:'lagos', w_asaba:'route', w_cdr:'route', w_eko:'voice' };
    V12.warrantState = id => {
      const c = W[id]; let status = 'pending', route = null;
      if(id === 'w_lekki' || id === 'w_asaba'){ const a = V12.accused(c); status = a ? (/^(signed|exigent)$/.test(a.warrant) ? a.warrant : 'pending') : 'none'; }
      else { const r = I().warrants[id]; if(r && r.status) status = r.status; route = r && r.route; }
      const w = V12.warrantFor(c) || {};
      return { id, case:c, label:null, status, route, strength:w.strength, strikes:w.strikes, need:w.need, refused:w.refused };
    };
    const fc = window.flagClue;
    window.flagClue = (cid, on) => { if(!isRecruit()){ I().flagged[cid] = !!on; return; } return fc(cid, on); };
  });
  await h.ev(() => { showOverlay(null); showHUD(true); ENGINE.movementEnabled = true; });
  const st = () => D.state();
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const click = sel => h.ev(sel => document.querySelector(sel).click(), sel);
  let s;

  // Esc through the model's registry: table (opened from the desk) → desk → game, never the pause menu
  await h.ev(() => openDesk('locker'));
  await click('#desk-tabs [data-tab="board"]'); await h.step(100);
  h.assert(eq((await st()).shown, ['screen-ops']), 'OPS TABLE through v13OpenOps');
  await h.page.keyboard.press('Escape'); await h.step(100);
  s = await st(); h.assert(eq(s.shown, ['screen-desk']), 'Esc on that table closes it back to the desk ' + JSON.stringify(s));
  await h.page.keyboard.press('Escape'); await h.step(100);
  s = await st(); h.assert(s.shown.length === 0 && s.hud && s.move === true, 'Esc on the desk returns to the game, no pause menu ' + JSON.stringify(s));

  // the pause menu forced over the desk (a HUD-button path): Resume brings the desk back, BACK still goes home
  await h.ev(() => openDesk('phones'));
  await h.ev(() => { showOverlay('screen-pause'); });
  await h.step(60);
  s = await st(); h.assert(eq(s.shown, ['screen-pause']) && s.desk, 'pause over the desk keeps the desk open underneath ' + JSON.stringify(s));
  await click('#btn-resume'); await h.step(80);
  s = await st(); h.assert(eq(s.shown, ['screen-desk']) && s.tab === 'phones' && s.move === false, 'Resume returns to the desk (registered resume) ' + JSON.stringify(s));
  await click('#btn-desk-close'); await h.step(60);
  s = await st(); h.assert(s.shown.length === 0 && s.hud && s.move === true, '… and BACK returns to the game ' + JSON.stringify(s));

  // the A2 chain on a v13OpenOps that does not re-arm: briefing → table → desk → table → close → desk → BACK → table → close → briefing
  await h.ev(() => { showOverlay(null); window.__brf = document.getElementById('screen-briefing') ? 'screen-briefing' : 'screen-pause'; if(__brf === 'screen-pause') togglePause(); else { showHUD(false); ENGINE.movementEnabled = false; showOverlay('screen-briefing'); } });
  const origin = await h.ev(() => window.__brf);
  await h.ev(() => v13OpenOps('route', () => { showOverlay(window.__brf); }));
  await h.step(100);
  const seq = [['#ops-desk', 'screen-desk'], ['#desk-tabs [data-tab="board"]', 'screen-ops'], ['#ops-close', 'screen-desk'], ['#btn-desk-close', 'screen-ops'], ['#ops-close', origin]];
  for(const [sel, want] of seq){ await click(sel); await h.step(100); s = await st(); h.assert(eq(s.shown, [want]), `chain: ${sel} → ${want} ` + JSON.stringify(s)); }
  h.log('A2 chain unwound to', origin);
  await h.ev(() => { showOverlay(null); showHUD(true); ENGINE.movementEnabled = true; });

  // Senior statements through intelVerdict: two taps, locked, no right/wrong
  await h.ev(() => { openDesk('statements'); deskDo('st', { id:'st_musa' }); deskDo('verdict', { st:'st_musa', c:'u1', v:'contradicted' }); deskDo('verdict', { st:'st_musa', c:'u1', v:'contradicted' }); });
  s = await h.ev(() => ({ rec:intelVerdictOf('st_musa', 'u1'), fb:document.querySelectorAll('#desk-body .dk-fb, #desk-body .v13-mark-ok, #desk-body .v13-mark-bad').length, btns:document.querySelectorAll('#desk-body .dk-claim[data-c="u1"] button').length }));
  h.assert(s.rec && s.rec.locked && s.rec.verdict === 'contradicted' && s.fb === 0 && s.btns === 0, 'Senior via intelVerdict: filed and locked, nothing shown ' + JSON.stringify(s));
  // Recruit: ok from the model, the desk words the feedback
  await D.recruit(true);
  await h.ev(() => { deskDo('st-back'); deskDo('st', { id:'st_tunde' }); deskDo('verdict', { st:'st_tunde', c:'t1', v:'mistaken' }); });
  h.assert(await h.ev(() => document.querySelectorAll('#desk-body .dk-fb').length) === 1, 'Recruit via intelVerdict: feedback shown');
  await D.recruit(false);

  // Senior flag through the model: recorded, no money node on the spot
  await h.ev(() => { deskDo('goto', { tab:'phones' }); deskDo('phone', { id:'kc' }); deskDo('sec', { sec:'BANK ALERTS' }); deskDo('flag', { id:'kc_bank_150k' }); });
  h.assert(await h.ev(() => I().flagged.kc_bank_150k === true), 'Senior flag recorded through flagClue');

  // warrants through V12.warrantState; money through intelMoneyOpen; admissibility through intelAdmissibility
  await h.ev(() => deskDo('goto', { tab:'warrants' }));
  s = await h.ev(() => [...document.querySelectorAll('#desk-body .dk-warrant')].map(x => x.dataset.id + ':' + x.querySelector('.v13-stamp').textContent));
  h.log('warrants', s.join(' '));
  h.assert(eq(s, ['w_lekki:SIGNED', 'w_asaba:NO WARRANT', 'w_cdr:ORDER GRANTED']), 'warrants from V12.warrantState, decided only');
  await h.ev(() => { delete S.game.accusations.lagos; S.game.completedMissions = ['m0', 'm1', 'm2']; deskDo('goto', { tab:'money' }); });
  h.assert(await h.ev(() => document.querySelectorAll('#desk-body .dk-mn').length) === 0, 'MONEY closed by intelMoneyOpen');
  await h.ev(() => { S.game.completedMissions.push('m3'); renderDesk(); });
  h.assert(await h.ev(() => document.querySelectorAll('#desk-body .dk-mn').length) >= 1, 'MONEY open by intelMoneyOpen');
  await h.ev(() => deskDo('goto', { tab:'locker' }));
  s = await h.ev(() => { const it = document.querySelector('#desk-body .dk-ex[data-id="phishing_template"]'); const a = intelAdmissibility('phishing_template');
    return { shown:+it.querySelector('.dk-adm b').firstChild.textContent, score:a.score, flaws:it.querySelectorAll('.dk-flaws li').length, n:a.flaws.length }; });
  h.assert(s.shown === s.score && s.flaws === s.n, 'Locker ADMISSIBILITY and flaws come from intelAdmissibility ' + JSON.stringify(s));
  await h.ev(() => closeDesk());
  h.assert(h.errors.length === 0, 'no page errors: ' + h.errors.join(' | '));
};
