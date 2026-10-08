// Casework 6: the charge sheet is permanent for the save. A mission-select replay of M3 keeps it
// (no second sheet), a save/load keeps it, and only a New Game clears it. A raid reached without
// the hub (mission select with no sheet on file) still asks for one before the plan.
const LIB = require('./casework_lib.cjs');
module.exports = async h => {
  const L = LIB.lib(h);
  // ---- a save that filed KC at h2 and finished Lekki ----
  await h.start('m4', { completed:['m0', 'm1', 'm2', 'm3', 'm3n'], state:S => {
    S.game.accusations = { lagos:{ suspect:'kc', method:'phish', money:'wallet', ok:{ suspect:false, method:true, money:true }, at:'h2', t:1234, warrant:'signed', settled:'m3' } };
    S.game.mem = { hubs:{ h2:1 }, street:{}, phone:{}, reply:{}, seen:{} };
  } });
  const before = await h.ev(() => JSON.stringify(S.game.accusations.lagos));
  // the player replays M3 from the mission select
  await h.ev(() => { saveGame(true); showOverlay(null); document.getElementById('btn-mission-select').click(); });
  await h.step(300);
  await h.ev(() => document.querySelector('#mission-grid .mission-card[data-mid="m3"]').click());
  await h.step(700);
  await h.ev(() => { if(document.querySelector('#screen-controls.show')) beginMission('m3'); });
  await h.step(1500);
  let st = await h.ev(() => ({ m:S.game.currentMission, acc:JSON.stringify(S.game.accusations.lagos) }));
  h.assert(st.m === 'm3', 'M3 replays from the mission select');
  h.assert(st.acc === before, 'the Lagos accusation survives the mission-select replay unchanged');
  // Uche's plan opens straight away — no second charge sheet
  await L.warrant({ strength:80, signed:true, refused:false, strikes:0, need:'' });
  await h.ev(() => ENGINE.interactables.find(i => /^Plan the raid with Sgt\. Uche/.test(i.label || '')).onInteract());
  await h.step(300);
  st = await h.ev(() => ({ plan:!!document.querySelector('#screen-plan.show'), sheet:!!document.querySelector('#screen-charge.show'), txt:(document.getElementById('screen-plan') || {}).textContent || '' }));
  h.assert(st.plan && !st.sheet, 'the plan opens directly on a replay — the sheet is not asked again');
  h.assert(/Charge sheet names KC/.test(st.txt) && /WARRANT\s*Signed/.test(st.txt), 'the plan shows the filed name and the warrant from warrantFor(\'lagos\')');
  await h.ev(() => showOverlay(null));
  // the replay's aftermath doesn't settle twice
  const af = await L.aftermath('m3');
  h.assert(af.d.pt === 0 && af.d.af === 0, 'a replayed raid does not charge the wrong arrest twice');
  h.assert(/Teen Data-Card Seller/.test(af.head.head), 'the replay\'s headline still remembers the wrong arrest');
  // save → load keeps it; New Game clears it
  st = await h.ev(() => { saveGame(true); S.game.accusations = {}; loadGame(); return JSON.stringify(S.game.accusations.lagos); });
  h.assert(st === before.replace('"settled":"m3"', '"settled":"m3"'), 'save and load keep the accusation');
  st = await h.ev(() => { startNewInvestigation('senior'); return JSON.stringify(S.game.accusations); });
  h.assert(st === '{}', 'only a New Game clears it');

  // ---- a raid reached without the hub and without a sheet ----
  await h.step(2000);
  await h.start('m3', { completed:[], state:S => { S.game.mem = { hubs:{ h2:1 }, street:{}, phone:{}, reply:{}, seen:{} }; } });
  h.assert(await h.ev(() => S.game.currentMission === 'm3'), 'M3 started directly (mission select, no hub)');
  await L.warrant({ strength:80, signed:true, refused:false, strikes:0, need:'' });
  await h.ev(() => ENGINE.interactables.find(i => /^Plan the raid with Sgt\. Uche/.test(i.label || '')).onInteract());
  await h.step(200);
  st = await h.ev(() => ({ key:DLG.scriptKey, line:(DIALOGUE.cw_gate_intro || [])[0], plan:!!document.querySelector('#screen-plan.show') }));
  h.assert(st.key === 'cw_gate_intro' && /charge sheet/.test(st.line.text) && st.line.speaker === 'SGT. UCHE' && !st.plan, 'Uche asks for the charge sheet before the plan');
  await L.finishDialogue();
  h.assert(await L.shown('screen-charge'), 'the charge sheet opens');
  // NOT YET: nothing filed, the plan stays shut
  await h.ev(() => document.querySelector('#screen-charge [data-act="cancel"]').click());
  await h.step(200);
  st = await h.ev(() => ({ acc:S.game.accusations.lagos || null, plan:!!document.querySelector('#screen-plan.show'), hud:document.getElementById('hud').style.display }));
  h.assert(!st.acc && !st.plan && st.hud !== 'none', 'NOT YET files nothing and returns to the mission');
  await h.ev(() => ENGINE.interactables.find(i => /^Plan the raid with Sgt\. Uche/.test(i.label || '')).onInteract());
  await h.step(200); await L.finishDialogue();
  await L.fileSheet({ suspect:'pos', method:'phish', money:'wallet' });
  st = await h.ev(() => ({ acc:S.game.accusations.lagos, plan:!!document.querySelector('#screen-plan.show') }));
  h.assert(st.acc && st.acc.suspect === 'pos' && st.acc.warrant === 'signed' && st.plan, 'filed in the mission, warrant signed, then the plan opens');
  h.log('PASS casework_replay');
};
