// v13 A · radio bulletins and the s.84 window (design A7).
// Bulletins: field operations only (m2–m8, never m3n, a hub or the t7 car); no undefined line, no throw
// from a timer. s.84: an item's window closes when the next briefed operation starts; a hub counts as the
// operation it follows and t7 as m7 — laptop certifiable at m3n, not at h4; tower_cdr certifiable at h7
// and in t7, not once m8 has started; nothing after the trial.
const A_LIB = require('./v13_a_lib.cjs');
module.exports = async h => {
  const A = A_LIB.lib(h);

  // ---- a hub: 9.5 s in the office, no bulletin and no page error (the drop threw here) ----
  await h.start('m3', { completed:['m0', 'm1', 'm2'], wait:3600 });
  h.assert(await h.ev(() => S.game.currentMission === 'h2' && ENGINE.movementEnabled), 'Lagos HQ (h2) is running');
  await h.step(9600);
  const hub = await h.ev(() => ({ radio:Object.keys(S.game.intel.radio || {}), errs:0 }));
  h.assert(!hub.radio.length, 'no bulletin in the hub');
  h.assert(h.errors.length === 0, 'no page error 9 s into h2: ' + h.errors.join(' | '));

  // ---- lines for every id: strings only, nothing for the hubs or the car ----
  const L = await h.ev(() => {
    const ids = ['m0', 'm1', 'm2', 'm3', 'm3n', 'm4', 'm5', 'm6', 'm7', 't7', 'm8', 'h2', 'h4', 'h5', 'h6', 'h7', 'zz'];
    S.game.headlines = []; S.game.completedMissions = ['m0', 'm1', 'm2'];
    const lines = ids.map(id => [id, radioLines(id)]);
    const ok = lines.every(([, l]) => Array.isArray(l) && l.length >= 1 && l.length <= 2 && l.every(t => typeof t === 'string' && t.length));
    const played = [];
    for(const id of ['h2', 'h4', 'h7', 't7', 'm3n', 'm0', 'm1']){ S.game.currentMission = id; ENGINE.movementEnabled = true; radioPlay(id); if((S.game.intel.radio || {})[id]) played.push(id); }
    // a broken data table can't throw out of the timer either
    const keep = RADIO_FILLER.slice(); RADIO_FILLER.length = 0; let threw = false;
    try{ S.game.currentMission = 'm4'; radioPlay('m4'); radioLines('m4'); }catch(e){ threw = true; }
    RADIO_FILLER.push(...keep);
    return { ok, played, threw, all:lines.flatMap(([, l]) => l), ops:RADIO_OPS.slice() };
  });
  h.log('radio', JSON.stringify({ ok:L.ok, played:L.played, threw:L.threw, ops:L.ops }));
  h.assert(L.ok, 'radioLines returns 1–2 strings for every id, hubs and the car included');
  h.assert(!L.played.length, 'radioPlay does nothing in a hub, the car, Night Shift or the first two cases: ' + L.played.join());
  h.assert(!L.threw, 'an empty filler table cannot throw');
  h.assert(L.ops.join() === 'm2,m3,m4,m5,m6,m7,m8', 'bulletins are for m2–m8 only');
  await A.textRules(L.all, 'bulletin lines');
  // the rumours follow the story: no "raided" shrine unless it was forced, no rescue if Tobi was lost
  const R = await h.ev(() => {
    S.game.completedMissions = ['m0', 'm1', 'm2', 'm3', 'm3n', 'm4', 'm5', 'm6']; S.game.headlines = [];
    const run = mc => { S.game.moralChoices = mc; return radioLines('m7').join(' '); };
    return { rescue:run({ asaba:'rescue', shrine:'negotiate' }), failed:run({ asaba:'failed', shrine:'force' }), lost:(S.game._asabaHostageLost = true, run({ asaba:'chase' })) };
  });
  h.log('rumours', JSON.stringify(R));
  h.assert(/a rescue/.test(R.rescue) && !/shrine/i.test(R.rescue), 'a rescue at Asaba, a negotiated shrine: no raid rumour');
  h.assert(!/a rescue/.test(R.failed) && !/a rescue/.test(R.lost), 'no "rescue" rumour when Tobi was not brought out');
  await h.ev(() => { delete S.game._asabaHostageLost; });

  // ---- a field operation plays its bulletin ----
  await h.start('m2', { completed:['m0', 'm1'] });
  await h.step(9700);
  const f = await h.ev(() => (S.game.intel.radio || {}).m2 || null);
  h.log('m2 bulletin', JSON.stringify(f));
  h.assert(Array.isArray(f) && f.length >= 1 && f.length <= 2 && f.every(t => typeof t === 'string' && t.length), 'm2 plays its bulletin (1–2 lines)');
  await h.shot('v13_a_radio_m2_' + (await A.vp()));
  if(await h.ev(() => !!document.querySelector('#radio-sub.show'))) await A.audit('#radio-sub', 'radio strip');

  // ---- the s.84 window ----
  const W = await h.ev(() => {
    const d = I(), out = {};
    collectEvidence({ id:'laptop', name:'Encrypted Laptop', xp:0 });
    collectEvidence({ id:'tower_cdr', name:'Call Records — Ugbowo Cell', xp:0 });
    collectEvidence({ id:'tail_plate', name:'Plate BEN 417 KJ', xp:0 });
    collectEvidence({ id:'fin_drive', name:"Osas's Flash Drive", xp:0 });
    const at = (cur, started) => { S.game.currentMission = cur; d.started = {}; (started || []).forEach(m => { d.started[m] = true; }); return { laptop:certWindowOpen('laptop'), cdr:certWindowOpen('tower_cdr'), tail:certWindowOpen('tail_plate'), drive:certWindowOpen('fin_drive') }; };
    out.m3 = at('m3', ['m3']); out.m3n = at('m3n', ['m3', 'm3n']); out.h4 = at('h4', ['m3', 'm4']); out.m4pre = at('m4', ['m3']); out.m4 = at('m4', ['m3', 'm4']);
    out.h7 = at('h7', ['m7']); out.t7 = at('t7', ['m7']); out.m8pre = at('m8', ['m7']); out.m8 = at('m8', ['m7', 'm8']);
    // certify: works at m3n, refused at h4
    at('m3n', ['m3', 'm3n']); out.certM3n = certify('laptop');
    d.items.laptop.cert = false; d.certUsed = {};
    at('h4', ['m3', 'm4']); out.certH4 = certify('laptop');
    at('t7', ['m7']); out.certT7 = certify('tower_cdr');
    // after the trial nothing is open
    at('m8', ['m7', 'm8']); d.court = { proven:[] }; out.afterCourt = certWindowOpen('fin_drive');
    d.court = null; S.game.seasonOneComplete = true; out.afterSeason = certWindowOpen('fin_drive'); S.game.seasonOneComplete = false;
    // Senior and Recruit: the same window
    S.game.difficulty = 'recruit'; out.recruitH7 = at('h7', ['m7']).cdr; S.game.difficulty = 'senior';
    return out;
  });
  h.log('s84', JSON.stringify(W));
  h.assert(W.m3.laptop && W.m3n.laptop, 'laptop certifiable in m3 and at m3n');
  h.assert(!W.h4.laptop, 'laptop NOT certifiable at h4 (h4 follows m4)');
  h.assert(W.m4pre.laptop && !W.m4.laptop, 'the vendor rule at m4: open until m4 starts');
  h.assert(W.h7.cdr && W.t7.cdr && W.m8pre.cdr && !W.m8.cdr, 'tower_cdr certifiable at h7, in t7, before m8 starts — not once m8 has started');
  h.assert(W.t7.tail && !W.m8.tail, 'the jeep plate (t7) follows the same rule');
  h.assert(W.m8.drive, 'the finale\'s exhibits stay open until the trial');
  h.assert(W.certM3n === true && W.certH4 === false && W.certT7 === true, 'certify() follows the window');
  h.assert(!W.afterCourt && !W.afterSeason, 'no certificate after the trial or the season');
  h.assert(W.recruitH7 === true, 'Recruit: same window');
  h.assert(h.errors.length === 0, 'no page errors: ' + h.errors.join(' | '));
};
