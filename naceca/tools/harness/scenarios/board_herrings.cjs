// BOARD · red herrings: 3–4 per case, no true links, each appears when the player meets it.
//   node tools/harness/run.cjs tools/harness/scenarios/board_herrings.cjs --html /tmp/naceca-board/naceca.html
// the field offices between cases are marked done, so each mission loads straight in
const HUBS = S => { S.game.mem = { hubs:{ h2:1, h4:1, h5:1, h6:1, h7:1 } }; };
module.exports = async h => {
  const vis = id => h.ev(i => V12.opsVisible(i), id);

  // ---- data: which cards are herrings, and none of them carries a true link
  const data = await h.ev(() => {
    const her = V12.OPS_NODES.filter(n => n.herring);
    const byCase = {};
    for(const c of ['lagos', 'route', 'voice']) byCase[c] = V12.caseCards(c).filter(x => x.herring).map(x => x.id);
    const linked = her.filter(n => V12.OPS_LINKS.some(l => l.a === n.id || l.b === n.id)).map(n => n.id);
    const words = her.map(n => [n.name, n.meta, n.tag, typeof n.dossier === 'function' ? '' : n.dossier].join(' ')).join(' ');
    return { ids:her.map(n => n.id), byCase, linked, aks:/\bAKS\b/.test(words), anyReq:her.every(n => typeof n.req === 'function') };
  });
  h.log('herrings', JSON.stringify(data.byCase));
  for(const c of ['lagos', 'route', 'voice']) h.assert(data.byCase[c].length >= 3 && data.byCase[c].length <= 4, `${c}: 3–4 herrings (got ${data.byCase[c].length})`);
  h.assert(data.linked.length === 0, 'no herring has a true link: ' + data.linked.join(','));
  h.assert(data.anyReq, 'every herring waits for its moment (has a req)');
  h.assert(!data.aks, 'no "AKS" in herring text');

  // ---- LAGOS (m2 → m3n)
  await h.start('m2', { completed:['m0', 'm1'] });
  for(const id of ['s_tunde', 'e_bvn', 'm_coop', 's_ada']) h.assert(!(await vis(id)), `${id} hidden at the start of m2`);
  await h.ev(() => { S.game._marketTunde = true; });
  h.assert(await vis('s_tunde'), 'Tunde appears once you have met him');
  // reading the phone (even backing off) puts the inbox text on the table
  await h.ev(() => { openPuzzle('market_phone_scan', ()=>{}); });
  await h.step(300);
  await h.ev(() => document.getElementById('v12-doc-x').click());
  await h.step(200);
  h.assert(await vis('e_bvn'), 'UNKNOWN-BANK text appears after the phone was read');
  h.assert(!(await vis('m_coop')), 'Grace Divine stays off the table until Sister Ngozi');
  await h.ev(() => V12.street('ponzi', 'warned'));
  h.assert(await vis('m_coop'), 'Grace Divine appears after Sister Ngozi');
  const coop = await h.ev(() => { V12.openOps('lagos'); document.querySelector('.ops-chip[data-id="m_coop"]').click(); return document.getElementById('ops-side').textContent; });
  h.assert(/new members/.test(coop), 'the Ponzi dossier carries what Ngozi admitted (the flaw a careful reader spots)');
  h.assert(!/herring|red herring|not part of the ring/i.test(coop), 'nothing says it is a herring');
  await h.ev(() => V12.closeOps());
  h.assert(!(await vis('s_ada')), 'Ada is not on the table before Lekki');
  await h.ev(() => { (S.game.docSeen = S.game.docSeen || {}).mansion_safe = true; });
  h.assert(await vis('s_ada'), 'Ada appears once the safe (and its gold pen) has been read');

  // ---- THE ROUTE (m4 → m5)
  await h.start('m4', { completed:['m0', 'm1', 'm2', 'm3', 'm3n'] });
  for(const id of ['s_rabiu', 'l_abattoir', 's_levy', 's_paeze']) h.assert(!(await vis(id)), `${id} hidden at the start of m4`);
  await h.ev(() => { (S.game.docSeen = S.game.docSeen || {}).checkpoint_manifest = true; });
  h.assert(await vis('s_rabiu') && await vis('l_abattoir'), 'consignor and consignee appear once the waybill is read');
  await h.ev(() => V12.street('levy', 'warned'));
  h.assert(await vis('s_levy'), 'the levy boy appears after Alhaji Sani');
  h.assert(!(await vis('s_paeze')), 'Pa Eze waits for Ozalla');
  await h.start('m5', { completed:['m0', 'm1', 'm2', 'm3', 'm3n', 'm4'], state:HUBS });
  h.assert(await vis('s_paeze'), 'Pa Eze appears at Ozalla');

  // ---- THE VOICE (m7)
  await h.start('m7', { completed:['m0', 'm1', 'm2', 'm3', 'm3n', 'm4', 'm5', 'm6'], state:HUBS });
  for(const id of ['s_osaro', 'l_hall3', 'l_isihor']) h.assert(!(await vis(id)), `${id} hidden at the start of m7`);
  await h.ev(() => { S.game._towerEngineer = true; });
  h.assert(await vis('s_osaro'), 'Engr. Osaro appears once you have spoken to him');
  await h.ev(() => { (S.game.docSeen = S.game.docSeen || {}).tower_call_trace = true; });
  h.assert(await vis('l_hall3') && await vis('l_isihor'), 'Hall 3 and Isihor appear once the trace sheet is read');

  // filing any link to a herring is struck: there is no true link to find
  const r = await h.ev(() => {
    V12.pencil('s_osaro', 'l_ugbowo');
    const res = V12.fileLinks();
    return { ok:res.map(x => x.ok), struck:V12.ops().struck.slice(), strikes:V12.caseStrikes('voice') };
  });
  h.assert(r.ok.length === 1 && r.ok[0] === false, 'Osaro–Ugbowo is struck off');
  h.assert(r.strikes === 1, 'and costs the Voice case a strike');
  h.assert(h.errors.length === 0, 'no page errors');
};
