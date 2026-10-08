// Wayfinding · WAY.resolve() agrees with the HUD text, and the old guideTarget() (marker,
// edge arrow, opening camera, 60 s hint) agrees with WAY.resolve() — M1, M2 and the cold open
// (where the marker used to stick on the kiosk for the whole tail).
const lib = require('./wayfind_lib.cjs');

const snap = async h => { await h.step(260); return h.ev(() => {
  const r = WAY.resolve(), g = guideTarget(), row = document.querySelector('#hud-mission-objs .obj');
  const pos = r && r.pos ? { x: +r.pos.x, z: +r.pos.z } : null;
  const gpos = g && g.mesh ? { x: +g.mesh.position.x, z: +g.mesh.position.z } : null;
  return { hud: row.querySelector('.obj-t').textContent, dist: row.querySelector('.obj-dist').textContent,
           label: r && r.label, ui: !!(r && r.uiOnly), kind: r && r.kind, pos, glabel: g && g.label, gpos,
           sameMesh: !!(r && g && r.mesh && r.mesh === g.mesh) };
}); };   // the tracker text refreshes at ~5 Hz
const itPos = (h, label) => h.ev(l => { const it = ENGINE.interactables.find(i => i.label === l); return it ? { x: it.mesh.position.x, z: it.mesh.position.z } : null; }, label);
const near = (a, b) => a && b && Math.hypot(a.x - b.x, a.z - b.z) < 0.01;

