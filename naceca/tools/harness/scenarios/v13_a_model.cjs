// v13 A · the Senior model (design A8): statements are filed, not judged (CORROBORATED / CONTRADICTED /
// HONEST MISTAKE lock; UNVERIFIED stays open once); +2 intel for every filing; scoring only at season end.
// Registry: the address search lists its hits and sets zuma_cluster silently (toast/intel Recruit-only).
// Phones → money: a Senior flag adds nothing on the spot; the next briefing adds the nodes together.
// MONEY opens only after the Lagos charge sheet or m3 (intelMoneyOpen). Recruit keeps the drop's feedback.
const A_LIB = require('./v13_a_lib.cjs');
module.exports = async h => {
  const A = A_LIB.lib(h);
  await h.start('m2', { completed:['m0', 'm1'] });
  const spy = () => h.ev(() => { window.__toasts = []; if(!window.toast._spy){ const t = window.toast; window.toast = function(b, s){ window.__toasts.push(String(b) + ' | ' + String(s || '')); return t.apply(this, arguments); }; window.toast._spy = true; } });
  await spy();

  // ---- statements, Senior ----
  const sen = await h.ev(() => {
    const out = {}, i0 = () => S.game.intelScore;
    out.senior = intelSenior();
    S.game.evidence.push({ id:'m4' }); S.game.completedMissions.push('m4');                // st_musa needs m4 (claims only)
    const a = i0();
    out.u1 = intelVerdict('st_musa', 'u1', 'mistaken');                                   // wrong, locks, no feedback
    out.u1again = intelVerdict('st_musa', 'u1', 'contradicted');                          // locked: ignored
    out.u1of = intelVerdictOf('st_musa', 'u1');
    out.u4 = intelVerdict('st_musa', 'u4', 'unverified');                                 // open
    out.u4of1 = intelVerdictOf('st_musa', 'u4');
    I().flagged.musa_bank_bw = true;                                                     // new evidence comes in
    out.u4b = intelVerdict('st_musa', 'u4', 'contradicted');                              // replaced once → locks
    out.u4of2 = intelVerdictOf('st_musa', 'u4');
    out.u4c = intelVerdict('st_musa', 'u4', 'corroborated');
    out.u3 = intelVerdict('st_musa', 'u3', 'unverified');
    out.u2 = intelVerdict('st_musa', 'u2', 'corroborated');                               // right verdict, proof not held
    out.d = i0() - a;                                                                     // five filings (u1, u4, u4 replaced, u3, u2) × 2
    out.none = intelVerdictOf('st_musa', 'zz');
    out.score = { u1:intelVerdictScore('st_musa', 'u1'), u4:intelVerdictScore('st_musa', 'u4'), u3:intelVerdictScore('st_musa', 'u3'), u2:intelVerdictScore('st_musa', 'u2'), nil:intelVerdictScore('st_tobi', 'b1') };
    out.stShape = typeof I().st.st_musa.u1 === 'string';
    out.bad = intelVerdict('st_musa', 'u1', 'nonsense');
    out.judge = stJudge('st_tunde', 't1', 'corroborated');
    return out;
  });
  h.log('senior', JSON.stringify(sen));
  h.assert(sen.senior === true, 'Senior Agent is the default');
  h.assert(sen.u1.locked === true && sen.u1.ok === null, 'Senior: a verdict files and locks; ok is null (no right/wrong)');
  h.assert(sen.u1again.locked === true && sen.u1of.verdict === 'mistaken' && sen.u1of.locked, 'a locked verdict cannot be changed');
  h.assert(sen.u4.locked === false && sen.u4.ok === null && sen.u4of1.verdict === 'unverified' && !sen.u4of1.held, 'UNVERIFIED stays open');
  h.assert(sen.u4b.locked === true && sen.u4of2.verdict === 'contradicted' && sen.u4of2.held === true, 'UNVERIFIED is replaced once (held = proof in hand at filing), then locks');
  h.assert(sen.u4c.locked === true && sen.u4of2.verdict === 'contradicted', 'no second replacement');
  h.assert(sen.d === 10, 'Senior: +2 intel for every filing, right or wrong (got ' + sen.d + ')');
  h.assert(sen.none === null && sen.bad === null, 'unknown claims and verdicts are refused');
  h.assert(sen.score.u1 === false && sen.score.u4 === true && sen.score.u3 === true && sen.score.u2 === false && sen.score.nil === null, 'scores read at season end: ' + JSON.stringify(sen.score));
  h.assert(sen.stShape, 'S.game.intel.st keeps the drop\'s verdict strings');
  h.assert(sen.judge.ok === null && !/✔|✘/.test(sen.judge.msg), 'the drop\'s stJudge shim gives no right/wrong in Senior');

  // ---- statements, Recruit: as delivered ----
  await A.recruit(true);
  const rec = await h.ev(() => {
    const out = {}, a = S.game.intelScore;
    out.w = intelVerdict('st_tunde', 't2', 'contradicted');
    out.r = intelVerdict('st_tunde', 't2', 'unverified');
    out.r2 = intelVerdict('st_tunde', 't2', 'unverified');
    out.d = S.game.intelScore - a;
    out.of = intelVerdictOf('st_tunde', 't2');
    return out;
  });
  h.log('recruit', JSON.stringify(rec));
  h.assert(rec.w.ok === false && typeof rec.w.msg === 'string' && rec.r.ok === true && rec.r2.ok === true, 'Recruit: right/wrong feedback and retries');
  h.assert(rec.d === 0 && rec.of.locked === false, 'Recruit: no +4 after a wrong first try (as delivered); never locked');
  await A.recruit(false);

  // ---- registry: the address search ----
  const reg = await h.ev(() => {
    const out = {}; window.__toasts.length = 0;
    const a = S.game.intelScore;
    out.hits = regAtAddress(ZUMA).length; out.cluster = intelHas('zuma_cluster'); out.d = S.game.intelScore - a;
    out.toasts = window.__toasts.filter(t => /ONE OFFICE/.test(t)).length; out.due = !!I().flags.one_office_due;
    // Recruit on a fresh record
    delete I().flags.zuma_cluster; delete I().flags.one_office_due;
    S.game.difficulty = 'recruit'; const b = S.game.intelScore;
    out.rHits = regAtAddress(ZUMA).length; out.rD = S.game.intelScore - b; out.rToasts = window.__toasts.filter(t => /ONE OFFICE/.test(t)).length;
    S.game.difficulty = 'senior';
    return out;
  });
  h.log('registry', JSON.stringify(reg));
  h.assert(reg.hits >= 4 && reg.cluster && reg.d === 0 && reg.toasts === 0 && reg.due, 'Senior: hits listed, zuma_cluster set silently, no toast, no intel');
  h.assert(reg.rHits === reg.hits && reg.rD === 10 && reg.rToasts === 1, 'Recruit: the ONE OFFICE toast and +10 intel');

  // ---- phones → money, and the MONEY gate ----
  const money = await h.ev(() => {
    const out = {}, d = I(); window.__toasts.length = 0;
    d.money = { open:false, req:0, unlocked:{}, traced:{} }; S.game.accusations = {}; d.flagged = {};
    out.gate0 = intelMoneyOpen();
    flagClue('kc_bank_150k', true);
    out.afterFlag = { open:d.money.open, n:Object.keys(d.money.unlocked).length, toasts:window.__toasts.filter(t => /MONEY TRAIL/.test(t)).length };
    flagClue('kc_msg_mama', true);
    out.released = intelBriefingOpened();
    out.afterBrief = { open:d.money.open, req:d.money.req, nodes:Object.keys(d.money.unlocked) };
    out.traceGated = moneyTrace('n_kc');
    CW.file('lagos', { suspect:'obi', method:'phish', money:'wallet' });
    out.gate1 = intelMoneyOpen();
    const a = S.game.intelScore;
    out.trace = moneyTrace('n_kc'); out.dTrace = S.game.intelScore - a;
    // the key node waits for the route case (and the h5 briefing): C.A. Consulting is never traceable from Case 02
    d.money.unlocked.n_ca = true; d.money.req = 5;
    out.keyGated = moneyTrace('n_ca') === false && !d.money.traced.n_ca && d.money.req === 5;
    S.game.completedMissions.push('m6');
    // the key node: same +2, no toast
    window.__toasts.length = 0; const b = S.game.intelScore;
    out.key = moneyTrace('n_ca'); out.dKey = S.game.intelScore - b; out.keyToast = window.__toasts.length; out.inv = intelHas('inv_ca');
    // Recruit: as delivered
    S.game.difficulty = 'recruit';
    d.money = { open:false, req:0, unlocked:{}, traced:{} }; d.flagged = {}; window.__toasts.length = 0;
    flagClue('kc_bank_150k', true);
    out.rFlag = { open:d.money.open, toast:window.__toasts.filter(t => /MONEY TRAIL/.test(t)).length };
    out.rReleased = intelBriefingOpened().length;
    d.money.unlocked.n_ca = true; d.money.req = 5; const c = S.game.intelScore; window.__toasts.length = 0;
    moneyTrace('n_ca'); out.rKey = S.game.intelScore - c; out.rKeyToast = window.__toasts.filter(t => /^C\.A\. CONSULTING/.test(t));
    S.game.difficulty = 'senior';
    // m3 complete also opens the trail
    S.game.accusations = {}; S.game.completedMissions.push('m3'); out.gate2 = intelMoneyOpen();
    return out;
  });
  h.log('money', JSON.stringify(money));
  h.assert(money.gate0 === false && money.gate1 === true && money.gate2 === true, 'MONEY opens after the Lagos charge sheet or m3');
  h.assert(!money.afterFlag.open && money.afterFlag.n === 0 && money.afterFlag.toasts === 0, 'Senior: a flag adds no node and no toast');
  h.assert(money.released.join() === 'n_kc' && money.afterBrief.open && money.afterBrief.nodes.join() === 'n_kc' && money.afterBrief.req === 4, 'the next briefing adds the flagged clue\'s node (no word about which flag)');
  h.assert(money.traceGated === false && money.trace === true && money.dTrace === 2, 'no trace before the gate; Senior trace +2');
  h.assert(money.keyGated, 'the C.A. node cannot be traced before the route case (decision 11)');
  h.assert(money.key === true && money.dKey === 2 && money.keyToast === 0 && money.inv, 'Senior: the C.A. node gets the same +2, no toast; its exhibit lands quietly');
  h.assert(money.rFlag.open && money.rFlag.toast === 1 && money.rReleased === 0, 'Recruit: the flag opens the trail with a toast, as delivered');
  h.assert(money.rKey === 12 && money.rKeyToast.length === 1 && !/2019/.test(money.rKeyToast[0]), 'Recruit: the C.A. toast and +12 intel, without the tenure date');

  // ---- the briefing hook is on: every briefing (Night Shift and the hub calls) calls the model's
  // intelOnBriefingOpen as it opens, which releases Senior's flagged nodes (seam fix e2ed80a) ----
  const hook = await h.ev(() => typeof openBriefing === 'function' && typeof window.intelOnBriefingOpen === 'function' && /intelOnBriefingOpen/.test(String(openBriefing)));
  h.assert(hook, 'every briefing calls the model\'s hook to release flagged money clues');
  await A.textRules(['Filed. It stays on the record.', 'Filed as unverified. You can come back to it once.', 'More come with the next briefing', 'A retainer on the first of every month'], 'model messages');
  h.assert(h.errors.length === 0, 'no page errors: ' + h.errors.join(' | '));
};
