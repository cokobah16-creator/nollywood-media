// v13 A · playstyle and THE HOUSE IS AWAKE (design §5, A3, A5): intelStyle() always returns
// {key, scores} with 'proc' when every score is 0 or on a tie; playstyle never sets S.game._finWarned.
// _finWarned comes only from I().alert >= 2 at the m8 start (deliberate leaks the player chose), with the
// toast 'THE HOUSE IS AWAKE' 2.2 s in — unless the car tail already woke the house (v12_car's own toast).
const A_LIB = require('./v13_a_lib.cjs');
const UP_TO_M7 = ['m0', 'm1', 'm2', 'm3', 'm3n', 'm4', 'm5', 'm6', 'm7', 't7'];
module.exports = async h => {
  const A = A_LIB.lib(h);
  const spyToasts = () => h.ev(() => { window.__toasts = []; if(!window.toast._spy){ const t = window.toast; window.toast = function(big, small){ window.__toasts.push(String(big) + ' | ' + String(small || '')); return t.apply(this, arguments); }; window.toast._spy = true; } });
  const toM8 = async (state) => {
    await h.start('m8', { completed:UP_TO_M7, wait:600, state });
    await spyToasts();
    await h.step(2400);
    return h.ev(() => ({ warned:!!S.game._finWarned, style:S.game.intel.styleAtFinale, sc:intelStyle(), toasts:window.__toasts.slice(), alert:S.game.intel.alert, cur:S.game.currentMission }));
  };

  // ---- a fresh campaign into m8: nobody is warned ----
  const f = await toM8(null);
  h.log('fresh', JSON.stringify(f));
  h.assert(f.cur === 'm8', 'm8 is running');
  h.assert(f.warned === false, 'fresh campaign: _finWarned stays false');
  h.assert(f.style === 'proc' && f.sc.key === 'proc' && Object.values(f.sc.scores).every(v => v === 0), 'no score above 0: the style is proc');
  h.assert(!f.toasts.some(t => /HOUSE IS AWAKE/.test(t)), 'no warning toast');

  // ---- a loud, forceful player is still not warned: playstyle never sets it ----
  const l = await toM8(S => { S.game.forceUsed = 6; S.game.moralChoices = { entry:'loud', shrine:'force', choice:'force' }; });
  h.log('loud', JSON.stringify(l));
  h.assert(l.sc.key === 'aggr' && l.style === 'aggr' && l.warned === false, 'a Front Door player is read as aggr, and the house is not warned for it');

  // ---- ties go to proc ----
  const tie = await h.ev(() => { S.game.forceUsed = 0; S.game.moralChoices = { choice:'flip', checkpoint:'flip_driver' }; S.game.intel.press = 'trace'; S.game.intel.order = 'leak'; return intelStyle(); });
  h.log('tie', JSON.stringify(tie));
  h.assert(tie.scores.inf === tie.scores.media && tie.scores.inf > 0 && tie.key === 'proc', 'a tie between styles reads as proc');

  // ---- one leak is not enough ----
  const one = await toM8(S => { S.game.intel = { briefed:{ m3:1, m4:1, m5:1, m6:1, m7:1 }, items:{}, alert:1 }; });
  h.assert(one.warned === false && !one.toasts.some(t => /HOUSE IS AWAKE/.test(t)), 'alert 1: not warned');

  // ---- two leaks the player chose: warned, with the toast ----
  const two = await toM8(S => { S.game.intel = { briefed:{ m3:1, m4:1, m5:1, m6:1, m7:1 }, items:{}, alert:2 }; });
  h.log('two', JSON.stringify(two));
  h.assert(two.warned === true, 'alert 2: _finWarned at the m8 start');
  h.assert(two.toasts.some(t => t === 'THE HOUSE IS AWAKE | Somebody told them you were coming.'), 'the toast says the house is awake');
  await h.ev(() => window.toast('THE HOUSE IS AWAKE', 'Somebody told them you were coming.', 3200));
  await h.step(200);
  await h.shot('v13_a_house_awake_' + (await A.vp()));
  await A.audit('#toast', 'THE HOUSE IS AWAKE toast');

  // ---- the alert sources the design lists: w_eko via the Commander is +1 ----
  const src = await h.ev(() => {
    S.game.intel.warrants = {}; S.game.intel.alert = 0;
    const keep = V12.warrantFor; V12.warrantFor = () => ({ strength:90, signed:true, refused:false, strikes:0, need:'Ready to sign' });
    V12.fileV13Warrant('w_eko', { status:'signed', route:'commander' }); V12.warrantFor = keep;
    return S.game.intel.alert;
  });
  h.assert(src === 1, 'routing w_eko through the Commander\'s office is one alert');

  // ---- the car tail already woke the house: v13 adds no second toast ----
  const car = await toM8(S => { S.game.intel = { briefed:{ m3:1, m4:1, m5:1, m6:1, m7:1 }, items:{}, alert:3 }; S.game.mem = { car:{ outcome:'burned' } }; });
  h.log('car', JSON.stringify(car));
  h.assert(car.warned === true, 'burned tail + alert: warned');
  h.assert(!car.toasts.some(t => /Somebody told them/.test(t)), 'no second toast from v13 when the car tail already woke the house');

  // ---- Recruit is the same ----
  const r = await toM8(S => { S.game.difficulty = 'recruit'; S.game.intel = { briefed:{ m3:1, m4:1, m5:1, m6:1, m7:1 }, items:{}, alert:0 }; S.game.forceUsed = 9; });
  h.assert(r.warned === false && r.sc.key === 'aggr', 'Recruit: playstyle never warns the house either');
  await A.textRules(['THE HOUSE IS AWAKE', 'Somebody told them you were coming.'], 'warning toast');
  h.assert(h.errors.length === 0, 'no page errors');
};
