// v13 fix · Case Desk text (R32): no arrow glyph reaches the desk from data; a route reads as words.
//   node tools/harness/run.cjs tools/harness/scenarios/v13_fix_nav_arrow.cjs --html <build>/naceca.html [--w 390 --h 844 --touch 1]
// The t7 tail: the plate photographed on the car tail (the line v12_car.js runs) is logged with the t7
// region 'EDO · UGBOWO → EKOSODIN, 20:40' as its custody place. The Locker's chain of custody prints it
// as 'EDO · UGBOWO to EKOSODIN, 20:40' (the record itself is untouched, so old saves read the same), and
// any exhibit name written with arrows reads as words too. The desk's own glyph audit finds nothing.
module.exports = async h => {
  const D = require('./v13_d_lib.cjs').lib(h);
  await h.start('t7', { completed:['m0', 'm1', 'm2', 'h2', 'm3', 'm3n', 'm4', 'h4', 'm5', 'h5', 'm6', 'h6', 'm7', 'h7'] });
  await D.inject();
  h.assert(await h.ev(() => /\u2192/.test((MISSIONS.find(m => m.id === 't7') || {}).region || '')), 'the t7 region is written with an arrow (the beta\'s string)');
  await h.ev(() => collectEvidence({ id:'tail_plate', name:'Plate BEN 417 KJ — the black jeep, registered to Ikpoba Mast Services (the tower contractor)', xp:90 }));
  await h.step(300);
  const at = await h.ev(() => ((I().items.tail_plate || {}).custody || [])[0] || null);
  h.assert(at && /\u2192/.test(at.at || ''), 'the record keeps the place as logged: ' + JSON.stringify(at));
  // an exhibit whose name carries arrows (as a route sheet or the route theory are written)
  await h.ev(() => { const e = (S.game.evidence || []).find(x => x.id === 'tail_plate'); if(e) e.name = 'Plate BEN 417 KJ \u2192 Ikpoba Mast Services \u2190 tower contract'; });
  await h.ev(() => { showOverlay(null); openDesk('locker'); document.querySelectorAll('#screen-desk details').forEach(d => { d.open = true; }); });
  await h.step(300);
  const sheet = await h.ev(() => {
    const el = document.querySelector('#desk-body .dk-ex[data-id="tail_plate"]'); if(!el) return null;
    return { place:[...el.querySelectorAll('.dk-chain li i')].map(x => x.textContent), name:(el.querySelector('.dk-name') || {}).textContent || '', all:el.textContent };
  });
  h.log('tail plate', JSON.stringify(sheet && { place:sheet.place, name:sheet.name }));
  h.assert(sheet, 'the tail plate is in the Locker');
  h.assert(sheet.place.includes('EDO · UGBOWO to EKOSODIN, 20:40'), 'the chain of custody reads the route as words: ' + JSON.stringify(sheet.place));
  h.assert(sheet.name === 'Plate BEN 417 KJ to Ikpoba Mast Services to tower contract', 'an exhibit name with arrows reads as words: ' + sheet.name);
  h.assert(!/[\u2190-\u21FF]/.test(sheet.all), 'no arrow glyph anywhere on the exhibit sheet');
  const r = await D.audit('#screen-desk', { touch:await h.ev(() => document.body.classList.contains('touch-active')), narrow:await h.ev(() => innerWidth <= 600) });
  h.assert(r.glyphs.length === 0, 'the desk\'s glyph audit finds nothing in the Locker: ' + r.glyphs.join(' | '));
  await h.shot('v13_fix_nav_arrow_locker');
  await h.ev(() => closeDesk());
  h.assert(h.errors.length === 0, 'no page errors: ' + h.errors.join(' | '));
};
