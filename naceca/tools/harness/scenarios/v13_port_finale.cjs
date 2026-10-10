// v13 port · tools/finale_test.py with the INTEGRATED semantics: Mission 8 down every planned route, the
// accusation filed on the beta's paper charge sheet (WHO · METHOD · MONEY TRAIL · three pieces of
// evidence, two taps), finaleResolve reading that sheet, and — where the case goes that far — the v13 trial
// (proven / contested), the epilogue and the case review before the title screen.
// The eight cases the drop planned (docs/SYNC-2026-10-07-finale.md):
//   A front gate · A back gate via Musa · B tail with KC fair · B courier lost · C calm call ·
//   C push too hard · A proven + epilogue (trial, review) · C unproven + epilogue (no trial, review)
// Route B's tail is walked frame by frame (wayfind_lib's stepper: the three.js stub's clock is frozen):
// six metres behind the courier, crouching whenever she looks back; "lost" stands twenty metres off.
// FT_CASES='A front,C calm' picks cases by name (default: all eight).
const LIB = require('./v13_port_lib.cjs');
const PRE_M8 = ['m0', 'm1', 'm2', 'm3', 'm3n', 'm4', 'm5', 'm6', 'm7', 't7'];
const EV = (id, name) => ({ id, name, xp:0 });
const CASES = [
  { name:'A front gate', mc:{ tower:'hold' }, expect:{ route:'A', inside:'front', osas:'safe' } },
  { name:'A back gate via Musa', mc:{ tower:'hold', checkpoint:'flip_driver' }, back:true, expect:{ route:'A', inside:'back', osas:'safe' } },
  { name:'B tail with KC fair', mc:{ tower:'extract', market_runner:'caught', choice:'detain' }, kc:true, follow:true, expect:{ route:'B', kc:true, courier:true, warned:false, inside:'front', osas:'safe' } },
  { name:'B courier lost', mc:{ tower:'extract', market_runner:'escaped' }, follow:false, expect:{ route:'B', kc:false, courier:false, warned:true, inside:'front', osas:'hurt' } },
  { name:'C calm call', mc:{ tower:'cut_power' }, k:0, expect:{ route:'C', recording:true, warned:false, inside:'front', osas:'safe' } },
  { name:'C push too hard', mc:{ tower:'cut_power' }, k:2, expect:{ route:'C', recording:false, hungUp:true, warned:true, inside:'front', osas:'hurt' } },
  { name:'A proven + epilogue', mc:{ tower:'hold', asaba:'rescue' }, ev:[EV('tower_cdr', 'Call Records — Ugbowo Cell'), EV('tower_fix', 'Handset Fix — Ekosodin')], reveal:1, epilogue:true, prep:true,
    expect:{ route:'A', inside:'front', outcome:'proven', court:true } },
  { name:'C unproven + epilogue', mc:{ tower:'cut_power' }, k:0, method:'ransom', money:'pos', epilogue:true, expect:{ route:'C', recording:true, outcome:'unproven', court:false } },
];

