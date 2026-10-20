// Season 2 guards (team guards, R03): the in-case ways into the Case Desk go through window.openDesk, so a
// later layer's wrap (Season 2's case file, s2_merge.js) applies in its own cases. Run it on BOTH pages:
//   node tools/harness/run.cjs tools/harness/scenarios/s2_guards_desk.cjs --html <build>/naceca.html --w 1280 --h 800
//   node tools/harness/run.cjs tools/harness/scenarios/s2_guards_desk.cjs --html <build_s1>/naceca.html --w 1280 --h 800
// Season 1 case (both pages): the real J key, the HUD pill and the pause menu's CASE DESK open screen-desk.
// The mission select's CASE DESK opens screen-desk (also with a Season 2 id still current).
// Season 2 page only: in the h13 office (and in Case 12) the same three open screen-s2case.
const S1 = ['m0', 'm1', 'm2', 'm3', 'm3n', 'm4', 'm5', 'm6', 'm7', 't7', 'm8'];
module.exports = async h => {
  const s2page = await h.ev(() => !!(window.V13 && V13.isS2));
  h.log('page:', s2page ? 'Season 2' : 'Season 1 only');
  const shown = () => h.ev(() => [...document.querySelectorAll('.overlay.show')].map(o => o.id));
  const clear = () => h.ev(() => {
    if(typeof closeDesk === 'function') try{ closeDesk(); }catch(e){}
    showOverlay(null); showHUD(true); ENGINE.movementEnabled = true;
  });
  const realJ = async () => { await h.page.keyboard.press('KeyJ'); await h.step(150); };
  const docJ = async () => { await h.ev(() => document.dispatchEvent(new KeyboardEvent('keydown', { code:'KeyJ', key:'j', bubbles:true }))); await h.step(150); };
  // the pill (screens may hide it in Season 2: then its own click handler is called, as a tap would)
  const pill = async () => { await h.ev(() => { const p = document.getElementById('btn-desk'); if(!p) throw new Error('no #btn-desk'); p.click(); }); await h.step(150); };
  const pause = async () => {
    await h.ev(() => { if(typeof togglePause === 'function') togglePause(); else showOverlay('screen-pause'); });
    await h.step(200);
    const ok = await h.ev(() => !!document.querySelector('#screen-pause.show'));
    h.assert(ok, 'the pause menu opened');
    await h.ev(() => { const b = document.getElementById('btn-pause-desk'); if(!b) throw new Error('no #btn-pause-desk'); b.click(); });
    await h.step(200);
  };
  const expect = async (want, label) => {
    const s = await shown();
    h.log('  ' + label + ' →', JSON.stringify(s));
    h.assert(s.includes(want) && !(want === 'screen-desk' ? s.includes('screen-s2case') : s.includes('screen-desk')), `${label} opens ${want} (shown: ${s.join(',') || 'none'})`);
  };

  // ---------- a Season 1 case: Season 1's Case Desk, on both pages ----------
  await h.start('m2', { completed:['m0', 'm1'] });
  await clear();
  h.assert(await h.ev(() => S.game.currentMission) === 'm2', 'in Case 02');
  await realJ(); await expect('screen-desk', 'S1 case · real J'); await clear();
  await docJ(); await expect('screen-desk', 'S1 case · keydown KeyJ on document'); await clear();
  await pill(); await expect('screen-desk', 'S1 case · HUD pill'); await clear();
  await pause(); await expect('screen-desk', 'S1 case · pause CASE DESK'); await clear();

  // ---------- the mission select: Season 1's Case Desk ----------
  const fromSelect = async label => {
    await h.ev(() => { if(typeof closeDesk === 'function') try{ closeDesk(); }catch(e){} renderMissionSelect(); showOverlay('screen-missions'); });
    await h.step(150);
    await h.ev(() => { const b = document.getElementById('btn-missions-desk'); if(!b) throw new Error('no #btn-missions-desk'); b.click(); });
    await h.step(200);
    await expect('screen-desk', label);
  };
  await fromSelect('mission select · CASE DESK');
  await clear();

  if(!s2page){
    h.assert(await h.ev(() => typeof window.V13 === 'undefined'), 'the Season 1 page has no Season 2 layer');
    h.log('Season 1 page: unchanged routes checked');
    return;
  }

  // ---------- Season 2: the h13 office, then Case 12 ----------
  const enterS2 = async id => {
    await h.ev(([id, S1]) => {
      ART.failed = true; ART.promise = null;
      S = defaultState();
      S.game.completedMissions = S1.concat(['m9', 'm10', 'm11', 'm12', 'm13', 'm13b']);
      S.game.seasonOneComplete = true;
      S.game.intel = { briefed:{ m3:1, m4:1, m5:1, m6:1, m7:1 } };
      V13.s2().hubs = { h9:1, h10:1, h11:1, h12:1 };
      showOverlay(null); loadMission(id);
      setTimeout(() => { if(document.querySelector('#screen-controls.show')) beginMission(id); }, 700);
    }, [id, S1]);
    const t0 = Date.now(); let ok = false;
    while(Date.now() - t0 < 20000){
      await h.step(400);
      ok = await h.ev(id => S.game.currentMission === id && !!ENGINE.player && ENGINE.movementEnabled && !document.querySelector('#title-card.show'), id);
      if(ok) break;
    }
    h.log('  entered', id, ok ? '' : '(the scene did not settle under the stub: state set directly)');
    if(!ok) await h.ev(id => { S.game.currentMission = id; }, id);
    await h.step(600);
    await clear();
  };
  for(const id of ['h13', 'm12']){
    await enterS2(id);
    h.assert(await h.ev(() => V13.isS2(S.game.currentMission) || !!(V13.HUBS && V13.HUBS[S.game.currentMission])), id + ' is a Season 2 operation');
    await realJ(); await expect('screen-s2case', id + ' · real J'); await clear();
    await docJ(); await expect('screen-s2case', id + ' · keydown KeyJ on document'); await clear();
    await pill(); await expect('screen-s2case', id + ' · HUD pill'); await clear();
    await pause(); await expect('screen-s2case', id + ' · pause CASE DESK'); await clear();
  }
  // the mission select's CASE DESK stays on Season 1's Case Desk, even with a Season 2 id current
  await fromSelect('mission select (Season 2 id current) · CASE DESK');
  await clear();
  // the HUD's EVIDENCE button already went through the wrap (v13_boot.js): unchanged
  await h.ev(() => { const b = document.getElementById('cb-ev'); if(b) b.click(); });
  await h.step(200);
  h.log('  m12 · HUD EVIDENCE →', JSON.stringify(await shown()));
  await clear();
};
