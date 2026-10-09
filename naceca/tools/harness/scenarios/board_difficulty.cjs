// BOARD · Senior Agent hides the answer-shaped help; Recruit keeps it.
// Uche's hint, open theory questions, role tags before ink, per-card ink counts, analysts' notes.
//   node tools/harness/run.cjs tools/harness/scenarios/board_difficulty.cjs --html /tmp/naceca-board/naceca.html
// (state functions are stringified into the page, so each one is self-contained)
const SENIOR = S => {
  S.game.evidence = [{ id:'co_madam', name:'phone' }, { id:'phishing_template', name:'template' }, { id:'kc_sims', name:'sims' }];
  S.game.flags.kc_statement = true; S.game._marketTunde = true;
  S.game.ops = { pencils:[], inked:['l_lekki|s_obi'], theories:{}, tries:9, sinceInk:9, v:2 };
};
const RECRUIT = S => {
  S.game.evidence = [{ id:'co_madam', name:'phone' }, { id:'phishing_template', name:'template' }, { id:'kc_sims', name:'sims' }];
  S.game.flags.kc_statement = true; S.game._marketTunde = true;
  S.game.ops = { pencils:[], inked:['l_lekki|s_obi'], theories:{}, tries:9, sinceInk:9, v:2 };
  S.game.difficulty = 'recruit';
};
module.exports = async h => {
  const look = () => h.ev(() => {
    V12.openOps('lagos');
    const side = document.getElementById('ops-side').textContent;
    const tag = id => (document.querySelector(`.ops-chip[data-id="${id}"] .t`) || {}).textContent;
    const out = {
      hint:!!document.querySelector('.ops-hint'),
      openQ:/Whose money moves through Ikeja\?/.test(side) || /Where do KC's SIMs lead\?/.test(side),
      tagKC:tag('s_kc'), tagObi:tag('s_obi'), tagMama:tag('s_mama'), tagTunde:tag('s_tunde'),
      counts:document.querySelectorAll('.ops-chip .c').length,
    };
    document.querySelector('.ops-chip[data-id="s_obi"]').click();
    const d = document.getElementById('ops-side');
    out.note = !!d.querySelector('.bd-note');
    out.facts = (d.querySelector('.bd-facts') || {}).textContent || '';
    out.conclusion = /runs the Lagos end/i.test(d.textContent);
    V12.closeOps();
    return out;
  });

  // ---- Senior Agent (the default)
  await h.start('m2', { completed:['m0', 'm1'], state:SENIOR });
  const sr = await look();
  h.log('senior', JSON.stringify(sr));
  h.assert(!sr.hint, 'Senior: no Sgt. Uche hint panel');
  h.assert(!sr.openQ, 'Senior: no open theory questions');
  h.assert(sr.tagKC === 'PERSON' && sr.tagMama === 'PERSON', 'Senior: role tags hidden until the card carries ink');
  h.assert(sr.tagObi === 'PRINCIPAL', 'Senior: a card with an inked link shows its role tag');
  h.assert(sr.tagTunde === 'PERSON', 'Senior: a lead that goes nowhere never shows a role tag');
  h.assert(sr.counts === 0, 'Senior: no per-card ink counts');
  h.assert(!sr.note && !sr.conclusion, "Senior: no analyst's note, no conclusion in the dossier");
  h.assert(/Akaeze of Umuoji/.test(sr.facts), 'Senior: neutral facts still shown');

  // a proven theory does show in Senior
  const th = await h.ev(() => {
    [['s_obi','e_wallet'],['e_wallet','m_pos'],['m_pos','l_market']].forEach(([a, b]) => V12.pencil(a, b));
    V12.fileLinks(); V12.closeOps(); V12.openOps('lagos');
    return document.getElementById('ops-side').textContent;
  });
  h.assert(/The ransom money runs through Obi/.test(th), 'Senior: confirmed theories are listed');
  h.assert(!/Where do KC's SIMs lead\?/.test(th), 'Senior: still no open questions');
  await h.ev(() => V12.closeOps());

  // ---- Recruit
  await h.start('m2', { completed:['m0', 'm1'], state:RECRUIT });
  const rc = await look();
  h.log('recruit', JSON.stringify(rc));
  h.assert(rc.hint, 'Recruit: Sgt. Uche hint panel');
  h.assert(rc.openQ, 'Recruit: open theory questions');
  h.assert(rc.tagKC === 'COURIER' && rc.tagMama === 'GHOST', 'Recruit: role tags shown');
  h.assert(rc.counts > 0, 'Recruit: per-card ink counts');
  h.assert(rc.note && rc.conclusion, "Recruit: the analyst's note with today's conclusion");

  // ---- Night Shift document: Senior reads it plain, Recruit gets the highlights
  await h.start('m3n', { completed:['m0', 'm1', 'm2', 'm3'], state:S => { S.game.mem = { hubs:{ h2:1 } }; } });
  for(let i = 0; i < 40 && !(await h.ev(() => S.game.currentMission === 'm3n' && V12.hasEv('obi_notebook'))); i++) await h.step(200);
  const plain = await h.ev(() => { V12.nightClick(); const l = document.getElementById('v12-lines'); const r = { red:l.querySelectorAll('span.red').length, green:l.querySelectorAll('span.green').length, tick:!!l.querySelector('svg.ico') }; document.getElementById('v12-doc-x').click(); return r; });
  h.assert(plain.red === 0 && plain.green === 0, 'Senior: the Night Shift page has no red/green highlights');
  h.assert(plain.tick, 'the notebook tick is a line icon, not a glyph');
  await h.step(300);
  const lit = await h.ev(() => { S.game.difficulty = 'recruit'; V12.nightClick(); const l = document.getElementById('v12-lines'); const r = l.querySelectorAll('span.red').length + l.querySelectorAll('span.green').length; document.getElementById('v12-doc-x').click(); return r; });
  h.assert(lit === 2, 'Recruit: the Night Shift page keeps its highlights');
  h.assert(h.errors.length === 0, 'no page errors');
};
