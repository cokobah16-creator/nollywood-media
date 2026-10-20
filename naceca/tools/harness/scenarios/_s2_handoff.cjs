// Season 2 hand-off, for Season 1 scenarios that finish the season.
// With the Season 2 layer in the page (src/season2) and Season 2 not begun, the case review's FINISH goes on to
// "SEASON 2 · OPERATION UPSTREAM · Six weeks later" and Case 09 instead of the title screen (by design:
// docs/season2/INTEGRATION.md). On a Season-1-only page (NACECA_SEASON2=0) FINISH goes to the title, as before.
//   const pending = await S2H.pending(h);          // read BEFORE the FINISH click
//   ...click FINISH...
//   const end = await S2H.after(h, pending);       // { title, s2 }: exactly one of them is true when the flow is right
//   if(end.s2) await S2H.toTitle(h);               // back to the title the way a player gets there (pause → QUIT)
const S2H = {};
S2H.pending = h => h.ev(() => !!(window.V13 && typeof V13.s2 === 'function' && typeof V13.isS2 === 'function') && !V13.s2().started);
S2H.after = async (h, pending, ms = 6000) => {
  for(let t = 0; t <= ms; t += 250){
    const r = await h.ev(() => ({
      title:!!document.querySelector('#screen-title.show'),
      card:!!document.querySelector('#title-card.show') && /SEASON 2/.test((document.getElementById('title-card') || {}).textContent || ''),
      m:S.game.currentMission,
    }));
    if(pending && (r.card || r.m === 'm9')) return { title:false, s2:true };
    if(r.title) return { title:true, s2:false };
    await h.step(250);
  }
  return { title:false, s2:false };
};
S2H.ok = (pending, end) => pending ? end.s2 : end.title;
S2H.what = pending => pending ? 'FINISH hands over to Season 2 (OPERATION UPSTREAM, Case 09)' : 'FINISH goes to the title';
S2H.toTitle = async h => {
  for(let t = 0; t < 10000; t += 250){
    if(await h.ev(() => S.game.currentMission === 'm9' && !document.querySelector('#title-card.show'))) break;
    await h.step(250);
  }
  await h.ev(() => { if(!document.querySelector('#screen-pause.show')) togglePause(); document.getElementById('btn-quit').click(); });
  await h.step(300);
  return h.ev(() => !!document.querySelector('#screen-title.show'));
};
module.exports = S2H;
