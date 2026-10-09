// Wayfinding · HUD objective tracker: "objective text · N m" in the mission panel (M2, M3),
// text without distance for objectives with no place in the world, and ~5 Hz DOM updates.
const lib = require('./wayfind_lib.cjs');

const row = h => h.ev(() => {
  const r = document.querySelector('#hud-mission-objs .obj');
  if (!r) return null;
  const q = s => (r.querySelector(s) || {}).textContent || '';
  return { cls: r.className, txt: q('.obj-t'), dist: q('.obj-dist'), count: q('.obj-count') };
});
const distTo = (h, label) => h.ev(label => {
  const it = ENGINE.interactables.find(i => i.label === label), p = ENGINE.player.position;
  if (!it) return 'missing: ' + label + ' in ' + ENGINE.interactables.map(i => i.label).join(' | ');
  return Math.round(Math.hypot(it.mesh.position.x - p.x, it.mesh.position.z - p.z));
}, label);

module.exports = async h => {
  // ---- M2 ----
  await lib.start(h, 'm2', { completed: ['m0', 'm1'] });
  await lib.realClock(h);
  await h.step(600);
  let r = await row(h), d = await distTo(h, 'Speak with Informant Tunde');
  h.log('M2 start:', JSON.stringify(r));
  h.assert(r && r.txt === 'Speak with informant Tunde', 'M2 tracker shows the first objective');
  h.assert(r.dist === `· ${d} m` && d > 5, `M2 tracker shows the distance to Tunde (${r.dist} vs ${d} m)`);
  await h.shot('wayfind_tracker_m2');

  // the distance follows the player
  await h.ev(() => { ENGINE.player.position.x = -6; ENGINE.player.position.z = 2; });
  await h.step(450);
  r = await row(h);
  h.assert(r.dist === '· 4 m', 'distance updates as the player moves: ' + r.dist);

  // ~5 Hz: move the player every frame for 2 s, count writes to the distance text
  const writes = await h.ev(() => new Promise(res => {
    const el = document.querySelector('#hud-mission-objs .obj-dist'); let n = 0;
    const mo = new MutationObserver(m => { n += m.length; }); mo.observe(el, { childList: true, characterData: true, subtree: true });
    const t0 = performance.now();
    (function f() {
      const t = performance.now() - t0; ENGINE.player.position.z = 2 + t / 50;   // 20 m/s: a new metre every frame or so
      if (t < 2000) requestAnimationFrame(f); else { mo.disconnect(); res(n); }
    })();
  }));
  h.log('distance writes in 2 s while moving 20 m/s:', writes);
  h.assert(writes >= 5 && writes <= 13, 'tracker DOM updates are throttled to ~5 Hz (' + writes + ' in 2 s)');

  // next objective
  await h.ev(() => { S.game._marketTunde = true; completeObjective('o1_tunde'); });
  await h.step(300);
  r = await row(h); d = await distTo(h, 'Scan suspect phone');
  h.assert(r.txt === 'Scan suspect phone' && r.dist === `· ${d} m`, 'second objective + distance: ' + JSON.stringify(r));
  h.assert(r.count === '2/4', 'count follows: ' + r.count);

  // an objective that lives on the operations table: text, no distance
  await h.ev(() => { completeObjective('o2_scan'); completeObjective('o3_runner'); });
  await h.step(300);
  r = await row(h);
  h.assert(/operations table/i.test(r.txt) && r.dist === '', 'UI-only objective shows text without distance: ' + JSON.stringify(r));
  const ui = await h.ev(() => { const x = WAY.resolve(); return { ui: !!(x && x.uiOnly), g: guideTarget() }; });
  h.assert(ui.ui && ui.g === null, 'UI-only objective: no world target for the marker/arrow');

  // all done: "All clear — extract" with the distance to the van
  await h.ev(() => completeObjective('o4_table'));
  await h.step(300);
  r = await row(h);
  h.assert(/allclear/.test(r.cls) && /All clear/.test(r.txt) && /^· \d+ m$/.test(r.dist), 'all clear points at the exit: ' + JSON.stringify(r));

  // ---- M3 (legacy mansion) ----
  await lib.start(h, 'm3', { completed: ['m0', 'm1', 'm2'] });
  await h.step(500);
  r = await row(h); d = await distTo(h, 'Plan the raid with Sgt. Uche');   // v12's raid plan renames the briefing
  h.log('M3 start:', JSON.stringify(r));
  h.assert(r.txt === 'Plan the raid with Sgt. Uche' && r.dist === `· ${d} m`, 'M3 tracker: Uche + distance');
  await h.ev(() => { S.game._mansionPreBriefed = true; completeObjective('o1_brief_squad'); });
  await h.step(300);
  r = await row(h); d = await distTo(h, 'Calm and escort the child');
  h.assert(r.txt === 'Secure the child' && r.dist === `· ${d} m`, 'M3 second objective → the child: ' + JSON.stringify(r));
  await h.shot('wayfind_tracker_m3');
  h.assert(!h.errors.length, 'no page errors');
};
