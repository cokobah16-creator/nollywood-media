// screens team: Court 5 and Season 2's memory of Season 1. Desktop.
//   D4   quit to the title mid-trial: the court goes (no V13.court.active, body.v13-court, court bar, camera override,
//        no later court line), and a Season 1 conversation afterwards has the normal layout
//   D13  the tracker certificate is offered only for the tracker log, not for the escort's phone alone
//   CN05/CN06  PW2 and the certificates are Mr. Igbinosa's even when Tobi came out of Asaba alive
//   CN13 a Season 2 load leaves Season 1's verdict (moralChoices.finale) alone and keeps its own reading (s2.s1fate);
//        a save the kit already rewrote is put back
const { sc, checks, overlays } = require('./screens_lib.js');
const look = T => T.ev(() => ({ ov:[...document.querySelectorAll('.overlay.show')].map(o => o.id).join(','), cm:S.game.currentMission,
  key:(typeof DLG !== 'undefined' && DLG.scriptKey) || null, active:!!(V13.court && V13.court.active), pending:!!(V13.court && V13.court.pending),
  bar:!!document.querySelector('#court-bar.show'), body:document.body.classList.contains('v13-court'), interlude:!!document.querySelector('#court-interlude.show'),
  override:!!(typeof TPCAM !== 'undefined' && TPCAM.override), always:typeof ENGINE !== 'undefined' && !!ENGINE.sceneAlways }));
