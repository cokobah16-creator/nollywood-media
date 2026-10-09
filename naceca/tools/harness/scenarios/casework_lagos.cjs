// Casework 4: the hub h2 Commander call opens the Lagos CHARGE SHEET before her briefing.
// Correct and each wrong part, with exact reputation deltas, the headline and contested evidence.
const LIB = require('./casework_lib.cjs');
const SIGNED = { strength:80, signed:true, refused:false, strikes:0, need:'' };
module.exports = async h => {
  const L = LIB.lib(h);
  const tag = await h.ev(() => innerWidth < 600 ? 'phone' : 'desk');
  const RIGHT = { suspect:'obi', method:'phish', money:'wallet' };
  const toCommander = async (state) => {
    await L.toHub('m3', ['m0', 'm1', 'm2'], state);
    h.assert(await h.ev(() => S.game.currentMission === 'h2'), 'Lagos HQ hub (h2) before Lekki');
    await L.warrant(SIGNED);
    await L.hubPrep();
    await h.ev(() => { window.__keys = []; const sd = window.startDialogue; window.startDialogue = function(k){ window.__keys.push(k); return sd.apply(this, arguments); }; });
    await L.commander();
    // the Commander asks for the sheet first
    h.assert(await h.ev(() => DLG.scriptKey === 'cw_gate_intro' && DIALOGUE.cw_gate_intro.some(l => /on paper/.test(l.text))), 'the Commander asks for a charge sheet before briefing');
    await L.finishDialogue();
    h.assert(await L.shown('screen-charge'), 'the CHARGE SHEET opens after her request');
    h.assert(await h.ev(() => !window.__keys.includes('hub_cmd_run')), 'her briefing has not started yet');
  };

  // ---------- 1. all three right (UI, Senior: no margin notes) ----------
  await toCommander();
  const ui = await h.ev(() => {
    const ov = document.querySelector('#screen-charge.show');
    const secs = [...ov.querySelectorAll('.cw-sec')].map(s => [s.dataset.sec, s.querySelectorAll('.cw-opt').length]);
    const sizes = [...ov.querySelectorAll('button')].map(b => { const r = b.getBoundingClientRect(); return Math.min(r.width, r.height); });
    return { secs, margin:ov.querySelectorAll('.cw-margin').length, text:ov.textContent, minSize:Math.min(...sizes), file:ov.querySelector('[data-act="file"]').disabled,
      emoji:/[☀-➿\u{1F300}-\u{1FAFF}]/u.test(ov.textContent), aks:/\bAKS\b/.test(ov.textContent) };
  });
  h.log('sheet', ui.secs, 'min button', ui.minSize);
  h.assert(JSON.stringify(ui.secs) === '[["suspect",4],["method",4],["money",4]]', 'SUSPECT, METHOD, MONEY TRAIL with the right answer and three wrong ones each');
  h.assert(ui.margin === 0, 'Senior: no margin notes on the sheet');
  h.assert(ui.file === true, 'FILE is disabled until every section has a pick');
  h.assert(ui.minSize >= 44, 'every button on the sheet is at least 44px');
  h.assert(!ui.emoji && !ui.aks, 'no emoji, no "AKS"');
  for(const [k, v] of Object.entries(RIGHT)) await L.pick('screen-charge', k, v);
  await h.shot('casework_charge_' + tag);
  const first = await h.ev(() => { const b = document.querySelector('#screen-charge [data-act="file"]'); b.click(); return b.textContent; });
  const warn = await h.ev(() => document.querySelector('#screen-charge .cw-warn').textContent);
  h.assert(/TAP AGAIN/.test(first) && /can't be withdrawn/i.test(warn) && await h.ev(() => !S.game.accusations.lagos), 'first tap only arms, under "This can\'t be withdrawn"');
  await h.ev(() => document.querySelector('#screen-charge [data-act="file"]').click());
  await h.step(300);
  await h.shot('casework_charge_filed_' + tag);
  await h.step(1000);
  let rec = await h.ev(() => S.game.accusations.lagos);
  h.log('filed', rec);
  h.assert(rec && rec.suspect === 'obi' && rec.ok.suspect && rec.ok.method && rec.ok.money, 'the record is filed with ok flags');
  h.assert(rec.warrant === 'signed', 'warrant signed (from V12.warrantFor)');
  h.assert(await h.ev(() => DLG.scriptKey === 'hub_cmd_run' && /magistrate has signed/.test(DIALOGUE.hub_cmd_run[0].text) && DIALOGUE.hub_cmd_run.some(l => /Obi in a cell/.test(l.text))), 'then the signed line and her Lekki briefing');
  h.assert(await h.ev(() => typeof V12.accused === 'function' && V12.accused('lagos') === S.game.accusations.lagos), 'V12.accused(caseId) returns the record');
  await L.finishDialogue();
  await h.step(400);
  h.assert(await h.ev(() => !!V12.mem().hubs.h2), 'the hub ends after the briefing');
  let af = await L.aftermath('m3');
  h.log('right aftermath', af.d, af.head.head);
  h.assert(af.d.pt === 0 && af.d.af === 3 && af.d.in === 0, 'all three right: Agency Favour +3 exactly');
  h.assert(/HOLDS/.test(af.review) && !/FAILS/.test(af.review) && /UPHELD/.test(af.review), 'the aftermath shows the sheet upheld');
  h.assert(await h.ev(() => !S.game.evQ || (!S.game.evQ.phishing_template && !S.game.evQ.cash)), 'nothing contested when all three hold');
  const g = await h.ev(() => {
    const el = document.getElementById('ev-max'); if(el) el.textContent = '0';
    S.game.objectives = [{ id:'a', text:'a', done:true }];
    S.game._opStart.rep = Object.assign({}, S.player.reputation, { publicTrust:S.player.reputation.publicTrust - 20 });
    const withSheet = computeGrade({ ev:0, civ:0, force:0 });
    const keep = S.game.accusations.lagos; delete S.game.accusations.lagos;
    const without = computeGrade({ ev:0, civ:0, force:0 });
    S.game.accusations.lagos = keep;
    return { withSheet:withSheet.pts, without:without.pts };
  });
  h.assert(g.withSheet === g.without + 5, 'all three right: grade bonus +5 (' + JSON.stringify(g) + ')');
  af = await L.aftermath('m3');
  h.assert(af.d.af === 0, 'settles once: a replayed aftermath pays nothing again');

  // ---------- 2. wrong SUSPECT (KC) ----------
  await toCommander();
  await L.fileSheet({ suspect:'kc', method:'phish', money:'wallet' });
  await L.finishDialogue(); await h.step(300);
  rec = await h.ev(() => S.game.accusations.lagos);
  h.assert(rec.suspect === 'kc' && !rec.ok.suspect && rec.ok.method && rec.ok.money, 'wrong suspect recorded');
  af = await L.aftermath('m3');
  await h.ev(() => { const r = document.querySelector('#aftermath-grid .cw-review'); if(r) r.scrollIntoView(); });
  await h.shot('casework_review_' + tag);
  h.log('kc aftermath', af.d, af.head.head);
  h.assert(af.d.pt === -8 && af.d.af === -3, 'wrong suspect: Public Trust −8, Agency Favour −3 exactly');
  h.assert(/Teen Data-Card Seller Held as "Kingpin"/.test(af.head.head) && /Obi in cuffs/.test(af.head.ded), 'headline changes — and Obi is still arrested');
  h.assert(/FAILS/.test(af.review) && /KC was held/.test(af.review), 'aftermath line about the wrongly held person');
  const later = await h.ev(() => {
    // the next hub's phone and news board
    V12.mem().hubs.h4_delivered = 0; V12.deliverPhone('h4');
    const ph = V12.mem().phone.kcmum;
    V12.openNews(); const news = document.getElementById('screen-news').textContent; showOverlay(null);
    // the board's notes
    V12.openOps('lagos'); document.getElementById('ops-notes').click();
    return new Promise(r => setTimeout(() => { const notes = (document.querySelector('#screen-ops .ops-notes') || {}).textContent || ''; V12.closeOps();
      const epi = epilogueSlides().find(s => s.name === 'KC');
      r({ phone:ph && ph.msgs.map(m => m.text).join(' '), news, notes, epi:epi && epi.text }); }, 120));
  });
  h.assert(/seventeen/.test(later.phone || ''), 'a phone message from KC\'s mother at the next hub');
  h.assert(/Ikeja asks who signed/.test(later.news), 'a news-board clip about the wrongful arrest');
  h.assert(/Charge sheet, Lagos: named KC\. Wrongly held\./.test(later.notes), 'a line in the board notes\' decisions');
  h.assert(/kingpin/.test(later.epi || ''), 'an epilogue line for KC');

  // ---------- 3. wrong METHOD ----------
  await toCommander();
  await L.fileSheet({ suspect:'obi', method:'alerts', money:'wallet' });
  await L.finishDialogue(); await h.step(300);
  af = await L.aftermath('m3');
  const q3 = await h.ev(() => S.game.evQ || {});
  h.log('method aftermath', af.d, q3);
  h.assert(af.d.pt === 0 && af.d.af === -2, 'wrong method: Agency Favour −2 exactly (and no all-right bonus)');
  h.assert(/Agency Standing −2, grade −5/.test(af.review), 'wrong method: the review states the cost');
  h.assert(q3.phishing_template === 'weak' && q3.kc_sims === 'weak', 'wrong method: the phishing template and KC\'s SIMs are contested');
  h.assert(!/Teen|Informant|POS Agent/.test(af.head.head), 'headline unchanged for a right suspect');

  // ---------- 4. wrong MONEY TRAIL (with the money-trail theory on the table) ----------
  await toCommander(S => { S.game.ops = { pencils:[], inked:[], theories:{ t_money:true }, tries:0, sinceInk:0 }; S.game.intelScore = 70;
    S.game.evidence = [{ id:'obi_notebook', name:"Obi's Notebook" }, { id:'co_madam', name:'Phone' }]; });
  await L.fileSheet({ suspect:'obi', method:'phish', money:'coop' });
  await L.finishDialogue(); await h.step(300);
  af = await L.aftermath('m3');
  const q4 = await h.ev(() => ({ q:S.game.evQ || {}, lost:S.game.accusations.lagos.tmoneyLost, strong:Object.keys((S.game.ops.theories.t_madam = true, V12.strongAgainstAdaeze())) }));
  h.log('money aftermath', af.d, af.intel, q4);
  h.assert(af.d.pt === 0 && af.d.af === -2, 'wrong money: Agency Favour −2 exactly');
  h.assert(q4.q.cash === 'weak' && q4.q.obi_notebook === 'weak', 'wrong money: the cash and the notebook are contested');
  h.assert(af.intel === -15 && q4.lost === true, 'wrong money: the t_money +15 intel is struck');
  h.assert(!q4.strong.includes('obi_notebook'), 'the contested notebook no longer counts as a finale proof');

  // ---------- the other wrong names: headlines ----------
  const heads = await h.ev(() => {
    const out = {};
    for(const who of ['pos', 'tunde']){
      S.game.accusations = {}; CW.file('lagos', { suspect:who, method:'phish', money:'wallet' }, { warrant:'signed' });
      S.game.currentMission = 'm3'; CW.settle('lagos'); out[who] = generateHeadline().head;
    }
    return out;
  });
  h.assert(/POS Agent Detained/.test(heads.pos) && /Its Own Market Informant/.test(heads.tunde), 'POS agent and Tunde get their own headlines');
  h.log('PASS casework_lagos', tag);
};
