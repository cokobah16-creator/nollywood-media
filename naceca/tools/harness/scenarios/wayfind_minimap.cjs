// Wayfinding · minimap: the street layer moves and scales with the player (same transform as the
// dots), a persistent objective blip clamped to the rim, a pointed player arrow showing facing,
// and during a catch chase a red suspect blip (live, then a last-seen ring) while the static
// spawn dot of the suspect is hidden.
const lib = require('./wayfind_lib.cjs');

const mm = h => h.ev(() => {
  const g = id => document.getElementById(id);
  const vis = el => !!el && el.style.display !== 'none';
  return { streets: g('minimap-streets').getAttribute('transform'), pois: g('minimap-pois').getAttribute('transform'),
           clipped: g('minimap-streets').parentNode.id === 'mm-world', arrowD: g('minimap-arrow').getAttribute('d'), arrowT: g('minimap-arrow').getAttribute('transform'),
           obj: vis(g('mm-obj')) ? Object.assign({ rim: g('mm-obj').classList.contains('rim'), t: g('mm-obj').getAttribute('transform') }, WAY._mm.objState) : null,
           sus: vis(g('mm-sus')) ? Object.assign({ cls: g('mm-sus').getAttribute('class') }, WAY._mm.susState) : null,
           staticSuspect: !!document.querySelector('#minimap-pois .mm-suspect-static'), dots: document.querySelectorAll('#minimap-pois circle').length, k: WAY._mm.k };
});

module.exports = async h => {
  await lib.start(h, 'm2', { completed: ['m0', 'm1'] });
  await lib.realClock(h);
  await h.step(400);
  let s = await mm(h);
  h.log('start:', JSON.stringify(s));
  const p0 = await h.ev(() => [ENGINE.player.position.x, ENGINE.player.position.z]);
  h.assert(s.streets === s.pois && /^scale\([\d.]+\) translate\(/.test(s.streets), 'streets and dots share one transform: ' + s.streets);
  h.assert(s.streets.includes(`translate(${(-p0[0]).toFixed(2)} ${(-p0[1]).toFixed(2)})`), 'street layer centred on the player');
  h.assert(s.clipped, 'the moving layer is clipped to the map circle');
  h.assert(s.staticSuspect, "before the chase the suspect's dot is on the map");

  // walk: the streets follow
  await h.ev(() => { ENGINE.player.position.x = 5; ENGINE.player.position.z = 2; });
  await h.step(150);
  s = await mm(h);
  h.assert(s.streets.includes('translate(-5.00 -2.00)'), 'street layer moves with the player: ' + s.streets);
  // another scene scale → the street layer scales
  await h.ev(() => { MINIMAP.scale = 4; });
  await h.step(150);
  const s4 = await mm(h);
  h.assert(Math.abs(s4.k - 48 / 18) < 1e-3 && s4.streets.startsWith('scale(2.6667)'), 'street layer scales with MINIMAP.scale: ' + s4.streets);
  await h.ev(() => { MINIMAP.scale = 6; });

  // pointed arrow: rotate(180 − yaw)
  await h.ev(() => { ENGINE.playerYaw = Math.PI / 2; });
  await h.step(150);
  s = await mm(h);
  h.assert(/^M0 -5\.6/.test(s.arrowD) && s.arrowT === 'rotate(90.0)', 'pointed player arrow faces the heading: ' + s.arrowD + ' ' + s.arrowT);

  // objective blip: Tunde, inside the rim, then clamped to the rim when far
  h.assert(s.obj && !s.obj.rim, 'objective blip on the map: ' + JSON.stringify(s.obj));
  const tunde = await h.ev(() => { const p = ENGINE.player.position; return [(-6 - p.x) * WAY._mm.k, (-2 - p.z) * WAY._mm.k]; });
  h.assert(Math.abs(s.obj.x - tunde[0]) < 0.01 && Math.abs(s.obj.y - tunde[1]) < 0.01, 'objective blip sits at Tunde');
  await h.ev(() => { ENGINE.player.position.x = 20; ENGINE.player.position.z = 20; });
  await h.step(150);
  s = await mm(h);
  h.assert(s.obj && s.obj.rim && Math.abs(Math.hypot(s.obj.x, s.obj.y) - 42) < 0.01, 'far objective clamped to the rim: ' + JSON.stringify(s.obj));
  await h.shot('wayfind_minimap_rim');

  // the chase: red suspect blip, no static spawn dot, no objective blip
  await lib.marketChase(h);
  await h.step(300);
  s = await mm(h);
  h.log('chase:', JSON.stringify(s));
  h.assert(s.sus && s.sus.mode === 'live' && !/lastseen/.test(s.sus.cls), 'red suspect blip (live)');
  h.assert(!s.staticSuspect, "the suspect's static spawn dot is hidden during the chase");
  h.assert(!s.obj, 'the suspect blip replaces the objective blip');
  const fill = await h.ev(() => getComputedStyle(document.querySelector('#mm-sus .mm-sus-dot')).fill);
  h.assert(/rgb\(179, 38, 30\)/.test(fill), 'suspect blip is stamp red: ' + fill);
  // far away → clamped to the rim
  await h.ev(() => { ENGINE.player.position.x = -20; ENGINE.player.position.z = 20; });
  await h.step(150);
  s = await mm(h);
  h.assert(s.sus.rim && Math.abs(Math.hypot(s.sus.x, s.sus.y) - 42) < 0.01, 'suspect blip clamped to the rim');
  await h.ev(() => { const r = CHASE.active.runner.position; ENGINE.player.position.x = r.x - 6; ENGINE.player.position.z = r.z; });
  // out of sight for 3 s → last-seen ring + ping
  await h.ev(() => { WAY._forceLos = false; });
  await h.step(3600);
  s = await mm(h);
  const ping = await h.ev(() => document.querySelector('#mm-sus .mm-sus-ping').getAttribute('class'));
  h.assert(s.sus && s.sus.mode === 'lastseen' && /lastseen/.test(s.sus.cls) && /go/.test(ping), 'last-seen ring with a ping: ' + JSON.stringify(s.sus) + ' ' + ping);
  await h.shot('wayfind_minimap_lastseen');
  await h.ev(() => { WAY._forceLos = null; stopChase(); });
  await h.step(150);
  s = await mm(h);
  h.assert(!s.sus && !s.staticSuspect, "after the chase: no suspect blip, and the stale spawn dot stays off");
  h.assert(!h.errors.length, 'no page errors');
};
