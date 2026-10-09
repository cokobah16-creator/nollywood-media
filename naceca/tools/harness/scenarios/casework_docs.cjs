// Casework 3: document checks. Senior Agent strips the answer colouring, the arrows and "(FAKE)",
// the late underline, the extra miss and the "Right idea" partial feedback; Recruit keeps them.
// Read the Room (a bought capability) underlines in both modes.
module.exports = async h => {
  await h.start('m4', { completed:['m0', 'm1', 'm2', 'm3', 'm3n'], state:S => { S.game.difficulty = 'senior'; } });
  const open = key => h.ev(key => { showOverlay(null); S.game._docMiss = {}; S.game._docFree = {}; S.game._docLocked = {}; openPuzzle(key); return !!document.querySelector('#screen-puzzle.show'); }, key);
  const look = () => h.ev(() => {
    const L = document.getElementById('v12-lines');
    return { colour:L.querySelectorAll('.green, .red').length, arrows:/←/.test(L.textContent), fake:/\(FAKE\)/.test(L.textContent), hint:L.querySelectorAll('.cw-hint').length,
      pips:document.querySelectorAll('#v12-misses i').length, under:L.querySelectorAll('.v12-look').length };
  });
  // answer: the correct conclusion with a line that isn't the proof
  const wrongLine = (optText, lineText) => h.ev(([o, l]) => {
    [...document.querySelectorAll('.v12-opt')].find(b => b.textContent.includes(o)).click();
    [...document.querySelectorAll('.v12-line.live')].find(x => x.textContent.includes(l)).click();
    document.getElementById('v12-doc-go').click();
    return document.getElementById('v12-doc-msg').textContent;
  }, [optText, lineText]);

  // ---- Senior Agent ----
  h.assert(await open('checkpoint_manifest'), 'manifest check opens');
  let s = await look();
  h.log('senior manifest', s);
  h.assert(s.colour === 0, 'Senior: no red/green answer colouring');
  h.assert(!s.arrows && s.hint === 0, 'Senior: no "← discrepancy" / "← MISMATCH" markers');
  h.assert(s.pips === 2, 'Senior: two misses allowed');
  let msg = await wrongLine('Container seal numbers', 'INSURANCE');
  h.log('senior partial', msg);
  h.assert(!/Right idea/.test(msg) && /Not on the record/.test(msg), 'Senior: one neutral line, no "Right idea"');
  await h.step(9600);
  s = await look();
  h.assert(s.under === 0, 'Senior: no late "worth a second look" underline');
  await h.shot('casework_doc_senior');
  h.assert(await open('market_phone_scan'), 'phone scan opens');
  s = await look();
  h.assert(!s.fake && s.colour === 0, 'Senior: phone scan without "(FAKE)" or colouring');

  // ---- Recruit ----
  await h.ev(() => { setGameDifficulty('recruit'); });
  h.assert(await open('checkpoint_manifest'), 'manifest check opens (Recruit)');
  s = await look();
  h.log('recruit manifest', s);
  h.assert(s.colour > 0 && s.arrows && s.hint === 2, 'Recruit: colouring and arrows kept');
  h.assert(s.pips === 3, 'Recruit: the extra miss');
  msg = await wrongLine('Container seal numbers', 'INSURANCE');
  h.assert(/Right idea/.test(msg), 'Recruit: "Right idea" partial feedback kept');
  await h.step(9600);
  s = await look();
  h.assert(s.under > 0, 'Recruit: lines worth a second look get underlined');
  const vis = await h.ev(() => getComputedStyle(document.querySelector('#v12-lines .cw-hint')).display);
  h.assert(vis !== 'none', 'Recruit: the arrow annotations are visible');
  await h.shot('casework_doc_recruit');
  h.assert(await open('market_phone_scan'), 'phone scan opens (Recruit)');
  s = await look();
  h.assert(s.fake && s.colour > 0, 'Recruit: phone scan keeps "(FAKE)" and colouring');

  // ---- Read the Room is earned: it works for Senior too ----
  await h.ev(() => { setGameDifficulty('senior'); S.player.skills.push('readroom'); });
  h.assert(await open('checkpoint_manifest'), 'manifest check opens (Senior + Read the Room)');
  await h.step(4900);
  s = await look();
  h.assert(s.under > 0 && s.colour === 0 && s.pips === 2, 'Senior with Read the Room: underline yes, colouring and extra miss no');
  // the body-class fallback hides annotations wherever the raw markup shows up
  const hidden = await h.ev(() => { const d = document.createElement('div'); d.className = 'phone-screen'; d.innerHTML = '<span class="red">x</span><span class="cw-hint">← y</span>'; document.body.appendChild(d);
    const r = [getComputedStyle(d.querySelector('.cw-hint')).display, getComputedStyle(d.querySelector('.red')).color === getComputedStyle(d).color]; d.remove(); return r; });
  h.assert(hidden[0] === 'none' && hidden[1], 'body.cw-senior hides annotations and colouring in any phone screen');
  h.log('PASS casework_docs');
};
