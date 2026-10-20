// core: Case 09 (from the reviewers' d_c09back and d_replay).
// (1) D2: back off the hash document; the bench comes back and reopens the hash; o9_examine and drive_image complete.
// (2) D11: a replay starts with no Case 09 exhibits, flags or document misses.
// (3) CN20: when the Commander won't back the handover she has gone home by 05:10 (her office is dark).
const L = require('./core_lib.js'), sc = L.sc;
const snap = T => T.ev(() => ({ objs: (S.game.objectives || []).map(o => (o.done ? '+' : '.') + o.id).join(' '), its: ENGINE.interactables.map(i => i.label + (i._used ? '*' : '')).join(' | '),
  guide: (() => { try { const g = typeof guideTarget === 'function' ? guideTarget() : null; return g && (g.label || g.text || g.id) || null; } catch (e) { return 'err'; } })(),
  ov: [...document.querySelectorAll('.overlay.show')].map(o => o.id).join(',') }));
const held = T => T.ev(() => ({ held: (S.game.evidence || []).filter(e => /^(drive_image|evidence_register|upstream_ledger)$/.test(e.id)).map(e => e.id + ':' + (S.game.evQ || {})[e.id]),
  mc: Object.fromEntries(Object.entries(S.game.moralChoices || {}).filter(([k]) => /^s2_(custody|method|abuja|original)/.test(k))),
  flags: Object.fromEntries(Object.entries(S.game.flags || {}).filter(([k]) => /^s2_(custody|method|abuja|original)/.test(k))),
  miss: Object.fromEntries(['_docMiss', '_docFree', '_docLocked'].map(s => [s, Object.keys(S.game[s] || {}).filter(k => /^m9_/.test(k))])) }));
module.exports = async function (T) {
  const C = L.checks(T);
  await L.capture(T);
  // ---------- (1) back off the hash ----------
  T.log('m9', await sc.s2start(T, 'm9', 'delete S.game.s2;'));
  await sc.talk(T);
  await sc.use(T, 'Report to Commander (Okundaye|Osagie)'); await sc.talk(T, [0]);
  await sc.use(T, 'Sign for exhibit 14'); await sc.talk(T, ['Sign it out']);
  await sc.use(T, 'Examine the drive'); await sc.talk(T, ['Write-blocker']);
  await sc.waitCards(T);
  await T.until(() => document.querySelector('#screen-puzzle.show .v12-opt'), 30000);
  await T.ev(() => document.getElementById('v12-doc-x').click());
  await T.wait(2500);
  const s1 = await snap(T);
  T.log('after back-off', JSON.stringify(s1));
  C.check('D2 after backing off the hash, the bench is live again (not greyed)', /Examine the drive(?!\*)( \||$)/.test(s1.its) && !/screen-puzzle/.test(s1.ov), s1);
  await sc.use(T, 'Examine the drive'); await T.wait(1200);
  const docs = await L.got(T, 'docs');
  C.check('D2 the bench reopens the hash document (not the ledger)', docs[docs.length - 1] === 'm9_hash' && docs.filter(k => k === 'm9_hash').length === 2 && !docs.includes('m9_ledger'), docs);
  await sc.solve(T, 'm9_hash'); await sc.talk(T);
  // the ledger: back off it too, then the bench brings it back
  await T.until(() => document.querySelector('#screen-puzzle.show .v12-opt'), 15000);
  await T.ev(() => document.getElementById('v12-doc-x').click()); await T.wait(2000);
  const s2 = await snap(T);
  C.check('D2 after backing off the ledger, the bench is live again', /Examine the drive(?!\*)( \||$)/.test(s2.its), s2.its);
  await sc.use(T, 'Examine the drive'); await T.wait(800);
  await sc.solve(T, 'm9_ledger'); await sc.talk(T);
  const e1 = await T.ev(() => ({ ex: V13.objDone('o9_examine'), led: V13.objDone('o9_ledger'), img: V13.hasEv('drive_image') ? V13.evQ('drive_image') : null }));
  C.check('D2 o9_examine is done and the forensic image is on file', e1.ex && e1.led && e1.img === 'good', e1);
  // the rest of the night: a lie to Abuja, so the Commander won't back the handover
  await sc.waitCards(T); await T.wait(600);
  await sc.use(T, 'Answer the Commander'); await sc.talk(T, ['Untouched']);
  const okHome = await T.until(() => V13.rt.osagieGone === true, 8000);
  await sc.waitCards(T); await T.wait(3500);
  const cn = await T.ev(() => ({ gone: V13.rt.osagieGone, vis: V13.rt.osagie.visible, call: V13.mc().s2_abuja_call, its: ENGINE.interactables.map(i => i.label).join(' | ') }));
  C.check('CN20 not backed: the Commander has gone home before 05:10', okHome && cn.gone && cn.vis === false && !/Okundaye|Osagie/.test(cn.its), cn);
  await sc.use(T, 'Meet the transfer team'); await T.wait(400);
  const dl = await L.got(T, 'dlg');
  C.check('CN20 not backed: the escort meets an empty office (m9_transfer)', dl[dl.length - 1] === 'm9_transfer', dl.slice(-2));
  await sc.talk(T); await T.wait(2200); await sc.talk(T);
  await T.until(() => document.getElementById('screen-aftermath').classList.contains('show'), 20000);
  // ---------- (2) the replay ----------
  const before = await held(T);
  T.log('run 1 leaves', JSON.stringify(before));
  await T.ev(() => { S.game._docMiss = Object.assign(S.game._docMiss || {}, { m9_hash: 2, m9_ledger: 1 }); S.game._docFree = { m9_hash: true }; });
  T.log('replay', await sc.s2start(T, 'm9', "S.game.completedMissions.push('m9');"));
  const r = await held(T);
  T.log('replay starts with', JSON.stringify(r));
  C.check('D11 a replay starts with no Case 09 exhibits, flags or document misses', !r.held.length && !Object.keys(r.mc).length && !Object.keys(r.flags).length && !r.miss._docMiss.length && !r.miss._docFree.length && !r.miss._docLocked.length, r);
  await sc.talk(T);
  await sc.use(T, 'Report to Commander (Okundaye|Osagie)'); await sc.talk(T, [0]);
  await sc.use(T, 'Sign for exhibit 14'); await sc.talk(T, ['never left']);
  await sc.use(T, 'Examine the drive'); await sc.talk(T, ['Write-blocker']);
  await sc.waitCards(T);
  await T.until(() => document.querySelector('#screen-puzzle.show .v12-opt'), 30000);
  const pips = await T.ev(() => document.querySelectorAll('#v12-misses i.lost').length);
  const reg = await T.ev(() => V13.hasEv('evidence_register'));
  C.check('D11 the replay\'s hash opens with no misses; unsigned leaves no register on file', pips === 0 && !reg, { pips, reg });
  C.done();
};
