// v13 · CASE DESK › MONEY opens only after the Lagos charge sheet is on the file or Case 03 is done
// (team D; design §4, A8: intelMoneyOpen(), guarded fallback V12.accused('lagos') || m3 complete),
// so the desk can't hand over the Lagos money answer before the charge sheet.
//   node tools/harness/run.cjs tools/harness/scenarios/v13_d_money_gate.cjs --html <build>/naceca.html
module.exports = async h => {
  const D = require('./v13_d_lib.cjs').lib(h);
  await D.inject();
  await h.start('m2', { completed:['m0', 'm1'] });
  // a money trail is already open from KC's phone, but nothing is filed and Lekki hasn't happened
  await D.seed({ accusations:{ lagos:null, route:null }, money:{ open:true, req:4, unlocked:{ n_kc:true, n_odogwu:true }, traced:{} } });
  await h.ev(() => { delete S.game.accusations.lagos; delete S.game.accusations.route; S.game.completedMissions = ['m0', 'm1', 'm2']; showOverlay(null); showHUD(true); ENGINE.movementEnabled = true; });
  const read = () => h.ev(() => ({ t:document.getElementById('desk-body').textContent, trace:document.querySelectorAll('#desk-body [data-act="trace"]').length, rows:document.querySelectorAll('#desk-body .dk-mn').length,
    gate:typeof intelMoneyOpen === 'function' ? intelMoneyOpen() : null }));
  await h.ev(() => openDesk('money'));
  let r = await read();
  h.log('before the charge sheet', JSON.stringify({ rows:r.rows, trace:r.trace, gate:r.gate, t:r.t.slice(0, 120) }));
  h.assert(r.rows === 0 && r.trace === 0, 'MONEY is closed before the Lagos charge sheet: no nodes, nothing to trace');
  h.assert(/charge sheet/i.test(r.t) && !/Odogwu|₦/.test(r.t), 'the closed tab says why, and shows no money');
  // a TRACE action sent anyway (an old button, a test) changes nothing on screen
  await h.ev(() => deskDo('goto', { tab:'money' }));
  h.assert((await read()).rows === 0, 'still closed after a redraw');
  // Recruit gets the same gate (it is not a hint, it is the order of the case)
  await D.recruit(true);
  h.assert((await read()).rows === 0, 'Recruit: MONEY is closed before the charge sheet too');
  await D.recruit(false);

  // the Lagos charge sheet goes on the file → the trail opens
  await h.ev(() => { S.game.accusations.lagos = { suspect:'obi', method:'m', money:'x', warrant:'pending', settled:false }; renderDesk(); });
  r = await read();
  h.log('after the charge sheet', JSON.stringify({ rows:r.rows, trace:r.trace, gate:r.gate }));
  h.assert(r.rows === 2 && r.trace === 2, 'MONEY opens once V12.accused(\'lagos\') exists');
  const req0 = await h.ev(() => I().money.req);
  await h.ev(() => document.querySelector('#desk-body [data-act="trace"][data-id="n_kc"]').click());
  r = await read();
  h.assert(await h.ev(() => I().money.req) === req0 - 1 && await h.ev(() => !!I().money.traced.n_kc), 'TRACE spends one NFIU request and traces the node');
  h.assert(/SIM LOGISTICS/.test(r.t) && /150,000/.test(r.t), 'a traced node shows its description and amount (mono)');
  h.assert(await h.ev(() => /JetBrains Mono/.test(getComputedStyle(document.querySelector('#desk-body .dk-mn-amt')).fontFamily)), 'amounts in JetBrains Mono');

  // … or Case 03 is complete without a sheet (an old save)
  await h.ev(() => { delete S.game.accusations.lagos; S.game.completedMissions = ['m0', 'm1', 'm2']; renderDesk(); });
  h.assert((await read()).rows === 0, 'closed again with no sheet and no Lekki');
  await h.ev(() => { S.game.completedMissions = ['m0', 'm1', 'm2', 'm3']; renderDesk(); });
  r = await read();
  h.assert(r.rows >= 2, 'MONEY opens once Case 03 is complete');
  await h.shot('money_open');
  await h.ev(() => closeDesk());
  h.assert(h.errors.length === 0, 'no page errors: ' + h.errors.join(' | '));
};
