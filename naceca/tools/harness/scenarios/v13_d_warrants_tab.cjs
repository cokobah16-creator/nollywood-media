// v13 · CASE DESK › WARRANTS (team D; design §4, A5): read-only, one stamped sheet per warrant or order
// that has been DECIDED (w_lekki / w_asaba from the charge sheets, w_cdr / w_eko from the briefings),
// read through V12.warrantState when the model has it. No basis checklist, no APPLY buttons, nothing
// listed before it is decided, and no Ekosodin / Osas text before the Ekosodin warrant is decided.
//   node tools/harness/run.cjs tools/harness/scenarios/v13_d_warrants_tab.cjs --html <build>/naceca.html
const fs = require('fs'), path = require('path');
module.exports = async h => {
  const D = require('./v13_d_lib.cjs').lib(h);
  // the desk no longer computes or applies warrants (A3)
  const src = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'src', 'v13', 'v13_desk.js'), 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
  for(const f of ['warrantOpen', 'warrantScore', 'warrantGranted', 'basisList', 'applyWarrant', 'basisWeight', 'warrantClosed']) h.assert(!new RegExp('\\b' + f + '\\b').test(src), 'v13_desk.js no longer calls ' + f);
  await D.inject();
  await h.start('m2', { completed:['m0', 'm1'] });
  h.assert(await h.ev(() => typeof basisList === 'undefined'), 'basisList is gone');
  await D.seed({});
  // Case 02: nothing filed yet
  await h.ev(() => { S.game.accusations = {}; I().warrants = {}; S.game.completedMissions = ['m0', 'm1']; showOverlay(null); showHUD(true); ENGINE.movementEnabled = true; openDesk('warrants'); });
  const read = () => h.ev(() => {
    const b = document.getElementById('desk-body');
    return { t:b.textContent, n:b.querySelectorAll('.dk-warrant').length, ids:[...b.querySelectorAll('.dk-warrant')].map(x => x.dataset.id), btns:b.querySelectorAll('button').length,
      stamps:[...b.querySelectorAll('.dk-warrant .v13-stamp')].map(x => x.textContent), ws:typeof V12.warrantState === 'function' };
  });
  const SPOIL = /Ekosodin|Osas|Akintola|blue gate|she won't see|Whoever holds/i;
  let r = await read();
  h.log('case 02', JSON.stringify({ n:r.n, btns:r.btns, ws:r.ws }));
  h.assert(r.n === 0 && r.btns === 0, 'Case 02: no warrant listed, nothing to press');
  h.assert(!SPOIL.test(r.t) && !/BASIS|APPLY|magistrate would want/i.test(r.t), 'Case 02: no Ekosodin / Osas, no basis list, no APPLY');

  // Lagos sheet filed but not decided → still nothing
  await h.ev(() => { S.game.accusations.lagos = { suspect:'obi', warrant:'pending', settled:false }; renderDesk(); });
  r = await read(); h.assert(r.n === 0, 'a filed sheet with no decision is not listed');
  // Lagos signed → one sheet, SIGNED
  await h.ev(() => { S.game.accusations.lagos.warrant = 'signed'; S.game.accusations.lagos.warrantAt = 'h2'; renderDesk(); });
  r = await read();
  h.assert(r.n === 1 && r.ids[0] === 'w_lekki' && /SIGNED/.test(r.stamps[0]) && r.btns === 0, 'Lagos signed → one stamped SIGNED sheet, read-only ' + JSON.stringify(r.stamps));
  // the route went in exigent → second sheet, NO WARRANT
  await h.ev(() => { S.game.accusations.route = { suspect:'engineer', warrant:'exigent', exigentAt:'h5', settled:true }; S.game.completedMissions = ['m0', 'm1', 'm2', 'm3', 'm3n', 'm4', 'm5', 'm6']; renderDesk(); });
  r = await read();
  h.assert(r.n === 2 && r.ids[1] === 'w_asaba' && /NO WARRANT/.test(r.stamps[1]), 'route exigent → NO WARRANT sheet ' + JSON.stringify(r.stamps));
  h.assert(/defence will test it/i.test(r.t), 'an exigent entry carries its one consequence line (the court flaw)');
  // Ugbowo order still pending (the h6 step hasn't run) → not listed; Ekosodin never mentioned
  await h.ev(() => { I().warrants = { w_cdr:{ status:'pending' } }; renderDesk(); });
  r = await read();
  h.assert(r.n === 2 && !r.ids.includes('w_cdr') && !SPOIL.test(r.t), 'pending production order is not listed; no Ekosodin / Osas text');
  // went without the production order → listed as NO ORDER
  await h.ev(() => { I().warrants.w_cdr = { status:'none', at:'h6' }; renderDesk(); });
  r = await read();
  h.assert(r.n === 3 && r.ids[2] === 'w_cdr' && /NO ORDER/.test(r.stamps[2]) && /no court order/i.test(r.t), 'w_cdr none → NO ORDER sheet ' + JSON.stringify(r.stamps));
  h.assert(!SPOIL.test(r.t), 'still nothing about Ekosodin or Osas');
  // the Ekosodin warrant, pending → not listed
  await h.ev(() => { I().warrants.w_eko = { status:'pending' }; renderDesk(); });
  r = await read(); h.assert(r.n === 3 && !/Ekosodin/i.test(r.t), 'pending Ekosodin warrant: not listed, not named');
  await h.shot('warrants_three');
  // decided at h7: signed, carried by Lagos HQ → listed; the carrier is a plain record, no comment on who sees it
  await h.ev(() => { I().warrants.w_eko = { status:'signed', route:'commander', at:'h7' }; S.game.completedMissions.push('m7'); renderDesk(); });
  r = await read();
  h.assert(r.n === 4 && r.ids[3] === 'w_eko' && /SIGNED/.test(r.stamps[3]) && /EKOSODIN/.test(r.t), 'w_eko signed → listed once decided');
  h.assert(/Lagos HQ/.test(r.t) && !/she won't see|won't see it|will see|hear/i.test(r.t), 'the carrier is recorded with no line about who will or won\'t see it');
  h.assert(r.btns === 0, 'still read-only');
  // the stamp is a word in a box, not colour alone, and the sheets are manila paper
  const look = await h.ev(() => { const s = document.querySelector('#desk-body .dk-warrant'), st = s.querySelector('.v13-stamp'), cs = getComputedStyle(st);
    return { bg:getComputedStyle(s).backgroundColor, sb:cs.borderTopStyle, sw:cs.borderTopWidth, tt:cs.textTransform }; });
  h.assert(look.bg === 'rgb(233, 220, 192)' && look.sb === 'solid' && parseFloat(look.sw) >= 2, 'manila sheet with a bordered rubber stamp ' + JSON.stringify(look));
  await h.shot('warrants_four');
  await h.ev(() => closeDesk());
  h.assert(h.errors.length === 0, 'no page errors: ' + h.errors.join(' | '));
};