module.exports = async h => {
  // ---- M1: HQ briefing ----
  await lib.start(h, 'm1', { completed: ['m0'] });
  await lib.realClock(h);
  await h.step(400);
  let s = await snap(h);
  h.log('M1:', JSON.stringify(s));
  h.assert(s.hud === 'Report to Commander Adaeze' && s.label === 'Approach Commander' && s.sameMesh, 'M1 o1: HUD, resolver and guideTarget agree');
  h.assert(near(s.pos, await itPos(h, 'Approach Commander')), 'M1 o1 target position');
  await h.ev(() => { S.game._hqBriefed = true; completeObjective('o1_brief'); });
  s = await snap(h);
  h.assert(s.hud === 'Check the case board' && s.label === 'Check the case board' && s.sameMesh && near(s.gpos, s.pos), 'M1 o_board: all three agree ' + JSON.stringify(s));
  await h.ev(() => { completeObjective('o_board'); completeObjective('o_phone'); });
  s = await snap(h);
  h.assert(s.hud === 'Open your Case File' && s.ui && s.glabel === null && s.dist === '', 'M1 o_casefile: no world target, no marker, text only ' + JSON.stringify(s));
  await h.ev(() => completeObjective('o_casefile'));
  s = await snap(h);
  h.assert(s.hud === 'Deploy to Ikeja Market' && s.label === 'Deploy to Ikeja Market' && s.sameMesh, 'M1 exit');

  // ---- M2: market (the marker used to skip the table step and point at the van) ----
  await lib.start(h, 'm2', { completed: ['m0', 'm1'] });
  await h.step(300);
  s = await snap(h);
  h.assert(s.hud === 'Speak with informant Tunde' && s.label === 'Speak with Informant Tunde' && s.sameMesh, 'M2 o1 ' + JSON.stringify(s));
  // the 60 s stuck hint names what the HUD names
  const hint = await h.ev(() => { SETTINGS.hints = 'on'; GUIDE.lastSig = progressSig(); GUIDE.lastProgress = performance.now() - 61000; GUIDE._lastRun = performance.now(); updateGuidance(0.016); return document.getElementById('toast').textContent; });
  h.assert(/Try this next: Speak with informant Tunde\. Follow the arrow\./.test(hint) && !/gold/.test(hint), 'stuck hint matches the HUD text: ' + hint);
  // a failed interaction (toast only) used to leave the old target stuck; the resolver follows the objective list
  await h.ev(() => { S.game._marketTunde = true; completeObjective('o1_tunde'); });
  s = await snap(h);
  h.assert(s.label === 'Scan suspect phone' && s.sameMesh, 'M2 o2 phone');
  await h.ev(() => { S.game._marketScanned = true; completeObjective('o2_scan'); });
  s = await snap(h);
  h.assert(s.hud === 'Decide on the teen runner' && s.label === 'Confront teen suspect' && near(s.pos, { x: 8, z: 4 }), 'M2 o3 KC');
  await h.ev(() => { S.game.moralChoices.market_runner = 'caught'; completeObjective('o3_runner'); });
  s = await snap(h);
  h.assert(/operations table/.test(s.hud) && s.ui && s.glabel === null, 'M2 o4_table: the old guide pointed at the van here; now nothing ' + JSON.stringify(s));

  // ---- a stealth tail (TAIL) keeps its old targeting and gets no chase aids ----
  s = await h.ev(() => {
    const tgt = ENGINE.interactables.find(i => i.label === 'Speak with Informant Tunde').mesh;
    startTail({ target: tgt, label: 'COURIER', path: [[-6, -2], [-6, -12]], speed: 1.4 });
    const r = WAY.resolve(), g = guideTarget();
    const out = { kind: r.kind, label: r.label, same: r.mesh === tgt && g.mesh === tgt, glabel: g.label, chase: WAY.chase(), line: CHASEFX.line };
    WAY.minimap();
    out.sus = document.getElementById('mm-sus').style.display;
    stopTail();
    return out;
  });
  h.assert(s.kind === 'tail' && s.same && s.glabel === 'Follow the courier', 'tail: target and label as before ' + JSON.stringify(s));
  h.assert(s.chase === null && s.line === null && s.sus === 'none', 'tail: no route line, no red blip, no chase tracking');

  // ---- cold open ----
  await lib.start(h, 'm0', { completed: [] });
  await h.step(300);
  await h.ev(() => { CO.phase = 1; });
  s = await snap(h);
  h.log('M0 cross:', JSON.stringify(s));
  h.assert(s.hud === 'Cross to his side of the road' && s.kind === 'point' && Math.abs(s.pos.z + 6) < 0.01 && Math.abs(s.pos.x - (-24)) < 0.01, 'cold open: cross straight over the road');
  h.assert(near(s.gpos, s.pos), 'guideTarget follows the cross point');
  await h.ev(() => { CO.phase = 2; CO.wp = 4; completeObjective('co_cross'); setObjectiveText('co_follow', 'Follow the courier'); });
  s = await snap(h);
  h.log('M0 follow:', JSON.stringify(s));
  h.assert(s.hud === 'Follow the courier' && s.glabel !== 'Buy credit at the kiosk', 'cold open: the marker is no longer stuck on the kiosk');
  const courier = await h.ev(() => ({ x: CO.courier.position.x, z: CO.courier.position.z }));
  h.assert(near(s.pos, courier) && near(s.gpos, courier), 'cold open tail: target is the courier, as HUD says');
  await h.ev(() => { CO.phase = 3; });
  s = await snap(h);
  h.assert(s.hud === 'Find a way past the gate' && s.label === 'Open the gate' && s.sameMesh, 'cold open: courier in the alley → the gate is next ' + JSON.stringify(s));
  await h.ev(() => { CO.gateTried = true; WAY.invalidate(); });
  s = await snap(h);
  h.assert(s.label === 'Climb the crates' && s.sameMesh, 'cold open: gate chained → the crates');
  await h.ev(() => { CO.climbed = true; completeObjective('co_gate'); });
  s = await snap(h);
  h.assert(/courier/.test(s.hud) && near(s.pos, { x: 28.6, z: -33.2 }), 'cold open: over the crates → along the alley ' + JSON.stringify(s));
  h.assert(!h.errors.length, 'no page errors');
};
