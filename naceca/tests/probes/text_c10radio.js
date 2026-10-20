// text team: R12 played, not read (the review's rv_text_c10radio, TX2). Plays Case 10 on Senior (the default) up to
// the first cash-outs and records everything Uche RADIOS (window.radioLine) and the hand-over text. Senior must not
// hear which kiosk Lucky walks to ("Straight for the blue kiosk"), nor read "blue board, beside an herb stall".
// Case 10 radios m10_lucky_arrives line by line with each line's plain text (s2_case10.js), so a line's `sr` never
// reaches the radio. Run: run_probe.sh <build> text_c10radio desktop <log> (about 4 minutes on the stub).
// It drives the case with the kit's c10_lib.js, loaded from the harness that runs it (t_s2.js's own probes/ folder).
// (An ES module: the repo's package.json says "type":"module".)
import { createRequire } from 'node:module';
import path from 'node:path';
const kitRequire = createRequire(path.resolve(process.argv[1] || '.'));
const probe = async function (T) {
  let pass = 0, total = 0;
  const check = (id, ok, d) => { total++; if (ok) pass++; console.log(`CHECK ${id} ${ok ? 'PASS' : 'FAIL'} ${typeof d === 'string' ? d : JSON.stringify(d)}`.slice(0, 900)); };
  const L = kitRequire('./probes/c10_lib.js'), sc = L.sc;
  await L.start(T, 'senior');
  const hooked = await T.ev(() => {
    window.__radio = []; window.__lines = [];
    const o = window.radioLine; window.radioLine = function (sp, t) { try { window.__radio.push(String(sp) + ': ' + String(t)); } catch (e) {} return o.apply(this, arguments); };
    const r = window.renderDialogueLine; window.renderDialogueLine = function () { const out = r.apply(this, arguments); try { const l = DLG.script && DLG.script[DLG.idx]; if (l) window.__lines.push((DLG.scriptKey || '') + ' · ' + (l.speaker || '') + ': ' + (l.text || '')); } catch (e) {} return out; };
    return { mode: (typeof isRecruit === 'function' && isRecruit()) ? 'recruit' : 'senior', wrap: typeof V13.lineFields === 'function' };
  });
  T.log('hooked', JSON.stringify(hooked));
  await L.talkWhen(T);                                   // the intro (ends with the analyst's TEXT)
  await L.fast(T);
  await T.wait(1200);
  await L.until(T, "V13.c10().uche === 'charging'", 120000, 'uche at the charging stand');
  await sc.use(T, 'blue kiosk'); await sc.talk(T);
  await L.until(T, "V13.c10().phase === 'arrive'", 240000, 'arrival');
  await T.ev(() => { ENGINE.player.position.set(2.6, 0, 4.0); });
  await L.until(T, "V13.rt.lucky && V13.rt.lucky.position.z < 8", 240000, 'lucky in the lane');
  await L.until(T, "V13.c10().phase === 'cashout'", 240000, 'at T4');
  await T.wait(4000);
  const got = await T.ev(() => ({ radio: window.__radio.slice(), lines: window.__lines.filter(x => /m10_intro|TEXT/.test(x)) }));
  got.radio.forEach(x => T.log('  RADIO', x.slice(0, 200)));
  got.lines.forEach(x => T.log('  LINE', x.slice(0, 200)));
  const intro = got.lines.filter(x => /TEXT ·/.test(x));
  const arrive = got.radio.filter(x => /^SGT\. UCHE: (Road side|He's coming in)/.test(x));
  check('setup', hooked.mode === 'senior' && got.radio.length > 0 && intro.length > 0 && arrive.length >= 2, `${got.radio.length} radio lines (${arrive.length} of the arrival), ${intro.length} hand-over text(s), mode ${hooked.mode}, core wrap ${hooked.wrap}`);
  check('R11/intro-text-senior', intro.length > 0 && intro.every(x => !/blue board|herb stall/i.test(x)), intro.join(' | ').slice(0, 300));
  const kiosk = got.radio.filter(x => /blue kiosk/i.test(x)).concat(arrive.filter(x => /kiosk|\bT4\b|blue board/i.test(x)));
  check('R12/uche-radio-senior', kiosk.length === 0, kiosk.length ? 'Senior still hears: ' + kiosk.join(' | ') : 'no kiosk in the radio: ' + arrive.join(' | '));
  console.log(`CHECKS ${pass}/${total}`);
};
export { probe as 'module.exports' };
