// tac_m3_log: the M3 events against the contract (DESIGN §4): enc m3_entry / m3_obi / m3_laptop / m3_child, order,
// ally_done and m3_summary (once, from the completeMission('m3') wrap), with the emitters' enums; no per-state
// event type, no seen{level:'calm'}, no knock/loud seen causes; every event ≤ 1500 chars; nothing per tick in
// S.game.flags (progressSig() changes only at outcomes).
// Owner: Team C.
const L = require('./tac_m3_lib.cjs');

const IN = (v, list) => list.includes(v);
const NUM = v => typeof v === 'number' && isFinite(v);
const BOOL = v => typeof v === 'boolean';
const SHAPE = {
  m3_entry:e => IN(e.entry, ['knock', 'loud', 'quiet']) && IN(e.door, ['front', 'gate']) && IN(e.power, ['on', 'cut']) && IN(e.uche, ['with', 'rear']) && e.leak === false
    && BOOL(e.armed) && Array.isArray(e.spawn) && e.spawn.length === 2 && NUM(e.wipeTotal) && IN(e.variant, ['v8', 'legacy'])
    && e.prep && ['sims', 'kcFair', 'tip', 'civ', 'warrant'].every(k => BOOL(e.prep[k])) && e.def && BOOL(e.def.entry) && BOOL(e.def.power),
  m3_obi:e => IN(e.outcome, ['cold', 'beat_thumb', 'stun_grab', 'intercepted', 'covered', 'cornered', 'tackled', 'perimeter']) && IN(e.by, ['kelechi', 'uche', 'perimeter'])
    && IN(e.alertedBy, ['sight', 'noise', 'close', 'knock', 'loud', null]) && NUM(e.secs) && (e.runSecs === null || NUM(e.runSecs)) && NUM(e.ranM) && NUM(e.dist)
    && BOOL(e.duringMinigame) && Array.isArray(e.states) && e.states.length <= 8 && e.states.every(s => typeof s[0] === 'string' && NUM(s[1]))
    && (e.ucheJob === null || IN(e.ucheJob, ['cover', 'take_child', 'tackle'])) && e.prep && BOOL(e.prep.kcFair),
  m3_laptop:e => IN(e.outcome, ['never_started', 'halted', 'lost', 'abandoned']) && NUM(e.pct) && NUM(e.files) && BOOL(e.ledger) && (e.total === null || NUM(e.total))
    && (e.firstAt === null || NUM(e.firstAt)) && (e.armedAt === null || NUM(e.armedAt)) && BOOL(e.mg),
  m3_child:e => IN(e.choice, ['gentle', 'stay', null]) && IN(e.by, ['kelechi', 'uche', null]) && BOOL(e.calm) && NUM(e.outAt) && BOOL(e.gentle),
};
const ORDER = e => e.who === 'uche' && IN(e.order, ['cover', 'take_child']) && IN(e.src, ['button', 'key']) && BOOL(e.ok) && (e.ok || IN(e.why, ['busy', 'no_sight', 'running', 'unaware']))
  && e.def === false && typeof e.obi === 'string' && NUM(e.t) && 'obj' in e;
const ALLY = e => e.who === 'uche' && IN(e.task, ['cover_held', 'escort', 'tackle']) && IN(e.outcome, ['done', 'cancelled']) && NUM(e.secs);
const SUMMARY = e => IN(e.entry, ['knock', 'loud', 'quiet']) && IN(e.door, ['front', 'gate']) && IN(e.spawn, ['front', 'corridor']) && e.obi && 'outcome' in e.obi && 'alertedBy' in e.obi
  && e.seen && NUM(e.seen.notices) && NUM(e.seen.alarms) && e.wipe && 'outcome' in e.wipe && e.child && 'choice' in e.child && e.uche && Array.isArray(e.uche.orders) && Array.isArray(e.uche.acts)
  && e.extract && NUM(e.extract.refusals) && Array.isArray(e.extract.missing) && e.prep && NUM(e.secs) && NUM(e.force) && NUM(e.trust) && e.diff && Array.isArray(e.hints);

