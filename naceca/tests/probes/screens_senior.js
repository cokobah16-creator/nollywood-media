// screens team: Senior Agent (the default) gets no answer-giving hints on the Season 2 screens; Recruit does.
//   R09 the sources board's EXPOSURE and "Exposed sources get fed lies"; R10 the fix board's PROTECTS and
//   "Nothing to do for"; R15 the case file's tier tooltips; R11 Case 15's radio and toasts; R20 the crouch hint;
//   RT04 our arrow on Monday's name; SC3 the yard objective's direction (Recruit only). Desktop.
const { L, sc, checks, OFFICE, setMode, c15 } = require('./screens_lib.js');
module.exports = async function (T) {
  const C = checks(T);
  T.log('h13', await sc.s2start(T, 'h13', OFFICE));
  await T.until(() => !document.querySelector('#title-card.show'), 20000); await T.wait(1200);
  const board = () => T.ev(() => {
    V13.openSources(() => {});
    const ov = document.getElementById('screen-sources'), t = ov.innerText;
    const exp = [...ov.querySelectorAll('.src-exp')], vis = exp.filter(e => getComputedStyle(e).display !== 'none').length;
    const r = { exposure:/EXPOSURE/.test(t), lies:/Exposed sources get fed lies/.test(t), expEls:exp.length, expVisible:vis, trust:/TRUST/.test(t), check:/CHECK IT/.test(t), verdicts:/IT HOLDS/.test(t) && /SOMEONE FED THEM THIS/.test(t) };
    ov.querySelector('.src-done').click(); return r;
  });
  const fixes = () => T.ev(() => {
    V13.s2().fixes = {}; S.game.moralChoices.s2_original = 'kept';            // search_record is then not available: "Nothing to do for"
    V13.court.openFixes(2, () => {}, { where:'h13' });
    const ov = document.getElementById('screen-courtfix'), t = ov.innerText;
    const r = { protects:/PROTECTS/.test(t), nothing:/Nothing to do for/.test(t), why:/section 84 certificate/.test(t), who:ov.querySelectorAll('.cf-who').length, go:ov.querySelectorAll('.cf-go').length };
    ov.querySelector('.cf-close').click(); return r;
  });
  const tips = () => T.ev(() => {
    V13.openCaseFileS2();
    const ov = document.getElementById('screen-s2case'), chips = [...ov.querySelectorAll('.s2c-q')];
    const r = { chips:chips.length, titles:chips.filter(c => c.hasAttribute('title')).length, words:chips.map(c => c.textContent).filter((x, i, a) => a.indexOf(x) === i).join('|'), p:ov.querySelectorAll('.s2c-p').length };
    ov.querySelector('.s2c-done').click(); return r;
  });

  T.log('mode', await setMode(T, 'senior'));
  const sb = await board(), sf = await fixes(), st = await tips();
  C.ok('R09-senior', !sb.exposure && !sb.lies && sb.expVisible === 0 && sb.trust && sb.check && sb.verdicts, JSON.stringify(sb));
  C.ok('R10-senior', !sf.protects && !sf.nothing && sf.why && sf.who > 0 && sf.go > 0, JSON.stringify(sf));
  C.ok('R15-senior', st.chips > 0 && st.titles === 0 && /SOUND/.test(st.words) && st.p > 0, JSON.stringify(st));

  T.log('mode', await setMode(T, 'recruit'));
  const rb = await board(), rf = await fixes(), rt = await tips();
  C.ok('R09-recruit', rb.exposure && rb.lies && rb.expVisible === rb.expEls && rb.expEls > 0, JSON.stringify(rb));
  C.ok('R10-recruit', rf.protects && rf.nothing && rf.why, JSON.stringify(rf));
  C.ok('R15-recruit', rt.titles === rt.chips && rt.chips > 0, JSON.stringify(rt));

  // ---------- Case 15 on Senior: the radio and the toasts say what is there, not where to go or how ----------
  await setMode(T, 'senior');
  T.log('m15', await c15(T, "S.game.difficulty = 'senior'; SETTINGS.crouch = 'toggle';"));
  await T.ev(() => {
    window.__said = []; const t = V13.toast, r = V13.radio, h = window.showHint;
    V13.toast = function(a, b){ window.__said.push('toast:' + a + ': ' + b); return t.apply(this, arguments); };
    V13.radio = function(a, b){ window.__said.push('radio:' + a + ': ' + b); return r.apply(this, arguments); };
    window.showHint = function(id, d, m){ window.__said.push('hint:' + id + ': ' + d); return h.apply(this, arguments); };
  });
  const rs = await T.ev(() => ({ kit:V13._c15.radio('kit'), low:V13._c15.radio('low'), wait:V13._c15.radio('wait') }));
  C.ok('R11-radio-senior', rs.kit === 'Body-cameras in my bag, sir, charged.' && /Three Riverstone guards on that jetty, sir\./.test(rs.low) && /bags go in the river/.test(rs.low) && !/Stay low|keep the van/.test(rs.low) && rs.wait == null, JSON.stringify(rs));
  // the gate: its toast, then the stand-off and the yard's toast
  await T.ev(() => { V13.setFlag('s2_raid_entry', 'gate'); V13._c15.byGate(); });
  await T.wait(800);
  await T.ev(() => { const P = ENGINE.player.position; P.set(0.3, 0, 27.0); });
  await L.waitDialogue(T, 20000); await sc.talk(T);
  await T.until(() => (window.__said || []).some(s => /^toast:THE YARD/.test(s)), 20000);
  // onto the jetty: Uche's radio and the crouch hint
  await T.ev(() => { const P = ENGINE.player.position; P.set(0.5, 0, -11.2); });
  await T.until(() => (window.__said || []).some(s => /^hint:m15_low/.test(s)), 15000);
  const said = await T.ev(() => window.__said.slice());
  T.log('said', JSON.stringify(said));
  const gate = said.find(s => /^toast:THE GATE/.test(s)) || '', yard = said.find(s => /^toast:THE YARD/.test(s)) || '', low = said.find(s => /^radio:SGT\. UCHE: Three/.test(s)) || '', hint = said.find(s => /^hint:m15_low/.test(s)) || '';
  C.ok('R11-toasts-senior', gate && !/West along/.test(gate) && yard && !/north end/.test(yard), gate + ' | ' + yard);
  // (SC3) the objective set in the same beat carries no direction on Senior either
  const objOf = () => T.ev(() => ((S.game.objectives || []).find(o => o.id === 'o15_board') || {}).text || '(missing)');
  const objS = await objOf();
  C.ok('R11-objective-senior', objS !== '(missing)' && /TEKENA 2/.test(objS) && !/north end/.test(objS), objS);
  C.ok('R11-radio-low-said', low && !/Stay low/.test(low), low);
  C.ok('R20-crouch-hint', /^hint:m15_low: Press <b>C<\/b>/.test(hint), hint);
  await setMode(T, 'recruit');
  const rr = await T.ev(() => ({ kit:V13._c15.radio('kit'), low:V13._c15.radio('low'), wait:V13._c15.radio('wait') }));
  C.ok('R11-radio-recruit', /his lawyers will swear/.test(rr.kit) && /Stay low/.test(rr.low) && /Waiting for you/.test(rr.wait), JSON.stringify(rr));
  // (SC3) Recruit, the same gate and stand-off: the yard's toast and the objective both say where the barge is
  T.log('m15 recruit', await c15(T, "S.game.difficulty = 'recruit'; SETTINGS.crouch = 'toggle';"));
  await setMode(T, 'recruit');
  await T.ev(() => { window.__said = []; V13.setFlag('s2_raid_entry', 'gate'); V13._c15.byGate(); });
  await T.wait(800);
  await T.ev(() => { const P = ENGINE.player.position; P.set(0.3, 0, 27.0); });
  await L.waitDialogue(T, 20000); await sc.talk(T);
  await T.until(() => (window.__said || []).some(s => /^toast:THE YARD/.test(s)), 20000);
  const yardR = await T.ev(() => (window.__said || []).find(s => /^toast:THE YARD/.test(s)) || ''), objR = await objOf();
  C.ok('R11-yard-recruit', /north end/.test(yardR) && /north end of the yard/.test(objR), yardR + ' | ' + objR);

  // ---------- RT04: Monday's name is shown, not pointed at, on Senior; Recruit keeps the pointer ----------
  const way = mode => T.ev(m => { S.game.difficulty = m; if (typeof syncDifficultyClass === 'function') syncDifficultyClass();
    const f = WAY.OBJ_TARGETS.m15 && WAY.OBJ_TARGETS.m15.o15_name; const v = typeof f === 'function' ? f() : f; return JSON.stringify(v === undefined ? 'missing' : v); }, mode);
  const ws = await way('senior'), wr = await way('recruit');
  C.ok('RT04-m15-senior', ws === '{"ui":true}', ws);
  C.ok('RT04-m15-recruit', wr === 'null', wr);
  await setMode(T, 'senior');
  C.done();
};
