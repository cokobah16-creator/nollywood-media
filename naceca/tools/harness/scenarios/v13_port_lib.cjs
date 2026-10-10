// Shared helpers for the v13_port_* scenarios: the vendor drop's Python tests (tools/v13_test.py,
// tools/playthrough.py, tools/finale_test.py) ported to the harness with the INTEGRATED semantics
// (docs: scratchpad DESIGN-v13.md + AMENDMENTS v2; docs/SYNC-2026-10-08-beta.md). Running this file on
// its own is a no-op scenario.        const P = require('./v13_port_lib.cjs').lib(h);
//
// It builds on the team libs (casework_lib → v13_b_lib for hubs and briefings, v13_c_lib for the court,
// wayfind_lib for chases) and adds:
//   - P.until(fn, arg, {timeout, every}): poll a page predicate instead of sleeping a fixed time
//   - P.board(cases) / P.boardReal(): the magistrate signs for the listed cases (a wrapper over the real
//     V12.warrantFor that RESTORES it; the team libs' L.warrant replaces it for the rest of the page)
//   - P.inkLagos() / P.inkLinks(case, links): the real board, worked like a player (LAGOS/ROUTE/VOICE_LINKS)
//   - P.toMission(id): wait until a mission (or hub) has begun after a title card
//   - P.talk(k) / P.use(label): the drop's way of playing a scene (choice k; teleport and press E)
//   - P.courtPrep(): sign every s.84 certificate on offer before the trial
// A content pass is rewording v13 text (e.g. CONTROL → C.): the port asserts behaviour and state, and where
// it compares text it reads the expected string from the game itself (rvWarrantLine, intelRevealExtras,
// courtEpilogueText) instead of quoting copy.
const BLIB = require('./v13_b_lib.cjs'), CLIB = require('./v13_c_lib.cjs'), WF = require('./wayfind_lib.cjs');

// links that hold on the operations table (v12_ops.js L), per case, as far as the fieldwork goes
const LAGOS_LINKS = [['s_obi', 'e_wallet'], ['e_wallet', 'm_pos'], ['m_pos', 'l_market'], ['s_kc', 'l_market']];
const ROUTE_LINKS = [['s_musa', 'l_bypass'], ['s_musa', 'e_ledger'], ['e_ledger', 'l_bypass'], ['s_musa', 's_engineer'], ['e_weld', 's_musa'], ['e_weld', 'e_ledger'],
  ['e_weld', 'l_bypass'], ['e_ledger', 'l_shrine'], ['e_shrine', 'l_shrine'],
  ['s_ifeanyi', 'l_asaba'], ['s_ifeanyi', 'e_asims'], ['e_asims', 's_mama'], ['e_asims', 'l_asaba']];       // the Asaba cards, once Case 06 is reached
const VOICE_LINKS = [['s_voice', 'l_ugbowo'], ['s_voice', 'e_cdr'], ['e_cdr', 'l_ugbowo'], ['e_cdr', 'l_ekosodin'], ['s_engineer', 'l_ugbowo'], ['s_voice', 'l_ekosodin'], ['e_cdr', 's_obi']];

