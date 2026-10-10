// v13 A · exhibit flaws (design A6) and ADMISSIBILITY (§1): 'warrantless' only from an exigent raid
// warrant (w_lekki for m3, w_asaba for m6, w_eko for m8) with no second 'contested' penalty for the same
// entry; 'noorder' only when the Ugbowo order was gone without; the ledger's custody gap appears only after
// the reveal. Shapes: intelItemFlaws → [{k,w,txt}], intelAdmissibility → {score, flaws:[{k,label,pts}]},
// intelIntegrity === intelAdmissibility().score. Senior and Recruit read the same flaws.
const A_LIB = require('./v13_a_lib.cjs');
module.exports = async h => {
  const A = A_LIB.lib(h);
  await h.start('m2', { completed:['m0', 'm1'] });
  const T = await h.ev(() => {
    const out = {};
    const ks = id => intelItemFlaws(id).map(f => f.k).sort().join(',');
    const give = (id, name) => { if(!V12.hasEv(id)) collectEvidence({ id, name:name || id, xp:0 }); };
    const reset = () => { S.game.accusations = {}; S.game.evQ = {}; S.game.moralChoices = {}; S.game.flags = {}; I().warrants = {}; delete I().custodyAsk; };
    ['laptop', 'cash', 'safe_drives', 'obi_notebook', 'asaba_sims', 'asaba_runner', 'asaba_hostage', 'tower_cdr', 'tower_fix', 'tower_fibre',
     'fin_drive', 'fin_courier_phone', 'fin_recording', 'ransom_ledger', 'musa_statement', 'phishing_template', 'shrine_pots'].forEach(id => give(id));
    S.game.evidence.push({ id:'inv_engineer', name:'Engineer log' }); intelOnEvidence({ id:'inv_engineer' });
    out.notLegacy = Object.values(I().items).every(it => !it.legacy);

    // Lekki signed: no warrant flaw
    reset(); CW.autofile('lagos', null, 'signed');
    out.lekkiSigned = ks('laptop');
    // Lekki exigent: one 'warrantless', not also 'contested' (CW.goExigent marked the raid evidence weak)
    reset(); CW.file('lagos', { suspect:'obi', method:'phish', money:'wallet' }); CW.goExigent('lagos');
    out.evq = V12.evQ('laptop') + '/' + V12.evQ('cash') + '/' + V12.evQ('safe_drives');
    out.lekkiEx = { laptop:ks('laptop'), cash:ks('cash'), drives:ks('safe_drives'), notebook:ks('obi_notebook') };
    out.lekkiExText = intelItemFlaws('laptop').map(f => f.txt);
    out.adm = intelAdmissibility('laptop'); out.integ = intelIntegrity('laptop');
    // ... and a wrong money line settled on top: cash (moneyEv) carries the charge-sheet contest as well
    S.game.accusations.lagos.money = 'transfer'; S.game.accusations.lagos.ok.money = false; S.game.currentMission = 'm3'; CW.settle('lagos');
    out.lekkiExMoney = { cash:ks('cash'), cashTxt:intelItemFlaws('cash').map(f => f.txt), laptop:ks('laptop'), notebook:ks('obi_notebook') };
    // a wrong money line with a signed warrant: contested, with the charge sheet as the reason
    reset(); CW.autofile('lagos', { money:'transfer' }, 'signed'); S.game.currentMission = 'm3'; CW.settle('lagos');
    out.signedMoney = { cash:ks('cash'), txt:intelItemFlaws('cash').map(f => f.txt) };

    // Asaba exigent: SIMs and the runner; the rescued witness is not a seized exhibit
    reset(); CW.autofile('route', null, 'pending'); CW.goExigent('route');
    out.asabaEx = { sims:ks('asaba_sims'), runner:ks('asaba_runner'), hostage:ks('asaba_hostage') };
    S.game.accusations.route.method = 'feed'; S.game.accusations.route.ok.method = false; S.game.currentMission = 'm6'; CW.settle('route');
    out.asabaExMethod = ks('asaba_sims');
    reset(); CW.autofile('route', null, 'signed');
    out.asabaSigned = ks('asaba_sims');

    // Ekosodin: the m8 exhibits follow w_eko
    reset(); I().warrants.w_eko = { status:'exigent' };
    out.ekoEx = { drive:ks('fin_drive'), phone:ks('fin_courier_phone'), rec:ks('fin_recording'), body:ks('bodycam_eko') };
    reset(); I().warrants.w_eko = { status:'signed', route:'zonal' };
    out.ekoSigned = ks('fin_drive');
    reset();
    out.ekoPending = ks('fin_drive');

    // the Ugbowo order: noorder only when the player went without it
    reset(); out.cdrPending = { cdr:ks('tower_cdr'), fix:ks('tower_fix'), eng:ks('inv_engineer'), fibre:ks('tower_fibre') };
    I().warrants.w_cdr = { status:'none' };
    out.cdrNone = { cdr:ks('tower_cdr'), fix:ks('tower_fix'), eng:ks('inv_engineer'), fibre:ks('tower_fibre') };
    I().warrants.w_cdr = { status:'signed', route:'standard' };
    out.cdrSigned = { cdr:ks('tower_cdr'), eng:ks('inv_engineer') };

    // the ledger: given to her office → nothing on file before the reveal
    reset(); I().custodyAsk = 'gave';
    out.ledgerBefore = { k:ks('ransom_ledger'), lines:I().items.ransom_ledger.custody.map(c => c.t) };
    S.game.moralChoices.finale = 'proven';
    out.ledgerAfter = { k:ks('ransom_ledger'), lines:I().items.ransom_ledger.custody.map(c => c.t) };
    intelItemFlaws('ransom_ledger'); intelOnMissionEnd('m8');
    out.ledgerOnce = I().items.ransom_ledger.custody.filter(c => /page 14 missing/.test(c.t)).length;
    reset(); I().custodyAsk = 'kept'; S.game.moralChoices.finale = 'proven';
    out.ledgerKept = ks('ransom_ledger');

    // the bribe taints the raid; the flipped driver's word was bought
    reset(); S.game.moralChoices.arrest = 'bribe'; out.bribe = ks('cash');
    reset(); S.game.moralChoices.checkpoint = 'flip_driver'; out.flip = ks('musa_statement');
    // the forced shrine stays as delivered
    reset(); S.game.flags.shrine_access = 'granted_force'; out.shrine = ks('shrine_pots');

    // s.84: certified items lose the flaw
    reset(); out.s84 = ks('phishing_template'); I().items.phishing_template.cert = true; out.s84c = ks('phishing_template');

    // shapes, and every text the court and the desk will show
    reset(); CW.file('lagos', { suspect:'obi', method:'phish', money:'wallet' }); CW.goExigent('lagos'); I().warrants.w_cdr = { status:'none' };
    I().warrants.w_eko = { status:'exigent' }; S.game.moralChoices = { arrest:'bribe', checkpoint:'flip_driver', finale:'proven' }; I().custodyAsk = 'gave'; S.game.flags.shrine_access = 'granted_force';
    S.game.evQ.musa_statement = 'weak';
    const ids = Object.keys(I().items);
    out.shapeOk = ids.every(id => intelItemFlaws(id).every(f => typeof f.k === 'string' && typeof f.w === 'number' && typeof f.txt === 'string' && ['tainted','warrantless','noorder','inducement','custody','contested','s84'].includes(f.k)));
    out.admShape = ids.every(id => { const a = intelAdmissibility(id); return typeof a.score === 'number' && a.score >= 0 && a.score <= 100 && a.flaws.every(f => f.k && f.label && typeof f.pts === 'number') && a.score === intelIntegrity(id); });
    out.texts = ids.flatMap(id => intelItemFlaws(id).map(f => f.txt)).concat(ids.flatMap(id => I().items[id].custody.map(c => c.t)));
    // Senior vs Recruit: the same flaws
    const all = () => JSON.stringify(ids.map(id => [id, intelAdmissibility(id)]));
    S.game.difficulty = 'senior'; syncDifficultyClass(); const sen = all();
    S.game.difficulty = 'recruit'; syncDifficultyClass(); const rec = all();
    S.game.difficulty = 'senior'; syncDifficultyClass();
    out.sameModes = sen === rec;
    return out;
  });
  h.log(JSON.stringify(T, null, 0).slice(0, 3000));
  h.assert(T.notLegacy, 'items logged in play are not legacy records');
  h.assert(T.lekkiSigned === 's84', 'Lekki signed: only the s.84 flaw on the laptop (' + T.lekkiSigned + ')');
  h.assert(T.evq === 'weak/weak/weak', 'the beta contests the raid evidence on exigent entry');
  h.assert(T.lekkiEx.laptop === 's84,warrantless' && T.lekkiEx.cash === 'warrantless' && T.lekkiEx.drives === 's84,warrantless', 'exigent Lekki: warrantless, no double contested penalty ' + JSON.stringify(T.lekkiEx));
  h.assert(T.lekkiEx.notebook === 'warrantless', 'Obi\'s notebook (an m3 exhibit) is warrantless too');
  h.assert(T.lekkiExText.some(t => /without a warrant/.test(t)), 'the flaw says the search had no warrant');
  h.assert(T.adm.score === 50 && T.integ === 50 && T.adm.flaws.length === 2, 'ADMISSIBILITY 100 − 20 − 30 = 50, intelIntegrity agrees');
  h.assert(T.lekkiExMoney.cash === 'contested,warrantless' && /charge sheet put the money elsewhere/.test(T.lekkiExMoney.cashTxt.join(' ')), 'a wrong money line is its own contest, with an honest reason');
  h.assert(T.lekkiExMoney.laptop === 's84,warrantless' && T.lekkiExMoney.notebook === 'contested,warrantless', 'the money line contests the money exhibits only');
  h.assert(T.signedMoney.cash === 'contested' && /charge sheet/.test(T.signedMoney.txt.join(' ')), 'signed warrant + wrong money: contested, charge sheet reason');
  h.assert(T.asabaEx.sims === 'warrantless' && T.asabaEx.runner === 'warrantless' && T.asabaEx.hostage === '', 'exigent Asaba: SIMs and runner warrantless, the rescued witness clean ' + JSON.stringify(T.asabaEx));
  h.assert(T.asabaExMethod === 'contested,warrantless', 'a wrong route method contests the SIMs on top');
  h.assert(T.asabaSigned === '', 'Asaba signed: clean');
  h.assert(T.ekoEx.drive === 's84,warrantless' && T.ekoEx.phone === 's84,warrantless' && T.ekoEx.rec === 's84,warrantless' && /warrantless/.test(T.ekoEx.body), 'w_eko exigent: every m8 exhibit is warrantless ' + JSON.stringify(T.ekoEx));
  h.assert(T.ekoSigned === 's84' && T.ekoPending === 's84', 'w_eko signed or pending: no warrant objection');
  h.assert(T.cdrPending.cdr === 's84' && T.cdrPending.fix === 's84' && T.cdrPending.eng === 's84' && T.cdrPending.fibre === '', 'w_cdr pending: no noorder ' + JSON.stringify(T.cdrPending));
  h.assert(T.cdrNone.cdr === 'noorder,s84' && T.cdrNone.fix === 'noorder,s84' && T.cdrNone.eng === 'noorder,s84' && T.cdrNone.fibre === '', 'w_cdr none: noorder on tower_cdr, tower_fix, inv_engineer only ' + JSON.stringify(T.cdrNone));
  h.assert(T.cdrSigned.cdr === 's84' && T.cdrSigned.eng === 's84', 'w_cdr signed: no noorder');
  h.assert(T.ledgerBefore.k === '' && !T.ledgerBefore.lines.some(t => /page 14|missing/i.test(t)), 'ledger given: before the reveal nothing says a page is missing');
  h.assert(T.ledgerAfter.k === 'custody' && T.ledgerAfter.lines.includes('Returned — page 14 missing'), 'after the reveal: the custody flaw and the line');
  h.assert(T.ledgerOnce === 1, 'the custody line is added once');
  h.assert(T.ledgerKept === '', 'ledger kept: no custody flaw');
  h.assert(T.bribe === 'tainted' && T.flip === 'inducement' && T.shrine === 'warrantless', 'bribe taint, the flipped driver and the forced shrine stay as delivered');
  h.assert(T.s84 === 's84' && T.s84c === '', 'a certificate clears the s.84 flaw');
  h.assert(T.shapeOk && T.admShape, 'flaw and admissibility shapes match the contract');
  h.assert(T.sameModes, 'Senior and Recruit see the same flaws');
  await A.textRules(T.texts, 'flaw and custody text');
  h.assert(h.errors.length === 0, 'no page errors');
};
