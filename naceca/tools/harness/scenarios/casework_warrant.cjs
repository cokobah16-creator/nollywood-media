// Casework 5: a refused warrant at filing. The Commander refuses and sends the player back to the
// table; "Go in without a warrant" is always there, with a real cost (Agency Favour −5, the raid's
// evidence contested, the grade capped at B). Also: an unsigned (not refused) warrant, and Recruit notes.
const LIB = require('./casework_lib.cjs');
module.exports = async h => {
  const L = LIB.lib(h);
  const tag = await h.ev(() => innerWidth < 600 ? 'phone' : 'desk');
  await L.toHub('m3', ['m0', 'm1', 'm2'], S => { S.game.difficulty = 'recruit'; });
  await L.warrant({ strength:22, signed:false, refused:true, strikes:3, need:'Find new evidence' });
  await L.hubPrep();
  await L.commander();
  await L.finishDialogue();
  h.assert(await L.shown('screen-charge'), 'charge sheet opens');
  const notes = await h.ev(() => [...document.querySelectorAll('#screen-charge .cw-margin')].map(n => n.textContent));
  h.assert(notes.length === 3 && notes.every(t => /UCHE'S NOTE/.test(t)), 'Recruit: Uche\'s margin notes on each section');
  await h.shot('casework_charge_recruit_' + tag);
  const af0 = (await L.rep()).agencyFavour;
  await L.fileSheet({ suspect:'obi', method:'phish', money:'wallet' });
  // the Commander refuses, then the warrant paper
  h.assert(await h.ev(() => DLG.scriptKey === 'cw_gate_warrant' && /sent it back/.test(DIALOGUE.cw_gate_warrant[0].text) && /Find new evidence/.test(DIALOGUE.cw_gate_warrant[0].text)), 'the Commander refuses the warrant, with the board\'s reason');
  await L.finishDialogue();
  h.assert(await L.shown('screen-warrant'), 'the warrant paper opens');
  const wp = await h.ev(() => { const ov = document.getElementById('screen-warrant');
    return { text:ov.textContent, sizes:[...ov.querySelectorAll('button')].map(b => { const r = b.getBoundingClientRect(); return Math.min(r.width, r.height); }) }; });
  h.assert(/REFUSED/.test(wp.text) && /22 \/ 100/.test(wp.text) && /3 \/ 3/.test(wp.text), 'the paper shows REFUSED, strength and strikes');
  h.assert(/Agency Standing −5/.test(wp.text) && /contested/.test(wp.text) && /capped at B/.test(wp.text), 'the exigent costs are spelled out');
  h.assert(Math.min(...wp.sizes) >= 44, 'warrant buttons are at least 44px');
  await h.shot('casework_warrant_' + tag);
  // back to the table: nothing is spent, nothing moves on
  await h.ev(() => document.querySelector('#screen-warrant [data-act="back"]').click());
  await h.step(300);
  let st = await h.ev(() => ({ ops:!!document.querySelector('#screen-ops.show'), w:S.game.accusations.lagos.warrant, hub:!!V12.mem().hubs.h2, af:S.player.reputation.agencyFavour, cmd:V12.objDone('hb_cmd') }));
  h.assert(st.ops && st.w === 'pending' && !st.hub && !st.cmd && st.af === af0, 'BACK TO THE TABLE opens the table; the warrant is pending, no cost, the hub waits');
  await h.ev(() => V12.closeOps());
  // calling again skips the sheet (it's filed) and goes straight to the warrant
  await L.commander();
  h.assert(await h.ev(() => DLG.scriptKey === 'cw_gate_warrant'), 'a second call goes straight to the warrant');
  await L.finishDialogue();
  h.assert(await h.ev(() => !document.querySelector('#screen-charge.show')), 'the filed sheet is not reopened');
  // go in without one: two taps
  await h.ev(() => document.querySelector('#screen-warrant [data-act="exigent"]').click());
  st = await h.ev(() => ({ w:S.game.accusations.lagos.warrant, af:S.player.reputation.agencyFavour, armed:document.querySelector('#screen-warrant [data-act="exigent"]').textContent }));
  h.assert(st.w === 'pending' && st.af === af0 && /TAP AGAIN/.test(st.armed), 'the first tap only arms');
  await h.ev(() => document.querySelector('#screen-warrant [data-act="exigent"]').click());
  await h.step(200);
  st = await h.ev(() => ({ w:S.game.accusations.lagos.warrant, af:S.player.reputation.agencyFavour, q:Object.assign({}, S.game.evQ), key:DLG.scriptKey, first:(DIALOGUE.hub_cmd_run || [])[0] }));
  h.log('exigent', st.w, st.af - af0, st.q);
  h.assert(st.w === 'exigent' && st.af - af0 === -5, 'exigent: Agency Favour −5 exactly');
  h.assert(st.q.laptop === 'weak' && st.q.cash === 'weak' && st.q.safe_drives === 'weak', 'exigent: the raid\'s laptop, cash and drives are logged contested');
  h.assert(st.key === 'hub_cmd_run' && /Exigent circumstances/.test(st.first.text), 'the Commander briefs you after noting it');
  await L.finishDialogue(); await h.step(400);
  h.assert(await h.ev(() => !!V12.mem().hubs.h2), 'progress continues');
  // the plan shows it, and doesn't charge again
  const plan = await h.ev(() => {
    S.game.currentMission = 'm3'; S.game.moralChoices = S.game.moralChoices || {};
    const before = S.player.reputation.agencyFavour;
    const I = V12.m3Intel();
    V12.planM3(() => {}); const txt = document.getElementById('screen-plan').textContent;
    document.getElementById('plan-go').click();
    return { warrant:I.warrant, charge:I.charge, txt, d:S.player.reputation.agencyFavour - before, plan:S.game._plan };
  });
  h.log('plan', plan.warrant, plan.charge, plan.d);
  h.assert(!plan.warrant.known && /already on the record/.test(plan.warrant.text), 'the M3 plan\'s warrant row reads the exigent record');
  h.assert(/Charge sheet names "Chief" E\. Obi/.test(plan.charge.text), 'the plan shows who the sheet names');
  // knock-and-announce default gives −2 Agency; no second −5 for the warrant
  h.assert(plan.d === -2, 'no second warrant charge at the plan (only the entry choice moved Agency: ' + plan.d + ')');
  await L.finishDialogue();
  // the grade is capped at B
  const g = await h.ev(() => {
    const el = document.getElementById('ev-max'); if(el) el.textContent = '0';
    S.game.objectives = [{ id:'a', text:'a', done:true }];
    S.game._opStart = { rep:Object.assign({}, S.player.reputation, { publicTrust:S.player.reputation.publicTrust - 20 }) };
    S.game.civiliansRescued = 2;
    const capped = computeGrade({ ev:0, civ:2, force:0 });
    S.game.accusations.lagos.warrant = 'signed';
    const signed = computeGrade({ ev:0, civ:2, force:0 });
    S.game.accusations.lagos.warrant = 'exigent';
    return { capped, signed };
  });
  h.log('grade', g);
  h.assert(g.capped.pts <= 69 && g.capped.g === 'B' && g.signed.pts > 69, 'exigent caps the grade at B');

  // ---- not refused, just not signed: same choice, different words ----
  await L.toHub('m3', ['m0', 'm1', 'm2']);
  await L.warrant({ strength:41, signed:false, refused:false, strikes:1, need:'Ink more links' });
  await L.hubPrep(); await L.commander(); await L.finishDialogue();
  await L.fileSheet({ suspect:'obi', method:'phish', money:'wallet' });
  h.assert(await h.ev(() => /won't sign on what's on your table yet\. Ink more links\./.test(DIALOGUE.cw_gate_warrant[0].text)), 'unsigned: the Commander says what the magistrate needs');
  await L.finishDialogue();
  h.assert(await h.ev(() => /NOT SIGNED/.test(document.getElementById('screen-warrant').textContent)), 'unsigned: the paper reads NOT SIGNED');
  // the board catches up: now it signs
  await h.ev(() => document.querySelector('#screen-warrant [data-act="back"]').click());
  await h.step(200);
  await h.ev(() => V12.closeOps());
  await L.warrant({ strength:75, signed:true, refused:false, strikes:1, need:'' });
  await L.commander();
  h.assert(await h.ev(() => DLG.scriptKey === 'hub_cmd_run' && /magistrate has signed/.test(DIALOGUE.hub_cmd_run[0].text) && S.game.accusations.lagos.warrant === 'signed'), 'once the board signs, the call goes through');
  await L.finishDialogue();
  // without the board's API the old warrant still decides (no soft-lock, no crash)
  const fb = await h.ev(() => { delete V12.warrantFor; S.game.intelScore = 60; return CW.warrant('lagos'); });
  h.assert(fb.signed === true, 'falls back to V12.warrant() when warrantFor is missing');
  h.log('PASS casework_warrant', tag);
};
