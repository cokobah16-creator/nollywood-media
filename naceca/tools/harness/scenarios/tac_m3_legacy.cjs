// tac_m3_legacy: the legacy house (the art failed; the harness default) gets only the false-outcome fixes and the
// files (DESIGN §7.C; mansion.md §2.9): no watcher (TAC.geo.ready() is false there), the wipe starting at the
// briefing as today, PLAN FIRST before the briefing, "stay put" → 'Walk her out', the honest extraction, the files;
// and a bot loop that picks choice index 1 (the playthrough's policy 1: "stay put") still completes M3.
// Owner: Team C.
const L = require('./tac_m3_lib.cjs');
const lib = require('./wayfind_lib.cjs');

const start = async h => {
  await lib.start(h, 'm3', { completed:['m0', 'm1', 'm2'] });
  await L.stepper(h);
  await lib.frozenClock(h);
  await L.T.capture(h);
  await h.ev(() => { window.__toasts = []; });
};

// the playthrough driver's loop for one mission (v13_port_playthrough PLAY), choice index k
const BOT = async ({ k }) => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const shown = () => [...document.querySelectorAll('.overlay.show')].map(e => e.id);
  const log = [];
  async function overlays(){
    for (let g = 0; g < 60; g++){
      const sh = shown();
      if (sh.includes('screen-dialogue')){
        if (typeof skipTypewriter === 'function') skipTypewriter();
        const ch = [...document.querySelectorAll('#dlg-choices button')];
        if (ch.length){ const c = ch[Math.min(k, ch.length - 1)]; log.push('choice:' + c.textContent.trim().slice(0, 30)); c.click(); await sleep(30); if (c.isConnected && c.classList.contains('armed')) c.click(); }
        else if (!document.querySelector('#dlg-continue').classList.contains('hide')) advanceDialogue();
        await sleep(40); continue;
      }
      if (sh.includes('screen-minigame') && MINI.active){ const run = MINI.active; if (run.phase === 'play') miniSuccess(run, { stars:3 }); else { const b = document.querySelector('#mg-actions button'); if (b) b.click(); } await sleep(80); continue; }
      if (sh.includes('screen-plan')){ const g2 = document.getElementById('plan-go'); if (g2){ g2.click(); log.push('plan'); } await sleep(200); continue; }
      if (sh.includes('screen-puzzle') && document.querySelector('.puzzle-frame.v12-doc')){
        // a v12 document (the safe's ledger page): the playthrough's answer — the correct option, then the proof line
        const title = (document.querySelector('.puzzle-frame.v12-doc h2') || {}).textContent;
        const key = Object.keys(PUZZLES).find(x => PUZZLES[x].title === title);
        const spec = key && V12.docFromPuzzle && V12.docFromPuzzle(key);
        if (spec){
          const oi = spec.options.findIndex(o => o.correct); const ob = document.querySelectorAll('#v12-opts .v12-opt')[oi]; if (ob) ob.click();
          const line = [...document.querySelectorAll('#v12-lines .v12-line.live')].find(l => spec.proof.some(x => l.textContent.includes(x))); if (line) line.click();
          const go = document.getElementById('v12-doc-go'); if (go && !go.disabled) go.click();
        } else { const x = document.getElementById('v12-doc-x'); if (x) x.click(); else showOverlay(null); }
        log.push('doc'); await sleep(1600); continue;
      }
      if (sh.includes('screen-puzzle') && document.querySelector('#puzzle-title')){
        const title = document.querySelector('#puzzle-title').textContent;
        const key = Object.keys(PUZZLES).find(x => PUZZLES[x].title === title);
        const ci = key ? PUZZLES[key].options.findIndex(o => o.correct) : 0;
        document.querySelectorAll('#puzzle-options .puzzle-option')[Math.max(0, ci)].click(); log.push('puzzle'); await sleep(1600); continue;
      }
      if (sh.length && !sh.includes('screen-aftermath')){ showOverlay(null); await sleep(60); continue; }
      return;
    }
  }
  const terminal = /Extract/;
  let stall = 0, last = '';
  for (let steps = 0; steps < 60; steps++){
    await overlays();
    if (S.game.completedMissions.includes('m3')) break;
    const its = ENGINE.interactables.slice();
    const sig = JSON.stringify([S.game.objectives.map(o => o.done), S.game.flags, S.game.moralChoices, its.map(i => i.label)]);
    if (sig === last) stall++; else { stall = 0; last = sig; }
    let pool = stall >= 2 ? its : its.filter(i => !terminal.test(i.label));
    if (k % 2 === 1) pool = pool.slice().reverse();
    for (const it of pool){
      if (S.game.completedMissions.includes('m3')) break;
      const p = it.mesh && it.mesh.position; if (p){ ENGINE.player.position.x = p.x + 0.8; ENGINE.player.position.z = p.z + 0.8; }
      await sleep(80); await overlays();
      try { it.onInteract(it); log.push('press:' + it.label); } catch (e) { log.push('THROW ' + it.label + ': ' + e.message); }
      await sleep(80); await overlays();
    }
    if (stall >= 8) break;
    await sleep(200);
  }
  return { done:S.game.completedMissions.includes('m3'), walked:log.some(l => /press:Walk her out/.test(l)), stayed:log.some(l => /^choice:.*stay put/.test(l)), objectives:S.game.objectives.map(o => (o.done ? '+' : '.') + o.id).join(' '), stall, log:log.slice(-14),
    child:S.game._civChild, arrest:S.game.moralChoices.arrest, civ:S.game.civiliansRescued, headline:(S.game.headlines.slice(-1)[0] || {}).head || null };
};

