// tac_radio: radio priority, expiry and preemption built only from wraps (DESIGN §5.6, §2.1 F-B1/F-M2).
// Real clock, short lines. A stubbed V12.playVO records every line shown (v12_vo's _radioNext wrap calls it once per
// shown line), so the order, the count and the voice-over are measured together.
// Owner: Team A.
const T = require('./tactics_lib.cjs');
module.exports = async h => {
  await h.start('m1', { completed:['m0'] });
  await T.capture(h);
  const setup = await h.ev(() => {
    clearRadio();
    window.__R = { shows:[], stops:0 };
    V12.playVO = t => { const w = document.querySelector('#radio-sub .rs-who'); __R.shows.push({ t, at:performance.now(), who:w ? w.textContent : '' }); };
    V12.stopVO = () => { __R.stops++; };
    window.__sleep = ms => new Promise(r => setTimeout(r, ms));
    window.__reset = async () => { clearRadio(); await __sleep(450); __R.shows = []; __R.stops = 0; };
    return { full:TAC.radio.full, real:!!TAC.radio._real };
  });
  h.assert(setup.full === true && setup.real, 'TAC.radio.full once tac_radio.js has loaded');

  // 1 · plain lines keep first-in-first-out order and their durations
  const fifo = await h.ev(async () => {
    await __reset();
    radioLine('COMMANDER ADAEZE', 'plain-1', 500); radioLine('COMMANDER ADAEZE', 'plain-2', 500); radioLine('TEXT · TUNDE', 'plain-3', 500);
    await __sleep(2600);
    return __R.shows.map(s => s.t);
  });
  h.log('fifo', JSON.stringify(fifo));
  h.assert(JSON.stringify(fifo) === '["plain-1","plain-2","plain-3"]', 'plain lines are FIFO');

  // 2 · an existing Uche line (no opts) overtakes a queued bulletin
  const uche = await h.ev(async () => {
    await __reset();
    radioLine(RADIO_STATION, 'bulletin-1', 900); radioLine(RADIO_STATION, 'bulletin-2', 500); V12.say('SGT. UCHE', 'uche-1', 500);
    await __sleep(3200);
    return __R.shows.map(s => s.t);
  });
  h.log('uche over news', JSON.stringify(uche));
  h.assert(JSON.stringify(uche) === '["bulletin-1","uche-1","bulletin-2"]', 'a SGT. UCHE line goes ahead of a queued bulletin');

  // 3 · preemption: bulletin, bulletin, text, then a pri-3 keyed line 1.3 s later → news-1, urgent, text-1, news-2,
  //     nothing twice, nothing cut short (the stale timer of the cut bulletin is swallowed)
  const pre = await h.ev(async () => {
    await __reset();
    const t0 = performance.now();
    radioLine(RADIO_STATION, 'news-1', 3000); radioLine(RADIO_STATION, 'news-2', 1200); radioLine('TEXT · TUNDE', 'text-1', 1200);
    await __sleep(1300);
    TAC.radio.say('SGT. UCHE', 'urgent', { key:'uche_call', ms:2500 });
    const probe = [];
    for (const at of [2900, 3150, 3400, 3700]) {
      await __sleep(Math.max(0, at - (performance.now() - t0)));
      const el = document.getElementById('radio-sub');
      probe.push({ at, show:!!(el && el.classList.contains('show')), text:el && el.querySelector('.rs-text') ? el.querySelector('.rs-text').textContent : null });
    }
    await __sleep(4200);
    return { shows:__R.shows.map(s => ({ t:s.t, at:Math.round(s.at - t0) })), stops:__R.stops, probe, n:document.querySelectorAll('#radio-sub').length };
  });
  h.log('preempt', JSON.stringify(pre));
  const order = pre.shows.map(s => s.t);
  h.assert(JSON.stringify(order) === '["news-1","urgent","text-1","news-2"]', 'shows news-1, urgent, text-1, news-2: ' + JSON.stringify(order));
  const at = k => pre.shows.find(s => s.t === k).at;
  h.assert(at('urgent') >= 1250 && at('urgent') < 1500, 'the urgent line cuts the bulletin at once (it had been up 1.2 s): ' + at('urgent'));
  h.assert(at('text-1') - at('urgent') >= 2500 + 200, 'the urgent line keeps its full time (stale-timer guard): ' + (at('text-1') - at('urgent')) + ' ms');
  h.assert(at('news-2') - at('text-1') >= 1200 + 200, 'text-1 keeps its full time');
  h.assert(pre.probe.every(p => p.show && p.text === 'urgent'), 'the urgent strip stays up through the cut bulletin\'s old end (3.0 / 3.26 s)');
  h.assert(pre.stops >= 1, 'V12.stopVO() on the cut');
  h.assert(pre.n === 1, 'one #radio-sub in the page after the swap');

  // 4 · expiry and de-duplication of keyed lines
  const exp = await h.ev(async () => {
    await __reset();
    radioLine('COMMANDER ADAEZE', 'long-3s', 3000);
    TAC.radio.say('SGT. UCHE', 'stale-call', { key:'k_ttl', ttl:500, ms:600 });
    await __sleep(3800);
    const a = __R.shows.map(s => s.t);
    await __reset();
    radioLine('COMMANDER ADAEZE', 'long-2s', 1800);
    TAC.radio.say('SGT. UCHE', 'dup-1', { key:'k_dup', pri:2, ms:500 });
    TAC.radio.say('SGT. UCHE', 'dup-2', { key:'k_dup', pri:2, ms:500 });
    await __sleep(3000);
    const b = __R.shows.map(s => s.t);
    await __reset();
    radioLine('COMMANDER ADAEZE', 'long-1s', 1200);
    TAC.radio.say('SGT. UCHE', 'cancel-me', { key:'k_cancel', pri:2, ms:500 });
    TAC.radio.cancel('k_cancel');
    await __sleep(1800);
    const c = __R.shows.map(s => s.t);
    return { a, b, c };
  });
  h.log('expiry', JSON.stringify(exp));
  h.assert(JSON.stringify(exp.a) === '["long-3s"]', 'a 500 ms-ttl keyed line behind a 3 s line is dropped (never plays late)');
  h.assert(JSON.stringify(exp.b) === '["long-2s","dup-2"]', 'the same key twice shows once');
  h.assert(JSON.stringify(exp.c) === '["long-1s"]', 'TAC.radio.cancel(key) removes a queued keyed line');
  const ev = (await T.events(h, 'radio')).map(e => e[1]);
  h.log('radio events', JSON.stringify(ev.map(e => [e.key, e.outcome, e.pri])));
  h.assert(ev.some(e => e.key === 'k_ttl' && e.outcome === 'dropped'), 'the expired line logs radio{outcome:"dropped"}');
  h.assert(ev.some(e => e.key === 'k_dup' && e.outcome === 'replaced') && ev.filter(e => e.key === 'k_dup' && e.outcome === 'shown').length === 1, 'the duplicate logs "replaced" and shows once');
  h.assert(ev.some(e => e.key === 'uche_call' && e.outcome === 'shown' && e.pri === 3 && typeof e.waitMs === 'number'), 'the urgent line logs radio{shown, pri 3, waitMs}');
  h.assert(ev.some(e => e.key === 'k_cancel' && e.outcome === 'cancelled'), 'cancel logs "cancelled"');
  h.assert(ev.every(e => e.key != null), 'only keyed lines are logged');

  // 5 · clearRadio stops the timer: the next line keeps its full time
  const clr = await h.ev(async () => {
    await __reset();
    const t0 = performance.now();
    radioLine('COMMANDER ADAEZE', 'cleared', 2000);
    await __sleep(500); clearRadio(); await __sleep(100);
    radioLine('COMMANDER ADAEZE', 'after-clear', 3000);
    await __sleep(2500 - (performance.now() - t0));
    const el = document.getElementById('radio-sub');
    const mid = { show:!!(el && el.classList.contains('show')), text:el && el.querySelector('.rs-text') ? el.querySelector('.rs-text').textContent : null, q:RADIO.queue.length, busy:RADIO.busy };
    await __sleep(1400);
    return { mid, shows:__R.shows.map(s => s.t) };
  });
  h.log('clearRadio', JSON.stringify(clr));
  h.assert(clr.mid.show && clr.mid.text === 'after-clear' && clr.mid.busy, 'after clearRadio the next line is still up past the cleared line\'s old end');
  h.assert(JSON.stringify(clr.shows) === '["cleared","after-clear"]', 'nothing shows twice after clearRadio');

  // 6 · story lines never expire: a 160-char bulletin, then the shrine line (dialogue_system.js:168): both show
  const story = await h.ev(async () => {
    await __reset();
    const s160 = ('WAVE24 NEWS. Traders at Computer Village say a new phone-unlock racket is moving stolen handsets faster than police can trace them. More at the hour, stay tuned.').padEnd(160, '.').slice(0, 160);
    radioLine(RADIO_STATION, s160, Math.max(4200, s160.length * 52));
    radioLine('SGT. UCHE', "Pots are on the altar left of the door. The cache is round the back — go wide of that fire.");
    await __sleep(9000);
    return { len:s160.length, shows:__R.shows.map(s => s.t.slice(0, 24)) };
  });
  h.log('story', JSON.stringify(story));
  h.assert(story.shows.length === 2 && /^Pots are on the altar/.test(story.shows[1]), 'a 160-char bulletin, then the shrine line: both show');

  // 7 · the night phone call still reads OVERHEARD (v12_night.js:240 renders inside our chain)
  const night = await h.ev(async () => {
    await __reset();
    V12.say('COMMANDER ADAEZE · ON THE PHONE', '…Yes, sir. Lekki is done. Obi is in custody.', 900);
    await __sleep(150);
    const w = document.querySelector('#radio-sub .rs-who');
    return { who:w ? w.textContent : null, vo:__R.shows.length };
  });
  h.log('night', JSON.stringify(night));
  h.assert(night.who && /OVERHEARD · ON THE PHONE/.test(night.who), 'the night phone line renders "OVERHEARD · ON THE PHONE"');
  h.assert(night.vo === 1, 'V12.playVO once for the shown line');
  await h.ev(async () => { await __reset(); });
  h.assert(!h.errors.length, 'no page errors');
};
