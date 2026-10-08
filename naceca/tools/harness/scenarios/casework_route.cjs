// Casework 7: the route. At hub h5 the charge sheet comes BEFORE the Commander's briefing line that
// names Ifeanyi; a wrong name (Tobi) costs Public Trust −6, changes the Asaba headline, the next hub's
// phone and the epilogue. M6 reached without the hub asks for the sheet before Uche's briefing.
const LIB = require('./casework_lib.cjs');
module.exports = async h => {
  const L = LIB.lib(h);
  const tag = await h.ev(() => innerWidth < 600 ? 'phone' : 'desk');
  await L.toHub('m6', ['m0', 'm1', 'm2', 'm3', 'm3n', 'm4', 'h4', 'm5'], S => { S.game.mem = { hubs:{ h2:1, h4:1 }, street:{}, phone:{}, reply:{}, seen:{} }; });
  h.assert(await h.ev(() => S.game.currentMission === 'h5'), 'Benin field office (h5) before Asaba');
  await L.warrant({ strength:70, signed:true, refused:false, strikes:0, need:'' });
  await L.hubPrep();
  // record every line that reaches the screen, and when the sheet is filed
  await h.ev(() => {
    window.__seen = [];
    const r = window.renderDialogueLine;
    window.renderDialogueLine = function(){ const l = DLG.script && DLG.script[DLG.idx]; if(l) window.__seen.push({ k:DLG.scriptKey, t:l.text, filed:!!(S.game.accusations && S.game.accusations.route) }); return r.apply(this, arguments); };
  });
  await L.commander();
  const intro = await h.ev(() => ({ k:DLG.scriptKey, call:!!document.querySelector('#v12-call.show'), lines:DIALOGUE.cw_gate_intro.map(l => l.speaker + ': ' + l.text) }));
  h.log('h5 intro', intro);
  h.assert(intro.k === 'cw_gate_intro' && intro.call && intro.lines.every(l => /VIDEO CALL/.test(l)), 'the Commander (video call) asks for the sheet first');
  h.assert(intro.lines.every(l => !/Ifeanyi/.test(l)), 'her request does not name Ifeanyi');
  await L.finishDialogue();
  h.assert(await L.shown('screen-charge'), 'the route charge sheet opens');
  const sheet = await h.ev(() => document.getElementById('screen-charge').textContent);
  h.assert(/RAID: ASABA RIVERSIDE/.test(sheet) && !/fixer/i.test(sheet), 'the sheet lists names without the giveaway "fixer"');
  await h.shot('casework_charge_route_' + tag);
  await L.fileSheet({ suspect:'tobi', method:'route', money:'asaba' });
  await L.finishDialogue();
  const seen = await h.ev(() => window.__seen);
  const ife = seen.findIndex(x => /Ifeanyi/.test(x.t));
  h.log('first Ifeanyi line', seen[ife]);
  h.assert(ife >= 0 && seen[ife].k === 'hub_cmd_run' && seen[ife].filed, 'the line naming Ifeanyi comes after the sheet is filed');
  h.assert(seen.slice(0, ife).every(x => !/Ifeanyi/.test(x.t)), 'no earlier line names him');
  await h.step(400);
  h.assert(await h.ev(() => !!V12.mem().hubs.h5), 'the hub ends after the briefing');
  // Asaba: Tobi pulled out of the fire, then held on the sheet
  await h.ev(() => { S.game.moralChoices.asaba = 'rescue'; });
  const af = await L.aftermath('m6');
  h.log('m6 aftermath', af.d, af.head.head);
  h.assert(af.d.pt === -6 && af.d.af === 0, 'wrong route suspect: Public Trust −6 exactly');
  h.assert(/Rescued Accountant Held on NACECA Charge Sheet/.test(af.head.head), 'the Asaba headline changes');
  h.assert(/St\. Theresa/.test(af.review), 'the aftermath says where Tobi was held');
  const later = await h.ev(() => {
    V12.deliverPhone('h6');
    const t = V12.mem().phone.tobi; const epi = epilogueSlides().find(s => s.name === 'TOBI ONUOHA');
    return { tobi:t && t.msgs.map(m => m.text).join(' '), epi:epi && epi.text };
  });
  h.assert(/cuffed me to the bed/.test(later.tobi) && /read their payroll/.test(later.tobi), 'Tobi\'s text at the next hub: held, and still an ally');
  h.assert(/hospital bed/.test(later.epi), 'Tobi\'s epilogue line changes');
  // the other wrong names
  const other = await h.ev(() => {
    const out = {};
    for(const who of ['agent', 'musa']){
      S.game.accusations = {}; CW.file('route', { suspect:who, method:'route', money:'asaba' }, { warrant:'signed' });
      S.game.currentMission = 'm6'; CW.settle('route'); out[who] = generateHeadline().head;
    }
    // wrong method / money mark the route evidence contested
    S.game.accusations = {}; S.game.evQ = {};
    CW.file('route', { suspect:'ifeanyi', method:'feed', money:'kano' }, { warrant:'signed' }); CW.settle('route');
    out.q = Object.assign({}, S.game.evQ);
    return out;
  });
  h.assert(/SIM Agent Held/.test(other.agent) && /Lorry Driver Re-Arrested/.test(other.musa), 'the SIM agent and Musa get their own headlines');
  h.assert(other.q.shrine_pots === 'weak' && other.q.asaba_sims === 'weak' && other.q.shrine_cache === 'weak' && other.q.e_shrine_ledger === 'weak', 'wrong route method and money: their evidence is contested');

  // ---- M6 reached without the hub: the sheet comes before Uche names the fixer ----
  await h.step(2500);
  await h.start('m6', { completed:[], state:S => { S.game.mem = { hubs:{ h5:1 }, street:{}, phone:{}, reply:{}, seen:{} }; } });
  await L.warrant({ strength:70, signed:true, refused:false, strikes:0, need:'' });
  await h.ev(() => { const it = ENGINE.interactables.find(i => /Uche/.test(i.label || '')); it.onInteract(); });
  await h.step(200);
  let st = await h.ev(() => ({ k:DLG.scriptKey, briefed:!!S.game._asabaBriefed }));
  h.assert(st.k === 'cw_gate_intro' && !st.briefed, 'Uche asks for the sheet instead of briefing');
  await L.finishDialogue();
  h.assert(await L.shown('screen-charge'), 'the sheet opens in the mission');
  await L.fileSheet({ suspect:'ifeanyi', method:'route', money:'asaba' });
  st = await h.ev(() => ({ k:DLG.scriptKey, w:S.game.accusations.route.warrant }));
  h.assert(st.k === 'asaba_brief' && st.w === 'signed', 'then Uche\'s Asaba briefing');
  await L.finishDialogue();
  h.assert(await h.ev(() => S.game._asabaBriefed === true), 'the briefing completes as before');
  h.log('PASS casework_route', tag);
};