const lib = h => {
  const B = BLIB.lib(h), C = CLIB.lib(h);
  const P = { B, C, WF, LAGOS_LINKS, ROUTE_LINKS, VOICE_LINKS };

  // ---------- waiting on the game, not on the clock ----------
  P.until = async (fn, arg, o = {}) => {
    const t0 = Date.now(), timeout = o.timeout || 8000, every = o.every || 80;
    for(;;){
      let r = null;
      try{ r = await h.ev(fn, arg); }catch(e){ if(o.throws) throw e; r = null; }
      if(r) return r;
      if(Date.now() - t0 > timeout) return null;
      await h.step(every);
    }
  };
  P.shown = id => h.ev(id => !!document.querySelector('#' + id + '.show'), id);
  P.overlays = () => h.ev(() => [...document.querySelectorAll('.overlay.show')].map(o => o.id));
  P.waitShown = (id, o) => P.until(id => !!document.querySelector('#' + id + '.show'), id, o);
  P.noCard = o => P.until(() => !document.querySelector('#title-card.show'), null, o);
  // a mission (or office) has begun: it is current, the scene is live and no title card is up.
  // If the mission waits on its controls screen, begin it the way the player would.
  P.toMission = async (id, o = {}) => {
    const ok = await P.until(id => {
      if(document.querySelector('#title-card.show')) return false;
      if(S.game.currentMission === id && document.querySelector('#screen-controls.show')){ beginMission(id); return false; }
      return S.game.currentMission === id && !!ENGINE.movementEnabled && !document.querySelector('#screen-controls.show');
    }, id, { timeout:o.timeout || 9000 });
    if(ok) await h.step(o.settle == null ? 150 : o.settle);
    return !!ok;
  };
  // h.start without its fixed 1.5 s wait, then wait for the mission (or the office it redirects to)
  P.start = async (id, o = {}) => {
    await P.noCard({ timeout:4000 });
    await h.start(id, Object.assign({}, o, { wait:60 }));
    if(o.expect !== false) return P.toMission(o.expect || id, { timeout:o.timeout });
    return true;
  };

  // ---------- the board as magistrate ----------
  P.board = cases => h.ev(cases => {
    if(!V12.__portWF) V12.__portWF = V12.warrantFor;
    const real = V12.__portWF;
    V12.warrantFor = c => cases.includes(c) ? { strength:80, signed:true, refused:false, strikes:0, need:'Ready to sign' } : real(c);
  }, cases);
  P.boardReal = () => h.ev(() => { if(V12.__portWF){ V12.warrantFor = V12.__portWF; delete V12.__portWF; } });
  // the real Lagos case: the scan, KC's statement and Tunde give the cards their fieldwork; four links hold
  P.LAGOS_READY = S => {
    S.game.evidence = (S.game.evidence || []).concat([{ id:'co_madam', name:'Cracked phone' }, { id:'phishing_template', name:'Phishing Template' }, { id:'kc_sims', name:"KC's SIM batch (statement)" }]);
    S.game.flags = Object.assign(S.game.flags || {}, { kc_statement:true });
    S.game._marketTunde = true;
  };
  // file links one at a time, as a player does at the table (a card whose fieldwork isn't in yet is not on
  // the table: its pencil is dropped, never a strike); returns the case's warrant afterwards
  P.inkLinks = (c, links) => h.ev(([c, L]) => {
    L.forEach(([a, b]) => { V12.pencil(a, b); V12.fileLinks(); });
    if(document.querySelector('#ops-modal.show #bd-rul-ok')) document.getElementById('bd-rul-ok').click();
    return V12.warrantFor(c);
  }, [c, links]);
  P.inkLagos = () => h.ev(L => {
    L.forEach(([a, b]) => V12.pencil(a, b));
    const r = V12.fileLinks() || [];
    if(document.querySelector('#screen-ops.show') && V12.closeOps) V12.closeOps();
    return { filed:r.length, inked:V12.ops().inked.slice(), w:V12.warrantFor('lagos'), legacy:V12.warrant(), money:V12.theory('t_money') };
  }, LAGOS_LINKS);

  // ---------- the office between operations ----------
  // Uche and the phone, then the Commander. Returns the first overlay that needs the player.
  P.office = async () => { await B.hubPrep(); await B.commander(); await B.dialogues(); return P.overlays(); };
  P.fileSheet = (picks, ov) => B.fileSheet(picks, ov);

  // ---------- reading v13 ----------
  P.brf = () => B.brf();
  P.warrant = id => h.ev(id => V12.warrantState(id), id);
  P.snap = () => h.ev(() => ({ intel:S.game.intelScore || 0, rep:Object.assign({}, S.player.reputation), alert:(S.game.intel || {}).alert || 0,
    toast:(document.getElementById('toast') || {}).textContent || '', toastOn:!!document.querySelector('#toast.show') }));
  P.recruit = on => h.ev(on => { S.game.difficulty = on ? 'recruit' : 'senior'; if(typeof syncDifficultyClass === 'function') syncDifficultyClass(); }, on);

  // ---------- playing a scene the drop's way (teleport, press E) ----------
  // P.talk(k): run dialogues, field skills and puzzles until nothing is open; choice index k (clamped),
  // a two-tap (armed) choice is tapped twice. Returns the choices made.
  P.talk = (k = 0, max = 160) => h.ev(async ([k, max]) => {
    const sleep = ms => new Promise(r => setTimeout(r, ms)), shown = () => [...document.querySelectorAll('.overlay.show')].map(e => e.id), log = [];
    for(let g = 0; g < max; g++){
      const sh = shown();
      if(sh.includes('screen-minigame') && typeof MINI !== 'undefined' && MINI.active){
        const run = MINI.active;
        if(run.phase === 'play'){ miniSuccess(run, { stars:3 }); log.push('mini:' + (run.cfg.id || run.cfg.type)); }
        else { const b = document.querySelector('#mg-actions button'); if(b) b.click(); }
        await sleep(80); continue;
      }
      if(sh.includes('screen-dialogue')){
        if(typeof skipTypewriter === 'function') skipTypewriter();
        const ch = [...document.querySelectorAll('#dlg-choices button')];
        if(ch.length){ const c = ch[Math.min(k, ch.length - 1)]; log.push('»' + c.textContent.trim().slice(0, 40)); c.click(); await sleep(30); if(c.isConnected && c.classList.contains('armed')) c.click(); }
        else if(!document.querySelector('#dlg-continue').classList.contains('hide')) advanceDialogue();
        await sleep(40); continue;
      }
      if(sh.includes('screen-puzzle') && !document.querySelector('.puzzle-frame.v12-doc')){
        const t = document.querySelector('#puzzle-title').textContent, key = Object.keys(PUZZLES).find(x => PUZZLES[x].title === t);
        const opts = document.querySelectorAll('#puzzle-options .puzzle-option'); if(opts.length) opts[Math.max(0, key ? PUZZLES[key].options.findIndex(o => o.correct) : 0)].click();
        log.push('puzzle:' + (key || t)); await sleep(1600); continue;
      }
      return log;
    }
    return log;
  }, [k, max]);
  // stand next to an interactable and use it (onBeforeInteract first, as the E key does)
  P.use = label => h.ev(label => {
    const it = ENGINE.interactables.find(i => i.label === label) || ENGINE.interactables.find(i => (i.label || '').startsWith(label));
    if(!it) return false;
    if(ENGINE.player && it.mesh && it.mesh.position){ ENGINE.player.position.x = it.mesh.position.x + 0.8; ENGINE.player.position.z = it.mesh.position.z + 0.8; }
    if(typeof onBeforeInteract === 'function') onBeforeInteract(it);
    it.onInteract(it); return true;
  }, label);

  // ---------- carrying the save from one step to the next ----------
  // P.carry() snapshots S into window.__portCarry (as a save would), for a later h.start state hook to read
  P.carry = () => h.ev(() => { window.__portCarry = JSON.stringify({ game:S.game, player:S.player }); });

  // ---------- the court ----------
  // the pre-trial file: sign every s.84 certificate still on offer and ask for the CAC certified copy.
  // Each tap redraws the record, so the next button is looked up again (the drop's slice(0,2) loop
  // clicked a detached second button and never certified it).
  P.courtPrep = () => h.ev(() => {
    const signed = [];
    for(let i = 0; i < 8; i++){ const b = document.querySelector('#screen-court [data-ct="cert"]'); if(!b) break; signed.push(b.dataset.id); b.click(); }
    const c = document.querySelector('#screen-court [data-ct="ctc"]'); if(c) c.click();
    return { signed, ctc:!!c };
  });
  return P;
};
module.exports = async () => {};
module.exports.lib = lib;