const check = async (h, label) => {
  const ev = await L.ev(h);
  const bad = [];
  for (const [t, d] of ev) {
    const len = JSON.stringify(d).length;
    if (len > 1500) bad.push(`${t} is ${len} chars`);
    if (t === 'enc' && SHAPE[d.enc] && !SHAPE[d.enc](d)) bad.push('enc ' + d.enc + ' ' + JSON.stringify(d));
    if (t === 'order' && !ORDER(d)) bad.push('order ' + JSON.stringify(d));
    if (t === 'ally_done' && !ALLY(d)) bad.push('ally_done ' + JSON.stringify(d));
    if (t === 'm3_summary' && !SUMMARY(d)) bad.push('m3_summary ' + JSON.stringify(d));
    if (t === 'seen' && (d.level === 'calm' || IN(d.cause, ['knock', 'loud']))) bad.push('seen ' + JSON.stringify(d));
    if (t === 'm3_obi' || t === 'm3_wipe_armed' || t === 'm3_breach') bad.push('a per-state event type: ' + t);
  }
  h.log(label, 'events:', ev.map(e => e[0] + (e[1].enc ? ':' + e[1].enc : '')).join(' '));
  h.assert(!bad.length, label + ': every event matches the contract: ' + bad.join(' | '));
  return ev;
};

