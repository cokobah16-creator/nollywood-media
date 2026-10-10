// v13 A · warrants: the board is the magistrate (design §1, A3, A5).
// V12.warrantState(id) for every id across states (incl. legacy saves); V12.fileV13Warrant decides once and
// only on the board's reading; V12.warrant(), intel tier 0 and the t_money text are the beta's again; the
// raid plan has no v13 APPLY button. Senior and Recruit read the same records.
const A_LIB = require('./v13_a_lib.cjs');
module.exports = async h => {
  const A = A_LIB.lib(h);
  const ALL = ['m0', 'm1', 'm2'];
  await h.start('m2', { completed:ALL.slice(0, 2) });

  // ---- the beta's API and text are back ----
  const api = await h.ev(() => ({
    w:String(V12.warrant), tier0:Object.assign({}, V12.INTEL_TIERS[0]),
    tm:((V12.OPS_THEORIES || []).find(t => t.id === 't_money') || {}).effect,
    gone:['warrantScore', 'warrantOpen', 'basisWeight', 'applyWarrant', 'warrantClosed', 'planWarrantButton'].filter(n => typeof window[n] !== 'undefined'),
    have:['warrantGranted', 'intelAdmissibility', 'intelVerdict', 'intelVerdictOf', 'intelVerdictScore', 'intelMoneyOpen', 'intelSenior', 'v13OpenOps', 'v13Modal', 'v13ModalEnd', 'intelIntegrity', 'intelItemFlaws', 'intelStyle']
      .filter(n => typeof window[n] !== 'function'),
    ws:typeof V12.warrantState, fw:typeof V12.fileV13Warrant, ver:V12.version,
  }));
  h.log('api', JSON.stringify(api));
  h.assert(/warrantFor\('lagos'\)\.signed/.test(api.w) && !/warrantGranted/.test(api.w), 'V12.warrant() is the beta\'s (warrantFor(\'lagos\').signed)');
  h.assert(api.tier0.name === 'ON FILE' && /A warrant is still won on the operations table/.test(api.tier0.text), 'intel tier 0 stays ON FILE');
  h.assert(api.tm === 'The money trail carries your warrant application.', 't_money effect text stays the beta\'s');
  h.assert(!api.gone.length, 'the drop\'s warrant scoring is gone: ' + api.gone.join(','));
  h.assert(!api.have.length && api.ws === 'function' && api.fw === 'function', 'the contract functions exist: ' + api.have.join(','));
  h.assert(/v13/.test(api.ver) && /beta/.test(api.ver), 'V12.version names the build: ' + api.ver);
  const fb = await h.ev(() => {
    const keep = V12.warrantFor;
    V12.warrantFor = () => ({ strength:70, signed:true, refused:false, strikes:0, need:'Ready to sign' }); const a = V12.warrant();
    V12.warrantFor = () => ({ strength:20, signed:false, refused:false, strikes:1, need:'Needs stronger evidence' }); const b = V12.warrant();
    V12.warrantFor = keep; return { a, b };
  });
  h.assert(fb.a === true && fb.b === false, 'V12.warrant() follows the board');

  // ---- every id on a fresh state ----
  const st0 = await h.ev(() => ['w_lekki', 'w_asaba', 'w_cdr', 'w_eko', 'nope'].map(id => V12.warrantState(id)));
  h.log('fresh', JSON.stringify(st0.map(s => [s.id, s.case, s.status])));
  h.assert(st0[0].status === 'none' && st0[1].status === 'none', 'no sheet filed: w_lekki / w_asaba are none');
  h.assert(st0[2].status === 'pending' && st0[3].status === 'pending', 'w_cdr / w_eko are pending until their briefing');
  h.assert(st0[0].case === 'lagos' && st0[1].case === 'route' && st0[2].case === 'route' && st0[3].case === 'voice', 'each warrant reads its own case');
  h.assert(st0.every(s => ['id', 'case', 'label', 'status', 'route', 'strength', 'strikes', 'need', 'refused'].every(k => k in s)), 'warrantState has the contract shape');
  h.assert(st0.slice(0, 4).every(s => s.label && !/^w_/.test(s.label)), 'every warrant has a display label');
  // strength / strikes / need / refused come live from the board
  const live = await h.ev(() => {
    const keep = V12.warrantFor;
    V12.warrantFor = c => ({ strength:c === 'route' ? 44 : 61, signed:c !== 'route', refused:c === 'route', strikes:c === 'route' ? 3 : 1, need:c === 'route' ? 'Find new evidence' : 'Ready to sign' });
    const r = ['w_lekki', 'w_asaba', 'w_cdr', 'w_eko'].map(id => V12.warrantState(id));
    V12.warrantFor = keep; return r;
  });
  h.assert(live[0].strength === 61 && live[0].strikes === 1 && live[0].need === 'Ready to sign' && !live[0].refused, 'lagos: strength/strikes/need live from warrantFor');
  h.assert(live[1].strength === 44 && live[1].strikes === 3 && live[1].refused && live[2].strength === 44 && live[2].refused, 'route and the Ugbowo order share the route board');
  h.assert(live[3].strength === 61, 'w_eko reads the voice board');

  // ---- the beta charge sheet decides Lekki and Asaba ----
  const lagos = await h.ev(() => {
    const out = [];
    CW.file('lagos', { suspect:'obi', method:'phish', money:'wallet' }); out.push(V12.warrantState('w_lekki').status);
    S.game.accusations.lagos.warrant = 'signed'; S.game.accusations.lagos.warrantAt = 'h2'; out.push(V12.warrantState('w_lekki').status, V12.warrantState('w_lekki').at, warrantGranted('w_lekki'));
    S.game.accusations.lagos.warrant = 'pending'; CW.goExigent('lagos'); out.push(V12.warrantState('w_lekki').status, warrantGranted('w_lekki'));
    delete S.game.accusations.lagos.warrant; out.push(V12.warrantState('w_lekki').status);
    CW.autofile('route', null, 'exigent'); out.push(V12.warrantState('w_asaba').status);
    S.game.accusations.route.warrant = 'signed'; out.push(V12.warrantState('w_asaba').status);
    return out;
  });
  h.log('lagos/route', JSON.stringify(lagos));
  h.assert(lagos[0] === 'pending', 'a filed sheet with no decision is pending');
  h.assert(lagos[1] === 'signed' && lagos[2] === 'h2' && lagos[3] === true, 'signed at the gate → signed (warrantGranted shim agrees)');
  h.assert(lagos[4] === 'exigent' && lagos[5] === false, 'exigent entry → exigent');
  h.assert(lagos[6] === 'pending', 'an old sheet without a warrant field reads pending');
  h.assert(lagos[7] === 'exigent' && lagos[8] === 'signed', 'Asaba follows the route sheet');

  // ---- fileV13Warrant: once, on the board's reading ----
  const cdr = await h.ev(() => {
    const keep = V12.warrantFor, out = {}, logs = [], keepLog = V12.log;
    V12.log = (t, d) => { logs.push([t, d]); return keepLog.apply(V12, [t, d]); };
    V12.warrantFor = () => ({ strength:30, signed:false, refused:false, strikes:0, need:'Needs stronger evidence' });
    out.refusedSigned = V12.fileV13Warrant('w_cdr', { status:'signed' });
    out.badStatus = V12.fileV13Warrant('w_cdr', { status:'exigent' });
    out.notOurs = V12.fileV13Warrant('w_lekki', { status:'signed' });
    out.still = V12.warrantState('w_cdr').status;
    out.none = V12.fileV13Warrant('w_cdr', { status:'none' }).status;
    V12.warrantFor = () => ({ strength:90, signed:true, refused:false, strikes:0, need:'Ready to sign' });
    out.again = V12.fileV13Warrant('w_cdr', { status:'signed' }).status;     // a decision is permanent
    out.rec = Object.assign({}, I().warrants.w_cdr);
    out.logged = logs.filter(e => e[0] === 'v13_warrant' && e[1].id === 'w_cdr').length;
    V12.log = keepLog; V12.warrantFor = keep; return out;
  });
  h.log('w_cdr', JSON.stringify(cdr));
  h.assert(cdr.refusedSigned === null && cdr.badStatus === null && cdr.notOurs === null && cdr.still === 'pending', 'w_cdr: no signature without the board; bad filings change nothing');
  h.assert(cdr.none === 'none' && cdr.again === 'none' && cdr.rec.status === 'none', 'w_cdr: went without; a second filing is ignored');
  h.assert(cdr.logged === 1, 'the decision is logged once (v13_warrant)');
  const eko = await h.ev(() => {
    const keep = V12.warrantFor, out = {};
    V12.warrantFor = () => ({ strength:80, signed:true, refused:false, strikes:0, need:'Ready to sign' });
    const a0 = I().alert, af0 = S.player.reputation.agencyFavour;
    out.noRoute = V12.fileV13Warrant('w_eko', { status:'signed' });
    out.signed = V12.fileV13Warrant('w_eko', { status:'signed', route:'commander' });
    out.da = I().alert - a0; out.daf = S.player.reputation.agencyFavour - af0;
    const again = V12.fileV13Warrant('w_eko', { status:'signed', route:'zonal' });
    out.again = again.route; out.da2 = I().alert - a0; out.daf2 = S.player.reputation.agencyFavour - af0;
    // a fresh case: Zonal
    I().warrants = {};
    const a1 = I().alert, af1 = S.player.reputation.agencyFavour;
    out.zonal = V12.fileV13Warrant('w_eko', { status:'signed', route:'zonal' }).route;
    out.za = I().alert - a1; out.zaf = S.player.reputation.agencyFavour - af1;
    I().warrants = {};
    out.ex = V12.fileV13Warrant('w_eko', { status:'exigent' }).status;
    out.exAlert = I().alert - a1;
    V12.warrantFor = keep; return out;
  });
  h.log('w_eko', JSON.stringify(eko));
  h.assert(eko.noRoute === null, 'a signed w_eko needs a route');
  h.assert(eko.signed.status === 'signed' && eko.signed.route === 'commander' && eko.da === 1 && eko.daf === 0, 'through the Commander\'s office: alert +1, nothing else');
  h.assert(eko.again === 'commander' && eko.da2 === 1 && eko.daf2 === 0, 'idempotent: no second routing, no second cost');
  h.assert(eko.zonal === 'zonal' && eko.za === 0 && eko.zaf === -6, 'straight to Zonal: Agency Standing −6, no alert');
  h.assert(eko.ex === 'exigent' && eko.exAlert === 0, 'exigent: no cost beyond the court flaw');

  // ---- Senior vs Recruit: the same records ----
  const modes = await h.ev(() => {
    const read = () => JSON.stringify(['w_lekki', 'w_asaba', 'w_cdr', 'w_eko'].map(id => { const s = V12.warrantState(id); return [s.status, s.route, s.need === V12.warrantFor(s.case).need]; }));
    S.game.difficulty = 'senior'; syncDifficultyClass(); const a = read(), senior = intelSenior();
    S.game.difficulty = 'recruit'; syncDifficultyClass(); const b = read(), recruit = !intelSenior();
    S.game.difficulty = 'senior'; syncDifficultyClass();
    return { a, b, senior, recruit };
  });
  h.assert(modes.senior && modes.recruit && modes.a === modes.b, 'warrant records read the same in Senior and Recruit (need text comes from the board)');

  // ---- legacy saves (A5/A9) ----
  const leg = async completed => {
    await h.start('m2', { completed:ALL.slice(0, 2), state:new Function('S', `S.game.completedMissions = ${JSON.stringify(completed)}; delete S.game.intel;`) });
    return h.ev(() => ['w_cdr', 'w_eko'].map(id => { const s = V12.warrantState(id); return [s.status, s.route, s.legacy]; }));
  };
  const l7 = await leg(['m0', 'm1', 'm2', 'm3', 'm3n', 'm4', 'm5', 'm6', 'm7']);
  const l8 = await leg(['m0', 'm1', 'm2', 'm3', 'm3n', 'm4', 'm5', 'm6', 'm7', 't7']);
  const l6 = await leg(['m0', 'm1', 'm2', 'm3', 'm3n', 'm4', 'm5', 'm6']);
  h.log('legacy', JSON.stringify({ l6, l7, l8 }));
  h.assert(l7[0][0] === 'signed' && l7[0][1] === 'legacy' && l7[0][2] === true && l7[1][0] === 'pending', 'past m7: w_cdr signed (legacy), w_eko still pending');
  h.assert(l8[0][0] === 'signed' && l8[1][0] === 'signed' && l8[1][1] === 'legacy', 'past t7: both signed (legacy)');
  h.assert(l6[0][0] === 'pending' && l6[1][0] === 'pending', 'before m7 nothing is assumed');

  // ---- the M3 raid plan: no second warrant button ----
  await h.start('m3', { completed:ALL, wait:600, state:S => { S.game.accusations = {}; } });
  await h.step(2600);
  const plan = await h.ev(() => {
    if(typeof SIDE !== 'undefined') SIDE.mid = null;
    showOverlay(null);
    S.game.currentMission = 'm3'; S.game.moralChoices = S.game.moralChoices || {};
    CW.autofile('lagos', null, 'signed');
    V12.planM3(() => {});
    const ov = document.getElementById('screen-plan');
    return { btn:!!document.getElementById('plan-warrant'), txt:ov ? ov.textContent : '', shown:!!(ov && ov.classList.contains('show')) };
  });
  h.assert(plan.shown && !plan.btn, 'the raid plan has no v13 APPLY button');
  h.assert(/Signed/.test(plan.txt) && !/APPLY FOR THE WARRANT/.test(plan.txt), 'the plan reads the signed charge-sheet warrant only');
  await h.shot('v13_a_plan_' + (await A.vp()));
  await A.audit('#screen-plan', 'raid plan');
  await h.ev(() => showOverlay(null));

  // ---- labels and text the model hands to the desk / court ----
  const labels = await h.ev(() => ['w_lekki', 'w_asaba', 'w_cdr', 'w_eko'].flatMap(id => { const s = V12.warrantState(id); return [s.label, s.short, s.court]; }));
  await A.textRules(labels, 'warrant labels');
  h.assert(h.errors.length === 0, 'no page errors');
};
