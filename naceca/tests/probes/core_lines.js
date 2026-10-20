// core: the dialogue-line fields (rec / sr / srEn / cond) on Senior and Recruit, V13.picked and V13.dlgKey on them,
// Case 10's Senior toasts and radio lines, our wayfinding on Senior in Case 10 (rt_tac), and Case 11 on Senior
// (the radio hint, the crouch hint, the head marker, a failed document read from the document itself).
const L = require('./core_lib.js'), sc = L.sc;
const C11 = require('./c11lib.js');
const SYN = () => {
  DIALOGUE.core_x_lines = [
    { speaker: 'SGT. UCHE', text: 'L0 always' },
    { speaker: 'SGT. UCHE', text: 'L1 recruit only', rec: 1 },
    { speaker: 'SGT. UCHE', text: 'L2 recruit text', textEn: 'L2 recruit en', sr: 'L2 senior text', srEn: 'L2 senior en' },
    { speaker: 'SGT. UCHE', text: 'L3 cond true', cond: "S.game.__coreFlag === 1" },
    { speaker: 'SGT. UCHE', text: 'L4 cond false', cond: "S.game.__coreFlag === 2" },
    { speaker: 'SGT. UCHE', text: 'L5 cond error', cond: "nope.nope.nope" },
    { speaker: 'SGT. UCHE', text: 'Pick one', sr: 'Pick one, senior', choices: [{ text: 'Branch A', next: 'core_x_branch' }, { text: 'Stay B' }] },
    { speaker: 'SGT. UCHE', text: 'L7 recruit after B', rec: 1 },
  ];
  DIALOGUE.core_x_branch = [{ speaker: 'SGT. UCHE', text: 'BR0', sr: 'BR0 senior' }, { speaker: 'SGT. UCHE', text: 'BR1 recruit', rec: 1 }];
  DIALOGUE.core_x_allskip = [{ speaker: 'SGT. UCHE', text: 'gone', cond: 'false' }, { speaker: 'SGT. UCHE', text: 'gone too', rec: 1 }];
};
/* play a synthetic conversation, recording each line shown; pick = 'A' | 'B' */
async function play(T, key, pick) {
  return T.ev(async ([key, pick]) => {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const shown = [], keys = []; let done = false, scriptKey = null;
    S.game.__coreFlag = 1;
    startDialogue(key, () => { done = true; });
    for (let k = 0; k < 40 && !done; k++) {
      const ov = document.getElementById('screen-dialogue'); if (!ov.classList.contains('show')) break;
      skipTypewriter();
      shown.push(document.getElementById('dlg-text').textContent); keys.push(V13.dlgKey());
      const ch = [...document.querySelectorAll('#dlg-choices .dialogue-choice')];
      if (ch.length) { const b = ch.find(x => x.textContent.includes(pick === 'A' ? 'Branch A' : 'Stay B')); b.click(); if (b.dataset.armed) b.click(); }
      else advanceDialogue();
      await wait(60);
      scriptKey = DLG.scriptKey;
    }
    return { shown, keys, done, picked: V13.picked(key), scriptKey, untouched: DIALOGUE.core_x_lines[2].text === 'L2 recruit text' && DIALOGUE.core_x_branch[0].text === 'BR0' && !DIALOGUE.core_x_lines[2]._s2sr };
  }, [key, pick]);
}
module.exports = async function (T) {
  const C = L.checks(T);
  await T.ev(SYN);
  // ---------- 1. the line fields ----------
  await L.senior(T);
  let r = await play(T, 'core_x_lines', 'A');
  T.log('senior A', JSON.stringify(r));
  C.check('LINES senior: rec skipped, sr text, cond true/false/error', JSON.stringify(r.shown) === JSON.stringify(['L0 always', 'L2 senior text', 'L3 cond true', 'Pick one, senior', 'BR0 senior']) && r.done, r.shown);
  C.check('LINES V13.picked on a line-field conversation', r.picked === 0, 'picked=' + r.picked);
  C.check('LINES V13.dlgKey names the branch; DLG.scriptKey keeps the start key', r.keys[r.keys.length - 1] === 'core_x_branch' && r.keys[1] === 'core_x_lines' && r.scriptKey === 'core_x_lines', r.keys.join(',') + ' / ' + r.scriptKey);
  C.check('LINES DIALOGUE itself is never changed', r.untouched, '');
  r = await play(T, 'core_x_lines', 'B');
  C.check('LINES senior B: trailing rec line skipped, the conversation ends', JSON.stringify(r.shown) === JSON.stringify(['L0 always', 'L2 senior text', 'L3 cond true', 'Pick one, senior']) && r.done && r.picked === 1, r.shown.concat(['picked=' + r.picked]));
  const lang0 = await T.ev(() => { const l = SETTINGS.lang; SETTINGS.lang = 'english'; return l; });
  r = await play(T, 'core_x_lines', 'A');
  C.check('LINES senior English: srEn', r.shown[1] === 'L2 senior en', r.shown[1]);
  await T.ev(l => { SETTINGS.lang = l; }, lang0);
  r = await T.ev(async () => { let done = false; startDialogue('core_x_allskip', () => { done = true; }); await new Promise(r => setTimeout(r, 200)); return { done, open: document.getElementById('screen-dialogue').classList.contains('show') }; });
  C.check('LINES a conversation whose every line is skipped ends at once', r.done && !r.open, r);
  await L.recruit(T);
  r = await play(T, 'core_x_lines', 'A');
  C.check('LINES recruit: every rec line, the plain text', JSON.stringify(r.shown) === JSON.stringify(['L0 always', 'L1 recruit only', 'L2 recruit text', 'L3 cond true', 'Pick one', 'BR0', 'BR1 recruit']) && r.picked === 0, r.shown);
  r = await play(T, 'core_x_lines', 'B');
  C.check('LINES recruit B', JSON.stringify(r.shown) === JSON.stringify(['L0 always', 'L1 recruit only', 'L2 recruit text', 'L3 cond true', 'Pick one', 'L7 recruit after B']) && r.picked === 1, r.shown);
  r = await T.ev(() => { const k = Object.keys(DIALOGUE).filter(k => !/^(m9|m10|m11|m12|m13|m13b|m14|m15|h9|h1[0-4]|hub2|s2|core_x|pw|cert|court|epi)/.test(k));
    let n = 0; for (const key of k) for (const l of DIALOGUE[key] || []) if (l && (l.rec != null || l.sr != null || l.cond != null)) n++; return n; });
  C.check('LINES Season 1 dialogue carries none of the fields', r === 0, 'lines=' + r);
  // V13.lineText: the same fields for a line that is radioed, texted or toasted (CORE-01)
  r = await T.ev(() => {
    const ls = [{ text: 'T plain' }, { text: 'T rec', rec: 1 }, { text: 'T cond', cond: 'false' }, { text: 'T err', cond: 'nope.nope' },
      { text: 'T rec text', textEn: 'T rec en', sr: 'T sr', srEn: 'T sr en' }, { text: 'T only', sr: 'T sr only' }, 'a string', null];
    const run = () => ls.map(l => V13.lineText(l));
    const d0 = S.game.difficulty, l0 = SETTINGS.lang, out = {};
    S.game.difficulty = 'senior'; SETTINGS.lang = 'pidgin'; out.sr = run(); SETTINGS.lang = 'english'; out.srEn = run();
    S.game.difficulty = 'recruit'; SETTINGS.lang = 'pidgin'; out.rec = run(); SETTINGS.lang = 'english'; out.recEn = run();
    S.game.difficulty = d0; SETTINGS.lang = l0; return out;
  });
  T.log('lineText', JSON.stringify(r));
  C.check('CORE-01 V13.lineText on Senior: rec/cond skipped (\'\'), sr; srEn in English (sr when there is none)',
    JSON.stringify(r.sr) === JSON.stringify(['T plain', '', '', '', 'T sr', 'T sr only', 'a string', '']) &&
    JSON.stringify(r.srEn) === JSON.stringify(['T plain', '', '', '', 'T sr en', 'T sr only', 'a string', '']), { sr: r.sr, srEn: r.srEn });
  C.check('CORE-01 V13.lineText on Recruit: rec lines play, text; textEn in English',
    JSON.stringify(r.rec) === JSON.stringify(['T plain', 'T rec', '', '', 'T rec text', 'T only', 'a string', '']) &&
    JSON.stringify(r.recEn) === JSON.stringify(['T plain', 'T rec', '', '', 'T rec en', 'T only', 'a string', '']), { rec: r.rec, recEn: r.recEn });
  // ---------- 2. Case 10 on Senior: toasts, radio lines, wayfinding (rt_tac) ----------
  await L.capture(T);
  await L.senior(T);
  const ok = await sc.s2start(T, 'm10');
  await L.senior(T);
  T.log('m10', ok);
  await sc.talk(T);
  await T.wait(800);
  let toasts = await L.got(T, 'toast');
  C.check('R11 Case 10 start toast on Senior', toasts.some(t => /UNDERCOVER — The market notices a man who stares at money\./.test(t)) && !toasts.some(t => /Find kiosk T4/.test(t)), toasts.slice(-3));
  let w = await L.where(T);
  C.check('RT04 o10_t4 on Senior resolves to the objective only (uiOnly)', w.obj === 'o10_t4' && w.uiOnly, w);
  await sc.use(T, 'Greet Mama Karo'); await sc.talk(T, [0, 0, 0]); await T.wait(600);
  w = await L.where(T);
  C.check('RT04 after Mama Karo, still no kiosk on Senior', w.uiOnly && !/blue kiosk/.test(w.label || ''), w);
  // the suspicion warning, radioed
  await T.ev(() => { const R = V13.rt; R.warnAt = -99; R.time = Math.max(R.time, 40); if (V13.rt.eyes) V13.rt.eyes.v = 0.7; });
  await T.wait(1200);
  let radio = await L.got(T, 'radio');
  C.check('R11 m10_x_warn on Senior', radio.includes('Sir, people are looking at you.'), radio.slice(-3));
  // the changer arrives. His radio lines go through the line fields (CORE-01): text gives line 2 an sr
  // (s2_dlg_a.js, wf_e40648b1-140-6); on a page without it the probe gives the same sr, and adds a Recruit-only
  // line and a cond-false line that must not be radioed.
  const arr = await T.ev(() => {
    const A = DIALOGUE.m10_lucky_arrives, had = A.some(l => l && l.sr != null);
    if (!had) A[1].sr = "Don't look up, sir. Look at your phone like you're losing at football.";
    A.push({ speaker: 'SGT. UCHE', text: 'PROBE recruit-only radio', rec: 1 }, { speaker: 'SGT. UCHE', text: 'PROBE cond-false radio', cond: 'false' });
    return { had, lines: A.map(l => ({ text: l.text, sr: l.sr == null ? null : l.sr, rec: !!l.rec, cond: l.cond || null })) };
  });
  const r0 = (await L.got(T, 'radio')).length;
  await T.ev(() => { V13.rt.time = 400; });
  await T.until(() => V13.rt.phase !== 'explore', 15000); await T.wait(600);
  const arrRadio = (await L.got(T, 'radio')).slice(r0);
  await T.ev(() => { const A = DIALOGUE.m10_lucky_arrives; while (A.length && /^PROBE /.test(A[A.length - 1].text || '')) A.pop(); });
  T.log('arrival radio', JSON.stringify({ sr_from_text: arr.had, radio: arrRadio }));
  const want = arr.lines.filter(l => !l.rec && !l.cond).map(l => l.sr != null ? l.sr : l.text);
  const srLines = arr.lines.filter(l => l.sr != null);
  C.check('CORE-01 Case 10 arrival radio on Senior: each line\'s sr, not its Recruit text; rec and cond-false lines not radioed',
    want.every(t => arrRadio.includes(t)) && srLines.length > 0 && !srLines.some(l => arrRadio.includes(l.text)) && !arrRadio.some(t => /^PROBE /.test(t)) &&
    !arrRadio.some(t => /Straight for the blue kiosk/.test(t)), { want, got: arrRadio });   // renamed: absent (the old Senior line must not be radioed)
  toasts = await L.got(T, 'toast');
  C.check('R12 the changer\'s toast on Senior', toasts.some(t => /SOMEONE ARRIVES — Rice sacks on a boy's head/.test(t)) && !toasts.some(t => /Watch him from 4 to 10/.test(t)), toasts.slice(-3));
  // the Recruit pointer is as before
  await L.recruit(T);
  await T.ev(() => { const o = (S.game.objectives || []).find(x => x.id === 'o10_t4'); if (o) o.done = false; if (typeof renderObjectives === 'function') renderObjectives(); });
  w = await T.ev(() => { WAY.invalidate(); const r = WAY.resolve(); const o = (S.game.objectives || []).find(x => x.id === 'o10_t4'); return { o10_t4: o && !o.done, kind: r && r.kind, uiOnly: !!(r && r.uiOnly), spec: typeof WAY.OBJ_TARGETS.m10.o10_t4 === 'function' ? JSON.stringify(WAY.OBJ_TARGETS.m10.o10_t4()) : 'none' }; });
  C.check('RT04 on Recruit the o10_t4 row is null (the old pointer)', w.spec === 'null', w);
  await T.ev(() => { V13.rt.warnAt = -99; if (V13.rt.eyes) V13.rt.eyes.v = 0.7; });
  await T.wait(1200);
  radio = await L.got(T, 'radio');
  C.check('R11 m10_x_warn on Recruit keeps the advice', radio.some(t => /Buy something\. Eat something\./.test(t)), radio.slice(-2));
  C.check('R11 m10_x_angle has its Senior line', await T.ev(() => DIALOGUE.m10_x_angle[0].sr === 'Four swipes so far, sir.'), '');
  C.check('CN21 Mama Tega at the buka', await T.ev(() => DIALOGUE.m10_x_buka_again[0].speaker === 'MAMA TEGA · BUKA' && V13.CAST.mamaefe.name === 'MAMA TEGA'), '');
  // ---------- 3. Case 11 on Senior ----------
  await L.senior(T);
  T.log('m11', await C11.start(T, "S.game.moralChoices.s2_statement='car'; S.game.difficulty='senior';"));
  await L.senior(T);
  C.check('RT04 o11_route on Senior is the objective only', await T.ev(() => { const f = WAY.OBJ_TARGETS.m11 && WAY.OBJ_TARGETS.m11.o11_route; return typeof f === 'function' && JSON.stringify(f()) === '{"ui":true}'; }), '');
  await C11.toCamp(T, 0, 'skip');
  await sc.talk(T);
  await C11.waitPhase(T, 'sneak', 120000);
  await T.wait(1500);
  radio = await L.got(T, 'radio');
  C.check('R11 m11_x_hint on Senior', radio.includes('Stay low, sir.') && !radio.some(t => /cooling drum is past the pit/.test(t)), radio.slice(-2));
  const hints = await L.got(T, 'hint');
  const ch = hints.find(h => h[0] === 'c11_crouch');
  C.check('R20 crouch hint on desktop follows the crouch mode', !!ch && (await T.ev(() => TAC.crouch.mode())) === 'hold' ? /^Hold <b>C<\/b>/.test(ch[1]) : !!ch && /^Press <b>C<\/b>/.test(ch[1]), ch);
  // the head marker over a boy who can see you. The stub camera projects every point as behind the camera, so an
  // on-screen point stands in for the projection (beta/wayfind.js WAY._testProject); the camp is kept from waking.
  const mk = await T.ev(async () => {
    const e = V13.rt.eyes, rate0 = e.rate; e.rate = 0.0001; e.v = 0.3;
    WAY._testProject = () => ({ x: 640, y: 300, behind: false });
    const w = e.watchers.find(x => x && x.visible); const P = ENGINE.player, out = [];
    try {
      for (let k = 0; k < 6; k++) {
        P.position.set(w.position.x + Math.sin(w.rotation.y) * 3.0, 0, w.position.z + Math.cos(w.rotation.y) * 3.0);
        await new Promise(r => setTimeout(r, 300));
        const m = V13.c11mark ? V13.c11mark() : null, el = document.querySelector('.c11-mark');
        out.push({ phase: V13.rt.phase, m, tf: el ? el.style.transform : null });
      }
      // and away from every boy: hidden again
      P.position.set(w.position.x + Math.sin(w.rotation.y) * 40, 0, w.position.z + Math.cos(w.rotation.y) * 40);
      await new Promise(r => setTimeout(r, 600));
      out.push({ away: true, m: V13.c11mark ? V13.c11mark() : null });
    } finally { delete WAY._testProject; e.rate = rate0; }
    return out;
  });
  T.log('marker', JSON.stringify(mk));
  const on = mk.filter(s => !s.away && s.phase === 'sneak' && s.m && s.m.el && s.m.el.shown);
  C.check('R16 Case 11 marker shown over the boy who can see you: the tactics head marker with icon(eye)/icon(alert), placed, no glyph sprite',
    on.length > 0 && on.every(s => s.m.el.ico && !s.m.sprite && /translate\(640px, 300px\)/.test(s.tf || '')), mk.slice(-3));
  const away = mk[mk.length - 1];
  C.check('R16 Case 11 marker hidden when no boy can see you', !!(away && away.m && away.m.el && away.m.el.shown === false), away);
  // R13: Senior casework on Relaxed pace: two misses fail the waybill book (the document's own rule), so it is weak
  await T.ev(() => { SETTINGS.difficulty = 'story'; V13.setFlag('s2_samples', 'sealed'); V13.done('o11_samples'); if (V13.rt.eyes) { V13.rt.eyes.v = 0; V13.rt.eyes.rate = 0; } });
  await C11.use(T, 'Read the waybill book');
  await C11.solve(T, 'm11_waybills', true); await T.wait(400); await C11.solve(T, 'm11_waybills', true);
  await T.wait(2500);
  const q = await T.ev(() => ({ q: (S.game.evQ || {}).waybill_book, miss: (S.game._docMiss || {}).m11_waybills, res: V13._docRes.m11_waybills }));
  C.check('R13 Case 11 reads the document\'s own outcome (Senior, Relaxed, 2 misses → weak)', q.q === 'weak' && q.res === 'failed', q);
  await T.ev(() => { SETTINGS.difficulty = 'standard'; });
  // R20 (touch): the sprint hint names our sprint button, which carries no RUN label (static: the built page's Case 11)
  const src = await T.ev(async () => { const t = await (await fetch('naceca.html')).text(); const i = t.indexOf('season2/s2_case11.js'); const s = t.slice(i, t.indexOf('season2/s2_case12.js')); return { sprint: s.includes("'Tap the sprint button to sprint.'"), run: s.includes('Tap <b>RUN</b>') }; });
  C.check('R20 the touch sprint hint: "Tap the sprint button to sprint."', src.sprint && !src.run, src);
  C.done();
};