module.exports = async h => {
  try {
    // ---------- knock, stand still: the perimeter; the gentle choice; the laptop halted; extraction ----------
    await L.v8(h);
    await L.breach(h, { entry:'knock' });
    const sigRun = await h.ev(() => { const R = TAC.m3.run(), seen = new Set(); __m3.run(13, () => { seen.add(progressSig()); return R.obi.state === 'perimeter'; }); return { n:seen.size, obi:R.obi.state }; });
    h.log('progressSig through the run', JSON.stringify(sigRun));
    h.assert(sigRun.obi === 'perimeter' && sigRun.n === 1, 'progressSig() never changed through the knock, the run and the perimeter (no per-tick flags): ' + sigRun.n);
    await h.ev(() => { ENGINE.player.position.x = 0.9; ENGINE.player.position.z = 8.0; });
    await L.arrest(h, 0);
    await L.childTalk(h, 0);
    await h.ev(() => __m3.run(10, () => TAC.m3.child().state === 'out'));
    await L.laptop(h);
    await L.extract(h, 900);
    await h.ev(() => { completeMission('m3'); });          // a second completion logs no second summary
    await h.step(200);
    let ev = await check(h, 'knock/perimeter');
    const sum = ev.filter(e => e[0] === 'm3_summary').map(e => e[1]);
    h.log('m3_summary', JSON.stringify(sum));
    h.assert(sum.length === 1, 'm3_summary exactly once');
    h.assert(sum[0].obi.outcome === 'perimeter' && sum[0].obi.alertedBy === 'knock' && sum[0].wipe.outcome === 'halted' && sum[0].child.choice === 'gentle' && sum[0].child.out === true
      && sum[0].spawn === 'front' && sum[0].variant === 'v8' && typeof sum[0].grade === 'string', 'the summary carries the outcomes');
    const encs = ev.filter(e => e[0] === 'enc').map(e => e[1].enc);
    h.assert(['m3_entry', 'm3_obi', 'm3_laptop', 'm3_child'].every(k => encs.filter(x => x === k).length === 1), 'one of each enc: ' + encs.join(','));
    await L.restore(h);

    // ---------- quiet front: a crouched sneak changes nothing; cold grab; seizure; Uche takes her out ----------
    await L.v8(h, { state:L.state('tip') });
    await L.breach(h, { entry:'quiet' });
    const sneak = await h.ev(() => { const seen = new Set(); __m3.walk([[0.4,4.9],[0.5,2.6],[3.6,2.7],[3.9,1.5]], 1.25, { crouch:true, stop:() => { seen.add(progressSig()); return false; } });
      return { n:seen.size, obi:TAC.m3.obi().state }; });
    h.assert(sneak.n === 1 && sneak.obi === 'unaware', 'progressSig() unchanged through a sneak (the watcher writes nothing to S.game.flags)');
    // Q while he is unaware (civilians known): TAKE HER OUT is shown, and refused, with why 'unaware'
    await h.ev(() => { window.dispatchEvent(new KeyboardEvent('keydown', { code:'KeyQ', key:'q', bubbles:true })); });
    await h.ev(() => { const it = ENGINE.interactables.find(i => i.label === 'Move on suspect'); it.onInteract(it); });
    await h.step(100); await L.finishDialogue(h); await L.choose(h, 0); await L.finishDialogue(h);
    await L.laptop(h);
    await h.ev(() => { TAC.m3.order('take_child', 'button'); const R = TAC.m3.run(); __m3.run(25, () => R.child.state === 'out' && !R.uche.job); });
    await L.extract(h, 900);
    ev = await check(h, 'quiet/cold');
    const ord = ev.filter(e => e[0] === 'order').map(e => e[1]);
    h.assert(ord.length === 2 && ord[0].order === 'take_child' && !ord[0].ok && ord[0].why === 'unaware' && ord[0].src === 'key'
      && ord[1].order === 'take_child' && ord[1].ok && ord[1].src === 'button', 'Q while unaware: refused (why unaware, src key); TAKE HER OUT after the cold grab: ok: ' + JSON.stringify(ord));
    h.assert(ev.some(e => e[0] === 'ally_done' && e[1].task === 'escort'), 'ally_done{escort}');
    const lap = ev.filter(e => e[0] === 'enc' && e[1].enc === 'm3_laptop').map(e => e[1]);
    h.assert(lap.length === 1 && lap[0].outcome === 'never_started', 'm3_laptop{never_started}');
    const ob = ev.filter(e => e[0] === 'enc' && e[1].enc === 'm3_obi').map(e => e[1]);
    h.assert(ob.length === 1 && ob[0].outcome === 'cold' && ob[0].alertedBy === null && ob[0].by === 'kelechi', 'm3_obi{cold, alertedBy:null}');
    await L.restore(h);

    // ---------- Squad Trust: the tackle; abandoned laptop at extraction ----------
    await L.v8(h, { state:L.state('squad') });
    await L.breach(h, { entry:'knock', uche:'rear' });
    await h.ev(() => { const R = TAC.m3.run(); __m3.run(8, () => !!R.obi.outcome); const o = R.M.obi.position; ENGINE.player.position.x = o.x; ENGINE.player.position.z = o.z + 1.2; });
    await L.arrest(h, 0);
    await L.childTalk(h, 0);
    await h.ev(() => __m3.run(10, () => TAC.m3.child().state === 'out'));
    await L.extract(h, 2200);
    ev = await check(h, 'rear/tackle');
    h.assert(ev.some(e => e[0] === 'ally_done' && e[1].task === 'tackle' && e[1].outcome === 'done'), 'ally_done{tackle}');
    const ab = ev.filter(e => e[0] === 'enc' && e[1].enc === 'm3_laptop').map(e => e[1]);
    h.assert(ab.length === 1 && ab[0].outcome === 'abandoned', 'm3_laptop{abandoned} when he leaves the laptop: ' + JSON.stringify(ab));
    // the radio lines are keyed (A's radio logs them)
    const radio = ev.filter(e => e[0] === 'radio').map(e => e[1].key);
    h.log('radio keys', JSON.stringify(radio));
    h.assert(!h.errors.length, 'no page errors: ' + h.errors.join(' | '));
  } finally { await L.restore(h); }
};
