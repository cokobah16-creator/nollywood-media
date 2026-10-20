// screens team: Case 15's envelope and accusation with the beta's casework layer gone (window.CW undefined), the
// layer-removal path of s2.css's old .acc-* markup. It must still seal and file, and stay on paper:
//   SC5  no text in Arial (a <button> does not inherit the page font, so the card's role line fell back to it);
//        no gradients, glows, off-palette colours or glyph icons. Then CW is back and the normal sheet keeps its fonts.
const { R, checks, c15, clearC15 } = require('./screens_lib.js');
module.exports = async function (T) {
  const C = checks(T), tag = T.mode;
  const paper = (r) => !r.gradients.length && !r.shadows.length && !Object.keys(r.colours).length && !r.glyphs.length;
  T.log('m15', await c15(T));
  await T.ev(() => { window.__CW = window.CW; window.CW = undefined; });
  // the envelope: pick the DG, SEAL IT twice
  await T.ev(() => { window.__sealed = null; V13._c15.sealScreen(ok => { window.__sealed = ok; }); }); await T.wait(500);
  const a1 = await R.look(T, 'screens_nocw_seal', '#screen-seal15');
  const s1 = await T.ev(() => { const ov = document.getElementById('screen-seal15'); return { cw:!!ov.querySelector('.cw-sheet'), acc:!!ov.querySelector('.acc-frame'), cards:ov.querySelectorAll('.acc-card').length,
    span:(s => s ? getComputedStyle(s).fontFamily : 'no span')(ov.querySelector('.acc-card span')) }; });
  C.ok(`SC5-nocw-seal-renders-${tag}`, !s1.cw && s1.acc && s1.cards >= 3, JSON.stringify(s1));
  C.ok(`SC5-nocw-seal-fonts-${tag}`, !Object.keys(a1.fonts).length && /Inter/.test(s1.span), JSON.stringify({ fonts:a1.fonts, span:s1.span }));
  C.ok(`SC5-nocw-seal-paper-${tag}`, paper(a1), JSON.stringify({ g:a1.gradients, s:a1.shadows, c:a1.colours, gl:a1.glyphs }));
  await T.ev(() => { document.querySelector('#screen-seal15 .acc-card[data-id="dg"]').click(); }); await T.wait(200);
  await T.ev(() => document.getElementById('s15-go').click()); await T.wait(150);
  await T.ev(() => document.getElementById('s15-go').click()); await T.wait(600);
  const s2 = await T.ev(() => ({ sealed:window.__sealed, seal:JSON.stringify(V13.s2().seal15 || null), shown:document.getElementById('screen-seal15').classList.contains('show') }));
  C.ok(`SC5-nocw-seal-files-${tag}`, s2.sealed === true && /"who":"dg"/.test(s2.seal) && !s2.shown, JSON.stringify(s2));
  // the accusation
  await T.ev(() => { V13.s2().seal15 = { who:'dg', before:true, t:Date.now() }; V13._c15.accuseScreen(); }); await T.wait(500);
  const a2 = await R.look(T, 'screens_nocw_accuse', '#screen-accuse15');
  C.ok(`SC5-nocw-accuse-fonts-${tag}`, !Object.keys(a2.fonts).length, JSON.stringify(a2.fonts));
  C.ok(`SC5-nocw-accuse-paper-${tag}`, paper(a2), JSON.stringify({ g:a2.gradients, s:a2.shadows, c:a2.colours, gl:a2.glyphs }));
  const r2 = await T.ev(() => { const ov = document.getElementById('screen-accuse15'); ov.querySelector('.acc-card[data-id="dg"]').click();
    for (const id of ['dg_recording', 'visitor_book', 'transfer_docket']) { const b = document.querySelector(`#screen-accuse15 .acc-item[data-id="${id}"]`); if (b) b.click(); }
    const go = document.getElementById('a15-go'); return { ready:!!go && !go.disabled }; });
  await T.ev(() => document.getElementById('a15-go').click()); await T.wait(150);
  await T.ev(() => document.getElementById('a15-go').click()); await T.wait(1500);
  const r3 = await T.ev(() => ({ acc:JSON.stringify(V13.s2().acc15 || null), shown:document.getElementById('screen-accuse15').classList.contains('show') }));
  C.ok(`SC5-nocw-accuse-files-${tag}`, r2.ready && /"who":"dg"/.test(r3.acc) && !r3.shown, JSON.stringify({ r2, r3 }));
  await T.ev(() => { window.CW = window.__CW; });
  await clearC15(T);
  // with CW back, the normal paper sheet: the new rule must not reach it
  await T.ev(() => { delete V13.s2().seal15; V13._c15.sealScreen(() => {}); }); await T.wait(500);
  const a3 = await R.audit(T, 'screens_cw_seal', '#screen-seal15');
  const s3 = await T.ev(() => { const ov = document.getElementById('screen-seal15'), c = ov.querySelector('.cw-card'); return { cw:!!ov.querySelector('.cw-sheet'), card:c ? getComputedStyle(c).fontFamily : 'no card' }; });
  C.ok(`SC5-cw-seal-unchanged-${tag}`, s3.cw && !Object.keys(a3.fonts).length, JSON.stringify({ s3, fonts:a3.fonts }));
  await clearC15(T);
  C.done();
};
