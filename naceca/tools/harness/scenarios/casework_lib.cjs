// Shared helpers for the casework scenarios. Running this file on its own is a no-op scenario.
//   const L = require('./casework_lib.cjs').lib(h);
const lib = h => {
  const L = {};
  // run every open dialogue to its end (no choices in the lines these tests reach)
  L.finishDialogue = async (max = 60) => {
    for(let i = 0; i < max; i++){
      const open = await h.ev(() => {
        const d = document.querySelector('#screen-dialogue.show');
        if(!d || !DLG.script) return false;
        const line = DLG.script[DLG.idx];
        if(line && line.choices && line.choices.length){
          let b = document.querySelector('#dlg-choices button');
          if(!b && typeof skipTypewriter === 'function'){ skipTypewriter(); b = document.querySelector('#dlg-choices button'); }
          if(b) b.click(); return true;
        }
        advanceDialogue(); return true;
      });
      if(!open) return;
      await h.step(30);
    }
  };
  // the hub's Uche talk and phone, so the Commander will take the call
  L.hubPrep = async () => {
    await h.ev(() => { const it = ENGINE.interactables.find(i => /^Talk to Uche/.test(i.label || '')); it.onInteract(); });
    await h.step(150); await L.finishDialogue();
    await h.ev(() => {
      Object.values(V12.mem().phone).forEach(t => { t.unread = 0; if(t.pending){ V12.reply(t.pending.id, t.pending.opts[0].v); t.pending = null; } });
      const it = ENGINE.interactables.find(i => /^Check your phone/.test(i.label || '')); it.onInteract();
    });
    await h.step(200);
    await h.ev(() => document.querySelector('#screen-phone .ph-x').click());
    await h.step(150);
  };
  L.commander = async () => { await h.ev(() => { const it = ENGINE.interactables.find(i => /Commander Adaeze$/.test(i.label || '')); it.onInteract(); }); await h.step(200); };
  L.shown = id => h.ev(id => !!document.querySelector('#' + id + '.show'), id);
  L.pick = (ov, k, v) => h.ev(([ov, k, v]) => { const b = document.querySelector(`#${ov} [data-k="${k}"][data-v="${v}"]`); if(!b) throw new Error('no option ' + k + '=' + v); b.click(); }, [ov, k, v]);
  L.fileTwice = async (ov = 'screen-charge') => {
    const first = await h.ev(ov => { const b = document.querySelector(`#${ov} [data-act="file"]`); b.click(); return b.textContent; }, ov);
    await h.step(60);
    await h.ev(ov => document.querySelector(`#${ov} [data-act="file"]`).click(), ov);
    await h.step(1250);
    return first;
  };
  L.fileSheet = async (picks, ov = 'screen-charge') => { for(const k of Object.keys(picks)) await L.pick(ov, k, picks[k]); return L.fileTwice(ov); };
  L.rep = () => h.ev(() => Object.assign({}, S.player.reputation));
  L.warrant = (w) => h.ev(w => { V12.warrantFor = () => Object.assign({}, w); }, w);
  // a hub with the given case ready for the Commander (fresh state)
  L.toHub = async (mission, completed, state) => {
    // let any title card from a previous hub (endHub → loadMission) finish first
    if(await h.ev(() => !!(V12.mem && Object.keys(V12.mem().hubs || {}).length))) await h.step(2900);
    await h.start(mission, { completed, state, wait:3600 });
    await h.ev(() => { if(typeof SIDE !== 'undefined') SIDE.mid = null; });
  };
  // the raid's aftermath, with nothing else moving reputation
  L.aftermath = async (mid) => {
    return h.ev(mid => {
      if(typeof SIDE !== 'undefined') SIDE.mid = null;
      S.game.currentMission = mid;
      S.game._opStart = { arrests:S.game.arrests || 0, civ:S.game.civiliansRescued || 0, force:S.game.forceUsed || 0, intel:S.game.intelScore || 0, xp:S.player.xp || 0, rep:Object.assign({}, S.player.reputation) };
      const before = Object.assign({}, S.player.reputation), intel0 = S.game.intelScore || 0;
      showAftermath();
      const after = Object.assign({}, S.player.reputation);
      return { d:{ pt:after.publicTrust - before.publicTrust, af:after.agencyFavour - before.agencyFavour, in:after.integrity - before.integrity }, intel:(S.game.intelScore || 0) - intel0,
        head:S.game.headlines[S.game.headlines.length - 1], review:(document.querySelector('#aftermath-grid .cw-review') || {}).textContent || '' };
    }, mid);
  };
  return L;
};
module.exports = async () => {};
module.exports.lib = lib;
