// screens team (R05): Season 1's HUD meters on a landscape phone (844x390 touch) sit where our wayfinding puts them,
// centred above the controls, with Season 2 installed (s2.css had a global .touch-active #hud-meters rule that moved
// them to x -24, under the joystick). Run it phone mode on the Season 2 page; on the Season 1-only page it gives the reference.
const { checks, R } = require('./screens_lib.js');
module.exports = async function (T) {
  const C = checks(T);
  await T.ev(() => { showOverlay(null); loadMission('m2'); });
  await T.until(() => { const b = document.getElementById('btn-start-mission'); if (b && b.offsetParent) { b.click(); } return S.game.currentMission === 'm2' && ENGINE.movementEnabled; }, 90000);
  await T.wait(2500);
  await T.ev(() => { showOverlay(null); try { endDialogue(); } catch (e) {} showHUD(true); showMeter('trace', 'TRACE', 0.55, 'info', '55%'); showMeter('eyes', 'SUSPICION', 0.3, 'info', '30%'); });
  await T.wait(800);
  const r = await T.ev(() => { const m = document.getElementById('hud-meters'), j = document.getElementById('joystick') || document.querySelector('.joystick'), s = document.getElementById('hud-sprint');
    const B = e => e ? (o => [o.left, o.top, o.right, o.bottom].map(Math.round))(e.getBoundingClientRect()) : null;
    const cs = m ? getComputedStyle(m) : {}; return { meters:B(m), left:cs.left, transform:cs.transform, joystick:B(j), sprint:B(s), vw:innerWidth, vh:innerHeight, s2:!!window.V13 && !!V13.CARDS, touch:document.body.classList.contains('touch-active') }; });
  T.log('meters', JSON.stringify(r));
  await R.shot(T, 'screens_meters_m2' + (r.s2 ? '_s2' : '_s1'));
  const m = r.meters, mid = m ? (m[0] + m[2]) / 2 : -1;
  const clear = (a, b) => !a || !b || a[2] <= b[0] || a[0] >= b[2] || a[3] <= b[1] || a[1] >= b[3];
  C.ok('R05-meters-on-screen', !!m && m[0] >= 0 && m[2] <= r.vw, JSON.stringify(m));
  C.ok('R05-meters-centred', !!m && Math.abs(mid - r.vw / 2) <= 30, 'centre ' + mid + ' of ' + r.vw + ' (the Season 1 page measured 272..572 at 844)');
  C.ok('R05-meters-clear-of-controls', clear(m, r.joystick) && clear(m, r.sprint), JSON.stringify({ meters:m, joystick:r.joystick, sprint:r.sprint }));
  C.done();
};
