// core: the Season 1 snapshot and the helpers on it (CN05, CN06, CN13, CN22), and Case 09's bench with Tobi alive.
const L = require('./core_lib.js'), sc = L.sc;
module.exports = async function (T) {
  const C = L.checks(T);
  await L.capture(T);
  // ---------- 1. live values before Season 2 has started (and no Season 2 state is created by reading them) ----------
  let r = await T.ev(prep => {
    (new Function(prep))();
    const out = {};
    S.game.moralChoices.asaba = 'chase'; S.game._asabaHostageLost = false;
    out.chaseAlive = [V13.tobiAlive(), V13.tobiTestifies()];
    S.game._asabaHostageLost = true; out.chaseLost = [V13.tobiAlive(), V13.tobiTestifies()];
    S.game.moralChoices.asaba = 'rescue'; S.game._asabaHostageLost = false; out.rescue = [V13.tobiAlive(), V13.tobiTestifies()];
    S.game.moralChoices.asaba = 'failed'; out.failed = [V13.tobiAlive(), V13.tobiTestifies()];
    out.noS2 = !S.game.s2;
    out.rec = typeof V13.rec === 'function' && V13.rec() === isRecruit();
    out.rate = V13.timeRate() === timerRate();
    const t0 = SETTINGS.timed; SETTINGS.timed = 'off'; out.rateOff = V13.timeRate(); SETTINGS.timed = t0;
    return out;
  }, L.S1FRESH);
  T.log('live', JSON.stringify(r));
  C.check('CN05 chase with the hostage not lost: alive, does not testify', r.chaseAlive[0] === true && r.chaseAlive[1] === false, r.chaseAlive);
  C.check('CN05 chase with the hostage lost: dead', r.chaseLost[0] === false && r.chaseLost[1] === false, r.chaseLost);
  C.check('CN05 rescue: alive and testifies', r.rescue[0] === true && r.rescue[1] === true, r.rescue);
  C.check('CN05 a failed Asaba: dead', r.failed[0] === false, r.failed);
  C.check('API reading the helpers creates no Season 2 state', r.noS2, '');
  C.check('API V13.rec() and V13.timeRate() follow isRecruit() and timerRate() (0 when timed sequences are off)', r.rec && r.rate && r.rateOff === 0, r);
  // ---------- 2. the snapshot is taken at the first Season 2 load and survives a Season 1 replay ----------
  const ok = await sc.s2start(T, 'm9', "delete S.game.s2; S.game.moralChoices.asaba='chase'; S.game._asabaHostageLost=false; S.game.accusations=null;");
  T.log('m9', ok);
  r = await T.ev(() => ({ snap: JSON.stringify(S.game.s2.s1snap), alive: V13.tobiAlive(), s1: V13.s1(), R: { tobi: V13.rt.tobi, speak: V13.rt.speak, tobiMesh: !!V13.rt.tobiMesh, analyst: !!V13.rt.analyst } }));
  T.log('after load', JSON.stringify(r));
  C.check('CN13 snapshot saved in S.game.s2.s1snap at the first Season 2 load', /"tobiAlive":true/.test(r.snap || '') && /"tobiTestifies":false/.test(r.snap || '') && /"kcFair":true/.test(r.snap || ''), r.snap);
  C.check('CN06 Case 09: Igbinosa runs the bench; a chase-alive Tobi is in the room too', r.R.speak === 'igbinosa' && r.R.tobi === true && r.R.tobiMesh, r.R);
  r = await T.ev(() => { S.game.moralChoices.asaba = null; S.game._asabaHostageLost = true; S.game.moralChoices.market_runner = 'escaped'; return { alive: V13.tobiAlive(), s1: V13.s1(), kc: V13.s1snap().kcFair }; });
  C.check('CN13 a Season 1 replay (asaba:null) leaves Tobi alive in Season 2', r.alive === true && r.s1.tobi === true && r.kc === true, r);
  await T.ev(() => { S.game.moralChoices.asaba = 'chase'; S.game._asabaHostageLost = false; S.game.moralChoices.market_runner = 'caught'; });
  // V13.s1fate: the stored Season 2 reading wins over Season 1's own field, which is never rewritten
  r = await T.ev(() => { const g = S.game, m = g.moralChoices; m.finale = 'contested'; const a = V13.s1fate(); g.s2.s1fate = 'proven'; const b = V13.s1fate(), c = V13.s1().finale; delete g.s2.s1fate; return { a, b, c, fin: m.finale }; });
  C.check('CN13 V13.s1fate(): s2.s1fate, else moralChoices.finale', r.a === 'contested' && r.b === 'proven' && r.c === 'proven' && r.fin === 'contested', r);
  // the bench: Tobi's hello (text adds m9_tobi_bench), then Igbinosa's three ways
  await sc.talk(T);
  await sc.use(T, 'Report to Commander (Okundaye|Osagie)'); await sc.talk(T, [0]);
  await sc.use(T, 'Sign for exhibit 14'); await sc.talk(T, ['Sign it out']);
  await sc.use(T, 'Examine the drive'); await T.wait(600);
  const dlg = await L.got(T, 'dlg');
  const hasKey = await T.ev(() => !!DIALOGUE.m9_tobi_bench);
  T.log('dialogue keys', dlg.slice(-4).join(' '), 'm9_tobi_bench present:', hasKey);
  C.check('CN06 the bench conversation is Igbinosa\'s (after Tobi\'s hello when he is alive)', dlg.includes('m9_forensic_igbinosa') && !dlg.some(k => /^m9_forensic_tobi/.test(k)) && (!hasKey || dlg.indexOf('m9_tobi_bench') >= 0 && dlg.indexOf('m9_tobi_bench') < dlg.indexOf('m9_forensic_igbinosa')), dlg.slice(-4));
  await sc.talk(T, ['Write-blocker']);
  await sc.waitCards(T); await sc.solve(T, 'm9_hash'); await sc.talk(T);
  await sc.solve(T, 'm9_ledger'); await T.wait(500);
  const d2 = await L.got(T, 'dlg');
  C.check('CN06 the certificate is Igbinosa\'s; Tobi reads the ledger codes', d2.includes('m9_cert_igbinosa') && !d2.includes('m9_cert_tobi') && d2.includes('m9_ledger_run') && await T.ev(() => (DIALOGUE.m9_ledger_run || []).some(l => /TOBI/.test(l.speaker || ''))), d2.slice(-5));
  await sc.talk(T);
  // CN22: Season 1's Tobi look
  r = await T.ev(() => { const c = V13.CAST.tobi || {}, l = V13.look('tobi'); return { c, skin: l.skin, hair: l.hair, glasses: l.gear.includes('Gear_Glasses') }; });
  C.check('CN22 CAST.tobi is Season 1\'s Tobi (asaba.js:206)', r.c.name === 'TOBI ONUOHA' && r.skin === '#5a3818' && r.c.top === '#5a5a3a' && r.hair === '#0a0a08' && r.glasses, r);
  // the binding renames in the cast and the speaker table
  r = await T.ev(() => ({ osagie: V13.CAST.osagie.name, san: V13.CAST.san.name, efe: V13.CAST.mamaefe.name, art: SPEAKER_ART.filter(([k]) => /OKUNDAYE|OLANIRAN|MAMA TEGA|OSAGIE|COKER|MAMA EFE/.test(k)).map(x => x.join('=')).join(' '), card: V13.CARD('m9').summary }));
  C.check('CN10/CN15/CN21 cast, speaker portraits and the Case 09 card', r.osagie === 'COMMANDER OKUNDAYE' && r.san === 'FEMI OLANIRAN-COLE, SAN' && r.efe === 'MAMA TEGA' && r.art === 'OKUNDAYE=osagie MAMA TEGA=mamaefe OLANIRAN=san' && /Commander Okundaye gives you the night/.test(r.card), r);
  // R24: the stand-in portrait is flat: no gradients, only the palette
  r = await T.ev(() => {
    const P = CanvasRenderingContext2D.prototype, seen = { grad: 0, styles: new Set() };
    const g1 = P.createRadialGradient, g2 = P.createLinearGradient;
    P.createRadialGradient = function () { seen.grad++; return g1.apply(this, arguments); }; P.createLinearGradient = function () { seen.grad++; return g2.apply(this, arguments); };
    const fd = Object.getOwnPropertyDescriptor(P, 'fillStyle'), sd = Object.getOwnPropertyDescriptor(P, 'strokeStyle');
    Object.defineProperty(P, 'fillStyle', { configurable: true, get() { return fd.get.call(this); }, set(v) { seen.styles.add(String(v).toLowerCase()); fd.set.call(this, v); } });
    Object.defineProperty(P, 'strokeStyle', { configurable: true, get() { return sd.get.call(this); }, set(v) { seen.styles.add(String(v).toLowerCase()); sd.set.call(this, v); } });
    let url = null; try { url = V13._standIn('osagie'); V13._standIn('san'); V13._standIn('lucky'); } finally { P.createRadialGradient = g1; P.createLinearGradient = g2; Object.defineProperty(P, 'fillStyle', fd); Object.defineProperty(P, 'strokeStyle', sd); }
    const pal = ['#1c1c1a', '#262623', '#e9dcc0', '#a89f8a', '#8c8473'];
    return { grad: seen.grad, url: !!url, off: [...seen.styles].filter(s => !pal.includes(s)) };
  });
  C.check('R24 stand-in portraits: no gradient, palette ground/edges (clothing and headwear tones aside)', r.grad === 0 && r.url, r);
  C.done();
};