module.exports = async h => {
  const P = LIB.lib(h), B = P.B, C = P.C, WF = P.WF;
  const pick = (process.env.FT_CASES || '').split(',').map(s => s.trim()).filter(Boolean);
  const cases = pick.length ? CASES.filter(c => pick.some(p => c.name.startsWith(p))) : CASES;
  const vp = await h.ev(() => innerWidth + 'x' + innerHeight + (document.body.classList.contains('touch-active') ? '_touch' : ''));
  const out = [];
  for(const cs of cases){
    h.log(`\n--- ${cs.name} (${vp}) ---`);
    await WF.boot(h);
    await h.ev(cs => { window.__portCase = cs; }, cs);
    const atM8 = await P.start('m8', { completed:PRE_M8, state:S => {
      const cs = window.__portCase;
      Object.assign(S.game.moralChoices, cs.mc || {}); Object.assign(S.game.flags, cs.flags || {});
      if(cs.ev) S.game.evidence = (S.game.evidence || []).concat(cs.ev);       // carried in from earlier cases
    } });
    h.assert(atM8, cs.name + ': M8 begins');
    await WF.stepper(h);
    const r = { name:cs.name, route:await h.ev(() => finaleRoute()), v13warned:await h.ev(() => !!S.game._finWarned) };
    await P.use('Brief with Sgt. Uche'); await P.talk(0);
    if(r.route === 'B'){
      if(cs.kc){ r.kcHere = await P.use('Talk to KC'); await P.talk(0); }
      r.tail = await h.ev(follow => {
        const c0 = TAIL.active; if(!c0) return { active:false };
        const p = ENGINE.player.position;
        const n = __wf.run(90, () => {
          const c = TAIL.active; if(!c) return true;
          if(follow){ const t = c.target, yaw = t.rotation.y; p.x = t.position.x - Math.sin(yaw) * 6.2; p.z = t.position.z - Math.cos(yaw) * 6.2; ENGINE.keys.KeyC = c.lookT > 0; }
          else { p.x = -20; p.z = 8; }
        });
        ENGINE.keys.KeyC = false;
        return { active:!!TAIL.active, secs:+(n / 60).toFixed(1), susp:Math.round(c0.susp), seg:c0.seg };
      }, !!cs.follow);
      await P.talk(0);
    }
    if(r.route === 'C'){ await P.use('Take the call in the van'); r.call = await P.talk(cs.k || 0); await P.talk(0); }
    if(cs.back){ await P.use('Try the back gate'); await P.talk(0); }
    if(!(await h.ev(() => S.game._finInside))){ await P.use('Breach the front gate'); await P.talk(0); }
    await P.use('Free Osas'); await P.talk(0);
    const sheet = await P.waitShown('screen-accuse', { timeout:4000 });
    h.assert(sheet, cs.name + ': the accusation sheet opens before she arrives');
    const sh = await h.ev(() => ({ secs:[...document.querySelectorAll('#screen-accuse .cw-sec')].map(s => s.dataset.sec), acc:document.querySelectorAll('#screen-accuse .acc-card').length,
      ev:[...document.querySelectorAll('#screen-accuse [data-k="ev"]')].map(b => b.dataset.v), strong:Object.keys(V12.strongAgainstAdaeze()) }));
    const evs = sh.ev.filter(id => sh.strong.includes(id)).concat(sh.ev.filter(id => !sh.strong.includes(id))).slice(0, 3);
    await B.pick('screen-accuse', 'who', 'adaeze');
    await B.pick('screen-accuse', 'method', cs.method || 'shield');
    await B.pick('screen-accuse', 'money', cs.money || 'ca');
    for(const id of evs) await B.pick('screen-accuse', 'ev', id);
    await B.fileTwice('screen-accuse');
    r.filed = await h.ev(() => { const a = S.game.accusations.voice; return a ? { suspect:a.suspect, method:a.method, money:a.money, ok:a.ok, picks:a.picks } : null; });
    r.reveal = await h.ev(() => DLG.scriptKey);
    await P.talk(cs.reveal || 0);                                        // the reveal, then finaleResolve's ending
    await P.talk(0);
    const af = await P.waitShown('screen-aftermath', { timeout:5000 });
    Object.assign(r, await h.ev(() => ({ outcome:S.game.moralChoices.finale, osas:S.game.flags.fin_osas, inside:S.game._finInside || null, kc:!!S.game._finKC,
      courier:!!S.game._finCourierPhone, recording:!!S.game._finRecording, hungUp:!!S.game._finHungUp, warned:!!S.game._finWarned, risk:S.game._finRisk || 0,
      bodycam:!!(S.game.flags || {}).fin_bodycam, completed:S.game.completedMissions.includes('m8'), headline:(document.querySelector('.headline-block .head') || {}).textContent || '',
      next:(document.getElementById('aftermath-grid') || {}).textContent || '', acc:!!S.game._acc, objs:(S.game.objectives || []).map(o => (o.done ? '+' : '.') + o.id).join(' ') })));
    r.aftermath = !!af;
    r.sheet = sh;
    // ---- what the case says, as the drop's test asserted it ----
    const E = cs.expect;
    h.log(JSON.stringify({ route:r.route, outcome:r.outcome, osas:r.osas, inside:r.inside, kc:r.kc, courier:r.courier, recording:r.recording, warned:r.warned, tail:r.tail, picks:r.filed && r.filed.picks, headline:r.headline }));
    h.log('   ' + r.objs);
    h.assert(r.route === E.route, cs.name + ': route ' + E.route);
    h.assert(!r.v13warned, cs.name + ': v13 warns the house only on deliberate leaks (alert ≥ 2): not here');
    h.assert(JSON.stringify(sh.secs) === '["who","method","money","ev"]' && sh.acc === 0, cs.name + ': the beta\'s paper sheet (WHO, METHOD, MONEY TRAIL, evidence), not v12\'s fallback cards');
    h.assert(r.filed && r.filed.suspect === 'adaeze' && r.filed.ok.suspect && r.filed.picks.length === Math.min(3, sh.ev.length), cs.name + ': the sheet is on the file (CW.file)');
    h.assert(r.reveal === 'fin_reveal_run', cs.name + ': the reveal follows the filing');
    h.assert(r.aftermath && r.completed && /\+o5_voice/.test(r.objs), cs.name + ': the case reaches the aftermath (finaleResolve)');
    h.assert(r.inside === E.inside || E.inside == null, cs.name + ': way in ' + E.inside + ' (got ' + r.inside + ')');
    if(E.osas) h.assert(r.osas === E.osas, cs.name + ': Osas ' + E.osas + ' (hurt only when the house was warned and you went in loud)');
    if(E.kc != null) h.assert(r.kc === E.kc, cs.name + ': KC at the kiosk ' + (E.kc ? 'points her out' : 'is not there'));
    if(E.courier != null) h.assert(r.courier === E.courier && r.tail && !r.tail.active, cs.name + (E.courier ? ': tailed to the gate unseen: the courier\'s phone' : ': the courier is lost; no phone'));
    if(E.recording != null) h.assert(r.recording === E.recording, cs.name + (E.recording ? ': the trace locks: the call is recorded' : ': the call dies short of a lock'));
    if(E.hungUp != null) h.assert(r.hungUp === E.hungUp, cs.name + ': pushing too hard hangs up the call');
    if(E.warned != null) h.assert(r.warned === E.warned, cs.name + ': the house ' + (E.warned ? 'is warned' : 'is not warned'));
    if(r.courier) h.assert(sh.strong.includes('fin_courier_phone') && r.filed.picks.includes('fin_courier_phone'), cs.name + ': the courier\'s phone counts against her');
    if(r.recording) h.assert(sh.strong.includes('fin_recording'), cs.name + ': the recording counts against her');
    if(E.outcome) h.assert(r.outcome === E.outcome, cs.name + ': outcome ' + E.outcome + ' (got ' + r.outcome + ')');
    // the beta's rule (v12_finale.js): the right name's strong picks, +1 body-cam, −1 per wrong METHOD / MONEY line
    const s = Math.max(0, r.filed.picks.filter(id => sh.strong.includes(id)).length + (r.bodycam ? 1 : 0) - (r.filed.ok.method ? 0 : 1) - (r.filed.ok.money ? 0 : 1));
    h.assert(r.outcome === (s >= 3 ? 'proven' : s === 2 ? 'contested' : 'unproven'), cs.name + ': finaleResolve reads the filed sheet (score ' + s + ' → ' + r.outcome + ')');
    if(r.outcome === 'proven' || r.outcome === 'contested') h.assert(/trial/i.test(r.next), cs.name + ': the aftermath says the trial comes before the epilogue');
    // ---- the epilogue cases: trial (if any), epilogue, review, title ----
    if(cs.epilogue){
      await B.trace();
      await h.ev(() => document.getElementById('btn-aftermath-continue').click());
      await h.step(300);
      const court = await P.shown('screen-court');
      h.assert(court === E.court, cs.name + (E.court ? ': CONTINUE opens the trial' : ': no trial for an unproven case'));
      if(court){
        if(cs.prep) r.prep = await P.courtPrep();
        await h.shot('port_finale_court_' + vp);
        await C.runTrial('best', 'admit');
        r.court = await h.ev(() => I().court);
        h.log('   court', JSON.stringify({ proven:r.court.proven, w:r.court.w, struck:r.court.struck }));
        h.assert(r.court && r.court.finale === r.outcome && r.court.proven.length >= 2, cs.name + ': the trial convicts on at least two counts');
        if(cs.prep) h.assert(r.prep.signed.length >= 1 && r.court.proven.length === 4 && !r.court.struck.length, cs.name + ': certified and answered well: all four counts, nothing struck (' + JSON.stringify(r.prep) + ')');
      }
      const epi = await P.waitShown('screen-epilogue', { timeout:3000 });
      h.assert(epi, cs.name + ': the epilogue');
      const slides = [], ad = await h.ev(() => (EPI.slides.find(s => s.name === 'COMMANDER ADAEZE') || {}).text || '');
      for(let i = 0; i < 30 && await P.shown('screen-epilogue'); i++){
        slides.push(await h.ev(() => ((document.querySelector('#epi .epi-name') || document.querySelector('#epi .epi-title') || document.querySelector('#epi .epi-place') || {}).textContent || '')));
        await h.ev(() => document.getElementById('screen-epilogue').click());
        await h.step(40);
      }
      const review = await P.waitShown('screen-review', { timeout:3000 });
      const underTitle = await P.shown('screen-title');
      const rv = await h.ev(() => {
        const ov = document.getElementById('screen-review'), text = (ov || {}).textContent || '';
        // the finale sheet as the review prints it: the third filed sheet (LAGOS, THE ROUTE, THE VOICE), one row per line
        const sheets = ov ? [...ov.querySelectorAll('.rv-cs')] : [], voice = sheets[2];
        const rows = voice ? [...voice.querySelectorAll('.rv-row')].map(r => r.querySelector('.v13-mark-bad') ? 'fails' : r.querySelector('.v13-mark-ok') ? 'holds' : 'aside') : [];
        const lines = ['w_lekki', 'w_asaba', 'w_cdr', 'w_eko'].map(id => rvWarrantLine(id)[0]);
        return { sheets:sheets.length, rows, warrants:lines.every(t => text.includes(t)), verdict:courtEpilogueText() };
      });
      await h.shot('port_finale_review_' + (E.court ? 'proven' : 'unproven') + '_' + vp);
      await h.ev(() => document.getElementById('btn-review-done').click());
      const title = await P.waitShown('screen-title', { timeout:2000 });
      const trail = await B.trail();
      r.after = { slides:slides.length, review, title, s1:await h.ev(() => !!S.game.seasonOneComplete) };
      h.log('   epilogue', slides.join(' | '));
      h.log('   adaeze:', ad.slice(0, 90));
      if(E.court) h.assert(!!rv.verdict && ad === rv.verdict, cs.name + ': her epilogue line carries the verdict');
      else {
        h.assert(!trail.includes('ov:screen-court') && rv.verdict === null && await h.ev(() => !I().court), cs.name + ': no court ever sat, and her line is not a verdict');
        h.assert(JSON.stringify(rv.rows) === '["holds","fails","fails"]', cs.name + ': the review shows the finale sheet: the name holds, METHOD and MONEY TRAIL fail (' + rv.rows + ')');
      }
      h.assert(review && !underTitle, cs.name + ': the review opens after the last slide, before the title screen');
      h.assert(rv.sheets === 3 && rv.warrants, cs.name + ': the review reads the filed records (three sheets, every warrant line)');
      h.assert(title && r.after.s1, cs.name + ': FINISH → title; Season One complete');
      h.assert(trail.indexOf('ov:screen-review') > trail.indexOf('ov:screen-epilogue') && trail.lastIndexOf('ov:screen-title') > trail.indexOf('ov:screen-review'), cs.name + ': epilogue → review → title, in that order');
    }
    out.push(r);
    await h.ev(() => { showOverlay(null); ENGINE.movementEnabled = false; ENGINE.keys.KeyC = false; });
  }
  h.log('\n' + out.map(r => `${r.name}: route ${r.route} · ${r.outcome} · Osas ${r.osas} · in ${r.inside}${r.court ? ' · court ' + r.court.proven.length + '/4' : ''}${r.after ? ' · review ' + r.after.review : ''}`).join('\n'));
  h.log(`PASS v13_port_finale (${out.length}/${cases.length})`);
};
