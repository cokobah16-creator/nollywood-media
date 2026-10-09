// BOARD · the commit model: pencils are free, FILE judges each link on its own.
// Wrong links: struck line, strike +1, Integrity −2 (once per distinct link), warrant strength down.
// Three strikes: warrant refused until new evidence. Follow the Money forgives the first wrong money link.
//   node tools/harness/run.cjs tools/harness/scenarios/board_file.cjs --html /tmp/naceca-board/naceca.html
const LAGOS_READY = S => {
  S.game.evidence = [{ id:'co_madam', name:'phone' }, { id:'phishing_template', name:'template' }, { id:'kc_sims', name:'sims' }];
  S.game.flags.kc_statement = true;
  S.game._marketTunde = true;
};
module.exports = async h => {
  await h.start('m2', { completed:['m0', 'm1'], state:LAGOS_READY });
  const st = () => h.ev(() => {
    const o = V12.ops();
    return { inked:o.inked.slice(), struck:o.struck.slice(), pencils:o.pencils.slice(), strikes:V12.caseStrikes('lagos'),
      integ:S.player.reputation.integrity, w:V12.warrantFor('lagos'), toast:(document.getElementById('toast') || {}).textContent || '' };
  });
  const s0 = await st();
  h.assert(s0.w.strength === 20 && !s0.w.signed && !s0.w.refused, 'fresh case: two key leads in, nothing inked (strength 20)');

  // pencilling costs nothing and inks nothing: no oracle
  await h.ev(() => {
    V12.openOps('lagos');
    const tap = id => document.querySelector(`.ops-chip[data-id="${id}"]`).click();
    tap('s_kc'); tap('l_market');          // true
    tap('s_obi'); tap('l_market');         // wrong
    tap('e_kcsims'); tap('s_mama');        // true
  });
  await h.step(800);
  const p1 = await st();
  h.assert(p1.pencils.length === 3 && p1.inked.length === 0, 'three pencils, nothing inked before FILE');
  h.assert(p1.integ === s0.integ && p1.strikes === 0, 'pencilling is free');
  h.assert(await h.ev(() => !document.getElementById('ops-file').disabled && /FILE 3 LINKS/.test(document.getElementById('ops-file').textContent)), 'FILE button offers the three pencils');

  // FILE: two ink, one is struck
  await h.ev(() => document.getElementById('ops-file').click());
  await h.step(300);
  const f1 = await st();
  h.assert(f1.inked.includes('l_market|s_kc') && f1.inked.includes('e_kcsims|s_mama'), 'correct links are inked');
  h.assert(f1.struck.includes('l_market|s_obi'), 'the wrong link is struck');
  h.assert(f1.strikes === 1 && f1.integ === s0.integ - 2, 'one strike, Integrity −2');
  h.assert(f1.pencils.length === 0, 'filing clears the pencils');
  h.assert(f1.w.strength === 20 + 2 * 10 - 12, 'strength: +10 per ink, −12 per strike (got ' + f1.w.strength + ')');
  h.assert(!/STRIKE/.test(f1.toast || ''), 'no toast over the ruling sheet: ' + f1.toast);
  const ruling = await h.ev(() => { const m = document.querySelector('#ops-modal.show .bd-ruling'); return m ? { ok:m.querySelectorAll('li.ok').length, bad:m.querySelectorAll('li.bad').length, txt:m.textContent, icons:m.querySelectorAll('li svg.ico').length } : null; });
  h.assert(ruling && ruling.ok === 2 && ruling.bad === 1, 'the ruling lists two inked and one struck');
  h.assert(/INKED/.test(ruling.txt) && /STRUCK OFF/.test(ruling.txt) && ruling.icons === 3, 'right/wrong carry words and icons, not colour alone');
  h.assert(/Integrity −2/.test(ruling.txt) && /LAGOS strike 1\/3/.test(ruling.txt), 'the ruling shows the Integrity cost and the strike');
  await h.ev(() => document.getElementById('bd-rul-ok').click());
  await h.step(200);
  const board = await h.ev(() => ({ strip:document.querySelector('.bd-case[data-case="lagos"]').textContent, struckPath:!!document.querySelector('#ops-svg path.struck'), xmark:!!document.querySelector('#ops-svg .bd-xmark'), marks:document.querySelectorAll('.bd-case .bd-x.on svg').length }));
  h.assert(/1\/3/.test(board.strip) && board.marks === 1, 'the case slip shows one cross mark and 1/3');
  h.assert(/INTEGRITY −2/.test(board.strip), 'the case slip shows the Integrity penalty');
  h.assert(board.struckPath && board.xmark, 'the struck link is drawn as a struck line with a cross');

  // the same wrong link can't be pencilled again, and refiling it never costs twice
  await h.ev(() => { const tap = id => document.querySelector(`.ops-chip[data-id="${id}"]`).click(); tap('s_obi'); tap('l_market'); });
  const again = await st();
  h.assert(again.pencils.length === 0 && /STRUCK OFF/.test(again.toast), 'a struck link cannot be pencilled again');
  await h.ev(() => { const o = V12.ops(); o.pencils.push('l_market|s_obi'); V12.fileLinks(); });   // forced through, e.g. an old save
  const a2 = await st();
  h.assert(a2.strikes === 1 && a2.integ === s0.integ - 2, 're-filing the same wrong link costs nothing');

  // strike 2 (a herring) and strike 3 → refused
  await h.ev(() => { V12.pencil('s_tunde', 's_kc'); V12.fileLinks(); });
  const s2 = await st();
  h.assert(s2.strikes === 2 && s2.integ === s0.integ - 4 && !s2.w.refused, 'second distinct wrong link: strike 2, Integrity −4 total');
  await h.ev(() => { V12.pencil('s_mama', 'l_mushin'); V12.fileLinks(); });
  const s3 = await st();
  h.assert(s3.strikes === 3 && s3.w.refused && !s3.w.signed, 'three strikes: warrant refused');
  h.assert(s3.w.need === 'Find new evidence', 'refusal asks for new evidence');
  h.assert(await h.ev(() => !!document.querySelector('#ops-modal.show .bd-refused')), 'the ruling announces the refusal');
  h.assert(await h.ev(() => V12.warrant() === false), 'legacy V12.warrant() follows the Lagos warrant');
  const stamp = await h.ev(() => { V12.closeOps(); V12.openOps('lagos'); const s = document.querySelector('.bd-case .bd-stamp'); return s.className + '|' + s.textContent; });
  h.assert(/s-refused/.test(stamp) && /REFUSED/.test(stamp), 'the slip carries a REFUSED stamp');

  // inks filed in the same batch as a third strike don't lift it; a later new link that holds does
  await h.ev(() => { V12.pencil('s_obi', 'l_lekki'); V12.fileLinks(); });
  const lift = await st();
  h.assert(!lift.w.refused, 'a new correct link after the third strike lifts the refusal');
  h.assert(await h.ev(() => !!document.querySelector('#ops-modal.show .bd-lifted')), 'the ruling announces the review');
  await h.ev(() => { V12.pencil('e_wallet', 'l_mushin'); V12.fileLinks(); });
  const s4 = await st();
  h.assert(s4.strikes === 4 && s4.w.refused, 'a fourth strike refuses it again');
  // a new card in the case (the laptop from Lekki) is also new evidence
  await h.ev(() => { S.game.evidence.push({ id:'laptop', name:'laptop' }); V12.opsRefresh(); });
  const s5 = await st();
  h.assert(!s5.w.refused, 'a new card in the case lifts the refusal');

  // batch: the third strike and a correct link in one filing stays refused
  await h.start('m2', { completed:['m0', 'm1'], state:LAGOS_READY });
  const b = await h.ev(() => {
    V12.pencil('s_obi', 'l_market'); V12.pencil('s_obi', 'l_mushin'); V12.fileLinks();
    V12.pencil('s_kc', 'l_lekki'); V12.pencil('s_obi', 'l_lekki'); V12.fileLinks();
    return V12.warrantFor('lagos');
  });
  h.assert(b.strikes === 3 && b.refused, 'a link filed alongside the third strike does not wipe it');

  // Follow the Money: the first wrong money link on each case is forgiven
  await h.start('m2', { completed:['m0', 'm1'], state:S => { S.player.skills = ['sources', 'money']; } });
  const fm = await h.ev(() => {
    const i0 = S.player.reputation.integrity;
    V12.pencil('e_wallet', 'l_mushin'); const r1 = V12.fileLinks()[0];
    const k1 = V12.caseStrikes('lagos'), i1 = S.player.reputation.integrity;
    V12.pencil('m_pos', 'l_lekki'); V12.fileLinks();
    return { forgiven:!!r1.forgiven, k1, d1:i0 - i1, k2:V12.caseStrikes('lagos'), d2:i0 - S.player.reputation.integrity, struck:V12.ops().struck.length };
  });
  h.assert(fm.forgiven && fm.k1 === 0 && fm.d1 === 0, 'first wrong money link: struck, no strike, no Integrity cost');
  h.assert(fm.k2 === 1 && fm.d2 === 2 && fm.struck === 2, 'second wrong money link costs a strike');
  // without the capability nothing is forgiven
  await h.start('m2', { completed:['m0', 'm1'] });
  const nf = await h.ev(() => { V12.pencil('e_wallet', 'l_mushin'); V12.fileLinks(); return V12.caseStrikes('lagos'); });
  h.assert(nf === 1, 'without Follow the Money a wrong money link is a strike');

  // a signed warrant: enough ink and theory
  await h.start('m2', { completed:['m0', 'm1'], state:LAGOS_READY });
  const sg = await h.ev(() => {
    [['s_obi','e_wallet'],['e_wallet','m_pos'],['m_pos','l_market'],['s_kc','l_market']].forEach(([a, b]) => V12.pencil(a, b));
    V12.fileLinks();
    return { w:V12.warrantFor('lagos'), legacy:V12.warrant(), th:V12.theory('t_money') };
  });
  h.assert(sg.th && sg.w.signed && sg.legacy, 'the money trail plus a link signs the Lagos warrant (strength ' + sg.w.strength + ')');
  h.assert(h.errors.length === 0, 'no page errors');
};