module.exports = async h => {
  await start(h);
  const s0 = await h.ev(() => ({ v8:!!ENGINE._mansion, run:TAC.m3.run() && TAC.m3.run().variant, ready:TAC.geo.ready(), obiWatch:TAC.sight.watchers().some(w => w.cfg && w.cfg.id === 'obi') }));
  h.log('legacy house', JSON.stringify(s0));
  h.assert(!s0.v8 && s0.run === 'legacy' && !s0.ready && !s0.obiWatch, 'the legacy house: no ENGINE._mansion, no watcher');
  // PLAN FIRST on the laptop and on Obi before the briefing
  const pf = await h.ev(() => { window.__toasts = []; for (const lab of ['Stop laptop wipe', 'Move on suspect']){ const it = ENGINE.interactables.find(i => i.label === lab); it.onInteract(it); }
    return window.__toasts.slice(); });
  h.log('before the briefing', JSON.stringify(pf));
  h.assert(pf.length === 2 && pf.every(t => t[0] === 'PLAN FIRST' && t[1] === 'Plan the raid with Sgt. Uche'), "PLAN FIRST · 'Plan the raid with Sgt. Uche' on 'Stop laptop wipe' and 'Move on suspect'");
  // the plan and the briefing: the wipe starts at the briefing, as today
  await h.ev(() => { CW.autofile('lagos'); const it = ENGINE.interactables.find(i => /^Plan the raid/.test(i.label)); it.onInteract(it); });
  await h.step(250);
  const pl = await h.ev(() => { const ov = document.getElementById('screen-plan'); return { shown:ov && ov.classList.contains('show'), q:(ov.querySelector('[data-v="quiet"]') || {}).textContent, line:ov.querySelector('.plan-pred').firstElementChild.textContent }; });
  h.log('legacy plan', JSON.stringify(pl));
  h.assert(pl.shown && pl.q === 'Quiet, front door' && pl.line === 'Wipe clock about 55 s' && !/find the laptop/.test(pl.line), 'the legacy plan: "Quiet, front door", "Wipe clock about 55 s" (no "once he knows", no "find the laptop")');
  await h.ev(() => document.getElementById('plan-go').click());
  await h.step(150);
  await L.finishDialogue(h);
  await h.step(100);
  const br = await h.ev(() => ({ total:S.game._wipeTotal, toasts:window.__toasts.map(t => t[0]), moving:ENGINE.movementEnabled, card:!!document.querySelector('#title-card.show') }));
  h.log('after the briefing', JSON.stringify(br));
  h.assert(br.total === 55 && br.toasts.includes('LAPTOP WIPE RUNNING') && br.moving && !br.card, 'the wipe starts at the briefing, as today (55 s), no card');
  let ent = (await L.ev(h, 'enc')).filter(e => e[1].enc === 'm3_entry').map(e => e[1]);
  h.assert(ent.length === 1 && ent[0].variant === 'legacy' && ent[0].armed === true && ent[0].wipeTotal === 55, 'enc m3_entry{variant:legacy}: ' + JSON.stringify(ent));
  // extraction before the arrest
  let ex = await L.extract(h, 200);
  h.assert(!ex.done && ex.toasts[0] && ex.toasts[0][1] === 'Arrest the principal first', 'OPERATION OPEN · Arrest the principal first');
  // the arrest, then "stay put"
  await h.ev(() => { const it = ENGINE.interactables.find(i => i.label === 'Move on suspect'); ENGINE.player.position.x = it.mesh.position.x + 1; ENGINE.player.position.z = it.mesh.position.z; it.onInteract(it); });
  await h.step(100); await L.finishDialogue(h); await L.choose(h, 0); await L.finishDialogue(h);
  const civ0 = await h.ev(() => S.game.civiliansRescued);
  await h.ev(() => { const it = ENGINE.interactables.find(i => i.label === 'Calm and escort the child'); it.onInteract(it); });
  await h.step(100); await L.finishDialogue(h); await L.choose(h, 1); await L.finishDialogue(h); await h.step(100);
  const st = await h.ev(() => { const it = ENGINE.interactables.find(i => /child|Walk her/.test(i.label)); return { label:it.label, o5:S.game.objectives.find(o => o.id === 'o5_civ').done, civChild:!!S.game._civChild, z:it.mesh.position.z, cur:(WAY.current().obj || {}).id }; });
  h.log('stay put (legacy)', JSON.stringify(st));
  h.assert(st.label === 'Walk her out' && !st.o5 && !st.civChild && st.z < 0, "stay put: she stays inside, 'Walk her out'");
  ex = await L.extract(h, 200);
  h.assert(!ex.done && ex.toasts[0] && ex.toasts[0][1] === 'The girl is still inside. Walk her out first', 'the honest extraction refuses while she is inside');
  h.assert((await L.walkOut(h)) === 'ok', 'Walk her out');
  const out = await h.ev(() => { const it = ENGINE.interactables.find(i => /child|Walk her/.test(i.label)); return { o5:S.game.objectives.find(o => o.id === 'o5_civ').done, civ:S.game.civiliansRescued, x:it.mesh.position.x, z:it.mesh.position.z }; });
  h.log('walked out (legacy)', JSON.stringify(out));
  h.assert(out.o5 && out.civ === civ0 + 1 && out.z === 8.5, 'she is moved outside (as legacy does on a rescue): o5 done, +1');
  // the files: halt at about a third
  const lap = await h.ev(() => { S.game._wipeT = 0.3 * S.game._wipeTotal; const it = ENGINE.interactables.find(i => i.label === 'Stop laptop wipe'); it.onInteract(it);
    return { files:(S.game.flags.m3_files || []).length, pct:S.game.flags.m3_wipe_pct, cus:I().items.laptop.custody.filter(c => /files recovered/.test(c.t)).map(c => c.t) }; });
  h.log('legacy laptop', JSON.stringify(lap));
  h.assert(lap.files === 5 && lap.pct === 30 && lap.cus.length === 1 && lap.cus[0] === 'Imaged by forensics: 5 of 7 files recovered', 'the legacy halt records the files and one custody line');
  const c1 = await h.ev(() => S.game.civiliansRescued);
  ex = await L.extract(h, 600);
  h.log('legacy extract', JSON.stringify(ex));
  h.assert(ex.done && ex.civ === c1, 'the extraction completes with no knowledge-only rescue');
  const sum = (await L.ev(h, 'm3_summary')).map(e => e[1]);
  h.assert(sum.length === 1 && sum[0].variant === 'legacy' && sum[0].child.choice === 'stay', 'm3_summary once (legacy)');

  // ---------- the bot: choice index 1 ("stay put") completes M3 ----------
  await start(h);
  await h.ev(() => { CW.autofile('lagos'); });
  const bot = await h.ev(BOT, { k:1 });
  h.log('bot k=1', JSON.stringify(bot));
  h.assert(bot.done && bot.child && bot.arrest, 'the bot with choice index 1 completes M3: ' + bot.objectives);
  h.assert(bot.stayed && bot.walked, 'the bot told her to stay put, then pressed Walk her out');
  h.assert(!h.errors.length, 'no page errors: ' + h.errors.join(' | '));
};