const step = async (T, n) => { for (let k = 0; k < n; k++) { await T.ev(() => { if (document.getElementById('screen-dialogue').classList.contains('show')) { skipTypewriter(); const c = document.querySelector('#dlg-choices .dialogue-choice'); if (c) { c.click(); if (c.dataset.armed) c.click(); } else advanceDialogue(); } else { const x = document.querySelector('#screen-courtfix.show .cf-close'); if (x) x.click(); } }); await T.wait(150); } };
module.exports = async function (T) {
  const C = checks(T);
  // ---------------- CN13: Season 1's verdict is Season 1's ----------------
  const fate = await T.ev(() => {
    const out = {};
    // a contested Season 1 finale, convicted on one count at The Case File's trial
    S.game.moralChoices = Object.assign(S.game.moralChoices || {}, { finale:'contested' }); S.game.flags = S.game.flags || {}; S.game.flags.finale = 'contested';
    I().court = { proven:['c1'] }; delete S.game.s2;
    V13.adaptS1Fate();
    out.fresh = { finale:S.game.moralChoices.finale, flag:S.game.flags.finale, s1fate:V13.s2().s1fate, read:V13.s1fate ? V13.s1fate() : '(no V13.s1fate yet)', cond:V13.court.cond('adaeze_proven'), contested:V13.court.cond('adaeze_contested') };
    // a save the kit's first build rewrote: finale forced to 'proven', the original kept in s2.s1finale
    S.game.moralChoices.finale = 'proven'; S.game.flags.finale = 'proven'; S.game.s2 = { fateDone:1, s1finale:'contested', adaezeCounts:1 };
    V13.adaptS1Fate();
    out.migrated = { finale:S.game.moralChoices.finale, flag:S.game.flags.finale, s1fate:V13.s2().s1fate, cond:V13.court.cond('adaeze_proven') };
    // a discharge on a no-case submission
    S.game.moralChoices.finale = 'proven'; S.game.flags.finale = 'proven'; delete S.game.s2; I().court = { proven:[] };
    V13.adaptS1Fate();
    out.discharged = { finale:S.game.moralChoices.finale, s1fate:V13.s2().s1fate, discharged:V13.s2().adaezeDischarged, cond:V13.court.cond('adaeze_unproven') };
    delete S.game.s2; I().court = null; S.game.moralChoices.finale = 'contested'; S.game.flags.finale = 'contested';
    return out;
  });
  T.log('fate', JSON.stringify(fate));
  C.ok('CN13-no-rewrite', fate.fresh.finale === 'contested' && fate.fresh.flag === 'contested' && fate.fresh.s1fate === 'proven' && fate.fresh.cond && !fate.fresh.contested, JSON.stringify(fate.fresh));
  C.ok('CN13-migrate', fate.migrated.finale === 'contested' && fate.migrated.flag === 'contested' && fate.migrated.s1fate === 'proven' && fate.migrated.cond, JSON.stringify(fate.migrated));
  C.ok('CN13-discharged', fate.discharged.finale === 'proven' && fate.discharged.s1fate === 'unproven' && fate.discharged.discharged === 1 && fate.discharged.cond, JSON.stringify(fate.discharged));

  // ---------------- CN12: nobody Season 1's charge sheet wrongly held comes back as a source ----------------
  const src = await T.ev(() => {
    const run = (acc, mc) => { delete S.game.s2; S.game.accusations = acc; Object.assign(S.game.moralChoices, mc); V13._quietRecruit = true; V13.s1Sources(); V13._quietRecruit = false; return V13.srcList().join(','); };
    const fair = { market_runner:'caught', choice:'flip' };
    const out = {
      clean:run({}, fair),
      tundeHeld:run({ lagos:{ suspect:'tunde', ok:{ suspect:false }, settled:'m3' } }, fair),
      kcHeld:run({ lagos:{ suspect:'kc', ok:{ suspect:false }, settled:'m3' } }, fair),
      kcForced:run({}, { market_runner:'caught', choice:'force' }),
    };
    delete S.game.s2; S.game.accusations = {}; S.game.moralChoices.choice = 'flip';
    return out;
  });
  C.ok('CN12-sources', src.clean === 'KC,TUNDE' && src.tundeHeld === 'KC' && src.kcHeld === 'TUNDE' && src.kcForced === 'TUNDE', JSON.stringify(src));

  // ---------------- small things this team's files say: S2_EV, the badge, the styles block, the renames, motion ----------------
  const misc = await T.ev(() => {
    const cur = S.game.currentMission; S.game.currentMission = 'm15'; const next = nextMissionPreview(); S.game.currentMission = cur;
    const o = (V13.CASES.m15.objectives() || [])[0] || {};
    const cands = (V13.S2_CANDIDATES || []).map(c => c.name).join(' | ');
    return { ev:(V13.S2_EV || []).length, evHas:['drive_image', 'barge_cash', 'senator_words', 'ereba_photo'].every(id => (V13.S2_EV || []).includes(id)),
      badge:/class="s2-badge"/.test(next) && !/style=/.test(next), c15css:!!document.getElementById('c15-css'), obj:o.text, cands };
  });
  C.ok('RT14-S2_EV', misc.ev === 23 && misc.evHas, JSON.stringify({ n:misc.ev, has:misc.evHas }));
  C.ok('R25-badge', misc.badge, 'SEASON 3 badge is .s2-badge with no inline style');
  C.ok('R08-c15css-moved', !misc.c15css, 'no injected #c15-css block (its rules live in s2.css)');
  C.ok('CN10-names', /Okundaye/.test(misc.obj) && /Cdr\. Itohan Okundaye/.test(misc.cands) && /Barr\. Zainab Danladi/.test(misc.cands) && !/Osagie|Grace|Hauwa/.test(misc.obj + misc.cands), JSON.stringify(misc));
  const motion = await T.ev(() => new Promise(res => {
    document.body.classList.add('reduce-motion', 'cb');
    V13.court.stamp('REJECTED', 'bad');
    const d = document.querySelector('#court-bar .cb-delta') || (V13.court.bar(true), V13.court.credMeter(true), V13.court.showCred(50, -4), document.querySelector('#court-bar .cb-delta'));
    setTimeout(() => {
      const s = document.getElementById('court-stamp'), cs = getComputedStyle(s);
      const out = { stampAnim:cs.animationName, stampOpacity:cs.opacity, stampBorder:cs.borderTopStyle, deltaAnim:d ? getComputedStyle(d).animationName : 'no delta' };
      document.body.classList.remove('reduce-motion', 'cb'); V13.court.credMeter(false); V13.court.bar(false); res(out);
    }, 300);
  }));
  C.ok('R19-motion-cb', motion.stampAnim === 'none' && +motion.stampOpacity === 1 && motion.stampBorder === 'dashed', JSON.stringify(motion));

  // ---------------- D4: quit to the title in the middle of the trial ----------------
  const pre = "S.game.completedMissions.push('m9','m10','m11','m12','m13','m13b'); V13.s2().hubs = { h9:1, h10:1, h11:1, h12:1, h13:1 };";
  await T.ev(() => { window.__cards = []; window.__toasts = []; const tc = window.titleCard, to = V13.toast;
    window.titleCard = function(lines){ window.__cards.push((lines || []).join(' / ')); return tc.apply(this, arguments); };
    V13.toast = function(a, b){ window.__toasts.push(a + ': ' + b); return to.apply(this, arguments); }; });
  T.log('m14', await sc.s2start(T, 'm14', pre));
  await T.until(() => (window.__toasts || []).some(t => /FEDERAL HIGH COURT/.test(t)), 15000);
  const start = await T.ev(() => ({ cards:window.__cards.slice(), toasts:window.__toasts.filter(t => /FEDERAL HIGH COURT/.test(t)) }));
  C.ok('CN03-start-card', start.cards.some(c => c === 'COURT 5 / FRIDAY 8 JANUARY · 18:40'), JSON.stringify(start.cards));
  C.ok('RT06-no-save-notice', start.toasts.some(t => /can't be saved part-way/.test(t)), JSON.stringify(start.toasts));
  // a Season 2 load: Season 1's verdict untouched, Season 2's reading stored
  const loaded = await T.ev(() => ({ finale:S.game.moralChoices.finale, fateDone:V13.s2().fateDone }));
  C.ok('CN13-load', loaded.finale === 'contested' && loaded.fateDone === 1, JSON.stringify(loaded));
  await T.ev(() => { V13.court.fast = true; });
  await T.until(() => !document.querySelector('#title-card.show') && ENGINE.movementEnabled, 30000);
  await sc.use(T, 'Barrister Danladi');
  await step(T, 25);
  await T.until(() => document.getElementById('screen-dialogue').classList.contains('show'), 20000);
  const during = await look(T);
  T.log('[D4] in court', JSON.stringify(during));
  await T.ev(() => document.dispatchEvent(new KeyboardEvent('keydown', { code:'Escape', key:'Escape', bubbles:true }))); await T.wait(600);
  await T.ev(() => document.getElementById('btn-quit').click()); await T.wait(1500);
  const after = await look(T);
  T.log('[D4] after QUIT', JSON.stringify(after));
  C.ok('D4-quit', during.active && !after.active && !after.body && !after.bar && !after.override && !after.interlude && !after.pending, JSON.stringify(after));
  await T.wait(5000);
  const later = await look(T);
  C.ok('D4-no-stale-run', !later.active && !later.bar && !later.body && !(/^m14c_/.test(later.key || '') && /screen-dialogue/.test(later.ov)), JSON.stringify(later));
  // a Season 1 case after that
  await T.ev(() => { showOverlay(null); loadMission('m1'); });
  await T.wait(1500); await T.ev(() => { if (document.querySelector('#screen-controls.show')) beginMission('m1'); });
  await T.until(() => S.game.currentMission === 'm1' && ENGINE.movementEnabled, 60000); await T.wait(2000);
  const m1 = await look(T);
  const key = await T.ev(() => Object.keys(DIALOGUE).find(k => /^hq_/.test(k)));
  await T.ev(k => startDialogue(k), key); await T.wait(800);
  const lay = await T.ev(() => { const p = document.querySelector('#screen-dialogue .dialogue-portrait'); return p ? getComputedStyle(p).position : 'no portrait'; });
  T.log('[D4] m1', JSON.stringify(m1), key, lay);
  C.ok('D4-season1-after', !m1.active && !m1.bar && !m1.body && lay !== 'static', JSON.stringify({ m1, layout:lay }));
  await T.ev(() => { DLG.onComplete = null; endDialogue(); });

  // ---------------- D13 and CN05 / CN06 ----------------
  const fx = await T.ev(() => {
    const keep = (S.game.evidence || []).slice();
    const set = ids => { S.game.evidence = ids.map(id => ({ id, name:id })); };
    set(['felix_phone']); const phoneOnly = V13.court.fixAvailable('cert_tracker');
    set(['felix_phone', 'barge_track']); const withTrack = V13.court.fixAvailable('cert_tracker');
    S.game.moralChoices.asaba = 'rescue'; S.game.moralChoices.s2_method = 'image';
    V13.court.reset(); const W = V13.court.witnessList();
    V13.s2().fixes = {}; V13.court.openFixes(2, () => {}, { where:'h13' });
    const card = [...document.querySelectorAll('#screen-courtfix .cf-card')].find(c => c.querySelector('.cf-go[data-f="cert_tracker"]'));
    const who = card ? card.querySelector('.cf-who').textContent : 'no card';
    const x = document.querySelector('#screen-courtfix .cf-close'); if (x) x.click();
    const ren = V13.court.renum('PW2 told the court');
    S.game.evidence = keep;
    return { phoneOnly, withTrack, pw2:W[0] && (W[0].id + '/' + W[0].who + '/' + W[0].key), who, ren };
  });
  T.log('fixes', JSON.stringify(fx));
  C.ok('D13-cert-tracker', fx.phoneOnly === false && fx.withTrack === true, JSON.stringify(fx));
  C.ok('CN06-pw2-igbinosa', /^igbinosa\/IGBINOSA\/pw_igbinosa/.test(fx.pw2 || '') && fx.who === 'Igbinosa', JSON.stringify(fx));
  C.ok('CN15-san-speaker', await T.ev(() => V13.court.line({ who:'SAN', text:'x' }).speaker === 'OLANIRAN-COLE, SAN'), 'SAN speaks as OLANIRAN-COLE, SAN');
  C.done();
};
