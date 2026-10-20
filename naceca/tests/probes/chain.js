// The whole of Season 2 in order, forcing each case to finish once it has built:
// checks every scene loads, every hub appears between the right cases, and the season ends in the epilogue.
const sc = require('../scen13.js');
const ORDER = ['m9', 'h9', 'm10', 'h10', 'm11', 'h11', 'm12', 'h12', 'm13', 'm13b', 'h13', 'm14', 'h14', 'm15'];
module.exports = async function (T) {
  await T.ev(prep => { (new Function(prep))(); V13._skipHubs = false; showOverlay(null); loadMission('m9'); }, sc.S1DONE);
  for (const id of ORDER) {
    const ok = await T.until(id => { const b = document.getElementById('btn-start-mission'); if (b && b.offsetParent && S.game.currentMission === id) b.click();
      return S.game.currentMission === id && ENGINE.player && V13.rt && V13.rt.id === id && !V13._pendingBegin
      && !document.querySelector('#title-card.show') && !(document.getElementById('v13-loading') || {}).classList?.contains('show'); }, 150000, id);
    await T.wait(2500);
    const info = await T.ev(() => ({ m:S.game.currentMission, objs:(S.game.objectives || []).map(o => o.id).join(','), its:ENGINE.interactables.length, env:ENGINE._dress && ENGINE._dress.key,
      people:(ENGINE.extraSkinned || []).length, dlg:document.getElementById('screen-dialogue').classList.contains('show') }));
    T.log(id, ok ? 'OK' : 'TIMEOUT', JSON.stringify(info));
    await T.shot('chain_' + id);
    if (!ok) break;
    if (id.startsWith('h')) {
      await T.ev(h => { V13.done('hb_uche'); if (V13.HUBS[h].wire && V13.mc().s2_wire == null) V13.setFlag('s2_wire', true); showOverlay(null);
        const it = ENGINE.interactables.find(i => i.label === V13.HUBS[h].go); const P = ENGINE.player; const p = new THREE.Vector3(); it.mesh.getWorldPosition(p); P.position.set(p.x, 0, p.z - 1); it.onInteract(); }, id);
    } else {
      await T.ev(id => {
        const m = V13.mc();
        const F = { m9:{ s2_custody:'signed', s2_method:'image', s2_abuja_call:'truth', s2_original:'kept' }, m10:{ s2_karo:'trust', s2_ejiro:'source', s2_jetty:'lucky', s2_statement:'proper' },
          m11:{ s2_timi:'source', s2_samples:'sealed', s2_felix:'cooperating', s2_camp:'felix_only', s2_barge:'tagged' }, m12:{ s2_warrant:'waited', s2_search:'amina', s2_inventory:'signed', s2_sotonye:'witness', s2_ibinabo:'source' },
          m13:{ s2_ninth:'refuse' }, m13b:{ s2_bitrus:'witness' }, m14:{}, m15:{ s2_raid_entry:'water', s2_end:'truth' } }[id];
        Object.assign(m, F); Object.assign(S.game.flags, F);
        if (id === 'm14') V13.s2().trial = Object.assign(V13.s2().trial || {}, { d1:'guilty', d2:'plea', d3:'guilty' });
        if (id === 'm15') V13.s2().finale = 'proven';
        try { if (typeof endDialogue === 'function' && document.getElementById('screen-dialogue').classList.contains('show')) endDialogue(); } catch (e) {}
        TPCAM.override = null; V13.recruitFromFlags(); V13.finish(id);
      }, id);
      await T.until(() => document.getElementById('screen-aftermath').classList.contains('show'), 20000);
      await T.wait(1200);
      if (id === 'm15') { await T.shot('chain_m15_aftermath'); }
      await T.ev(() => document.getElementById('btn-aftermath-continue').click());
    }
    await T.wait(1500);
  }
  // the epilogue
  const epi = await T.until(() => [...document.querySelectorAll('.overlay.show')].length > 0, 20000);
  await T.wait(2000); await T.shot('chain_epilogue');
  T.log('end', epi, await T.ev(() => JSON.stringify({ srcs:V13.srcList(), hubs:Object.keys(V13.s2().hubs || {}), done:S.game.completedMissions.slice(-8) })));
};
