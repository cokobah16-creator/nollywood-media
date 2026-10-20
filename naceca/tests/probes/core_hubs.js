// core: the Season 2 offices, loaded the real way (V13.hubBefore): the renames, the pen call in every save,
// the calendar, the seized barge, the binding continuity lines, the phone book (CN03, CN05/06, CN10, CN14, CN15, CN20, R16).
const L = require('./core_lib.js'), sc = L.sc;
const ORDER = ['m9', 'm10', 'm11', 'm12', 'm13', 'm13b', 'm14', 'm15'];
async function office(T, h, mc, extra) {
  await T.ev(([prep, h, mc, extra]) => {
    (new Function(prep))();
    const H = V13.HUBS[h], upto = ['m9', 'm10', 'm11', 'm12', 'm13', 'm13b', 'm14', 'm15'];
    S.game.completedMissions.push(...upto.slice(0, upto.indexOf(H.after) + 1));
    const hubs = {}; for (const k of Object.keys(V13.HUBS)) if (k !== h && upto.indexOf(V13.HUBS[k].after) < upto.indexOf(H.after)) hubs[k] = 1;
    V13.s2().hubs = hubs; Object.assign(S.game.moralChoices, mc || {}); Object.assign(S.game.flags = S.game.flags || {}, mc || {});
    if (extra) (new Function(extra))();
    V13._skipHubs = false; showOverlay(null); V13.hubBefore(H.next);
  }, [L.S1FRESH, h, mc, extra || '']);
  const ok = await T.until(h => S.game.currentMission === h && ENGINE.player && ENGINE.movementEnabled && !document.querySelector('#title-card.show') && V13.rt && V13.rt.id === h, 90000, h);
  await T.wait(1200);
  return ok;
}
const runText = (T, key) => T.ev(k => (DIALOGUE[k] || []).map(l => (l.speaker || '') + ': ' + l.text).join(' / '), key);
module.exports = async function (T) {
  const C = L.checks(T);
  await L.capture(T);
  // ---------- h9: the handover not kept ----------
  T.log('h9', await office(T, 'h9', { s2_custody:'signed', s2_method:'image', s2_abuja_call:'truth', s2_original:'handed' }));
  let labels = await L.labels(T);
  C.check('CN10 the h9 label is "Talk to Commander Okundaye"', /Talk to Commander Okundaye/.test(labels) && !/Osagie/.test(labels), labels);
  await sc.use(T, 'Talk to Uche'); await sc.talk(T);
  let u = await runText(T, 'hub2_uche_run');
  C.check('CN10 h9 Uche: Okundaye, not Osagie', !/Osagie/.test(u), u.slice(0, 200));
  await sc.use(T, 'Talk to Commander (Okundaye|Osagie)'); await sc.talk(T);
  let h = await runText(T, 'hub2_host_run');
  C.check('CN20 h9: "Ikpe says the escort signed for it at 05:14", by COMMANDER OKUNDAYE', /^COMMANDER OKUNDAYE: The drive is on the ninth floor now\. Ikpe says the escort signed for it at 05:14\. Make the copy count, Kelechi\.$/.test(h), h);
  const pb = await T.ev(() => { const P = V13.phonebook(); return { o: P.osagie, h: P.hauwa, u: P.unknownnumber }; });
  C.check('CN10 the phone book: Commander Okundaye (IO), Zainab Danladi (Legal) (ZD)', pb.o.name === 'Commander Okundaye' && pb.o.ini === 'IO' && pb.h.name === 'Zainab Danladi (Legal)' && pb.h.ini === 'ZD', pb);
  C.check('R16 the unknown number takes Season 1\'s unknown-contact red', pb.u.col.toUpperCase() === '#B3261E', pb.u);
  // the unknown number's disc in the phone (Season 1's .ph-unk), with a text from it
  const unk = await T.ev(async () => {
    const P = V12.mem().phone; P.unknownnumber = { msgs:[{ f:'them', text:'core probe', at:'h9' }], unread:1, last:'h9' };
    V12.openPhone(() => {}); await new Promise(r => setTimeout(r, 300));
    const av = document.querySelector('#screen-phone .ph-row[data-id="unknownnumber"] .ph-av');
    const out = { unk: !!(av && av.classList.contains('ph-unk')), bg: av ? getComputedStyle(av).backgroundColor : null };
    const x = document.querySelector('#screen-phone .ph-x'); if (x) x.click(); delete P.unknownnumber; return out;
  });
  C.check('R16 the unknown number\'s disc is Season 1\'s stamp red (.ph-unk)', unk.unk && /179, 38, 30/.test(unk.bg || ''), unk);
  // ---------- h11: a mass arrest ----------
  T.log('h11', await office(T, 'h11', { s2_camp:'mass', s2_barge:'seized' }));
  await sc.use(T, 'Talk to Uche'); await sc.talk(T);
  u = await runText(T, 'hub2_uche_run');
  C.check('CN20 h11: "Eight boys in the cells for one man\'s diesel"', /Eight boys in the cells for one man's diesel/.test(u) && !/Thirty boys/.test(u), u.slice(0, 220));
  // ---------- h12: the pen, with Tobi rescued ----------
  T.log('h12', await office(T, 'h12', { asaba:'rescue', s2_warrant:'waited' }));
  labels = await L.labels(T);
  const obj = await T.ev(() => ((S.game.objectives || []).find(o => o.id === 'hb_wire') || {}).text);
  C.check('CN05/CN06 h12: the pen is Commander Okundaye\'s call in every save, no Tobi seated', /Take Commander Okundaye's call/.test(labels) && !/Talk to Tobi/.test(labels) && obj === 'Commander Okundaye is on the line', { labels, obj });
  await sc.use(T, 'Talk to Uche'); await sc.talk(T);
  u = await runText(T, 'hub2_uche_run');
  C.check('CN10 h12 Uche: Zainab, not Hauwa', !/Hauwa/.test(u), u.slice(0, 220));
  await sc.use(T, "Take Commander Okundaye's call"); await T.wait(500);
  const dl = await L.got(T, 'dlg');
  C.check('CN06 h12: the pen offer is m13_wire_offer on a rescue save too (Okundaye\'s call)', dl[dl.length - 1] === 'm13_wire_offer', dl.slice(-2));
  await sc.talk(T, [0]);
  // ---------- h13: the trial date and the SAN's name ----------
  T.log('h13', await office(T, 'h13', { s2_ninth:'refuse', s2_bitrus:'photo' }));
  await sc.use(T, 'Talk to Uche'); await sc.talk(T);
  u = await runText(T, 'hub2_uche_run');
  C.check('CN03 h13: the trial opens on the eleventh of January; Court 5 the Friday before', /The trial opens on the eleventh of January\. Danladi wants you in Court 5 the Friday before, when it's empty, to walk the room\./.test(u) && /Zainab will have to make it walk/.test(u), u.slice(-330));
  const card = await T.ev(() => V13.HUBS.h13.nextCard);
  C.check('CN03 the conference card', card[0] === 'FEDERAL HIGH COURT' && card[1] === 'COURT 5 · FRIDAY 8 JANUARY · 18:40', card);
  await sc.use(T, 'Prepare the exhibits with Barrister Danladi'); await sc.talk(T); await T.wait(600);
  h = await runText(T, 'hub2_host_run');
  C.check('CN15 h13: "Olaniran-Cole SAN"', /Olaniran-Cole SAN is for the first defendant/.test(h) && !/Coker/.test(h), h.slice(0, 200));
  await T.ev(() => { const x = document.querySelector('#screen-courtfix.show .cf-close, #screen-courtfix.show [data-close]'); if (x) x.click(); showOverlay(null); });
  // ---------- h14: the barge seized in Case 11, the original kept in Case 09 ----------
  T.log('h14', await office(T, 'h14', { s2_original:'kept', s2_barge:'seized' }, "V13.s2().trial = { d1:'guilty' };"));
  await sc.use(T, 'Talk to Uche'); await sc.talk(T);
  u = await runText(T, 'hub2_uche_run');
  C.check('CN14 h14 with the barge seized: the Navy let TEKENA 2 go', /The Navy let TEKENA 2 go on Tuesday\. Riverstone's lawyers had a court bond before ours had a file number\. She's back on the Bonny River\./.test(u), u.slice(0, 330));
  await sc.use(T, 'Talk to Commander (Okundaye|Osagie)'); await sc.talk(T);
  h = await runText(T, 'hub2_host_run');
  C.check('CN20 h14 (kept): Maiduguri waits since the ninth floor', /Maiduguri has waited for me since the ninth floor\. I told them I'd come when this barge is in the inventory\. Tonight, then\./.test(h), h);
  // and with the barge tagged, no seized line
  T.log('h14 tagged', await office(T, 'h14', { s2_original:'handed', s2_barge:'tagged' }, "V13.s2().trial = { d1:'guilty' };"));
  await sc.use(T, 'Talk to Uche'); await sc.talk(T);
  u = await runText(T, 'hub2_uche_run');
  C.check('CN14 h14 with the barge tagged: no seized line', !/The Navy let TEKENA 2 go/.test(u), u.slice(0, 160));
  C.done();
};
