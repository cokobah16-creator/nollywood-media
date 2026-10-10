// v13 · B · rules on the briefing surfaces (design §2, A8, A10, A11).
// Senior (default) vs Recruit: the stakeout plate match is the player's call in Senior (no toast,
// no MATCH line, no +10 intel; the flag is still set silently); gatekeeper choice tags only in
// Recruit. Tunde wrongly held → his lead and tip are blocked; the POS agent wrongly held → the
// attendant only gives the badge answer. The h7 briefing never names Akintola Close or a blue gate.
// Visual rules on every screen this team owns (run at 390x844 --touch 1 and at 1280x800).
const LIB = require('./v13_b_lib.cjs');
const BASE = ['m0', 'm1', 'm2', 'h2', 'm3', 'm3n'];
module.exports = async h => {
  const B = LIB.lib(h);
  const touch = await h.ev(() => document.body.classList.contains('touch-active'));
  const W = await h.ev(() => innerWidth);
  const tag = (touch ? 'touch' : 'desk') + W;
  const V = (name, sel, o) => B.visual(`b_${name}_${tag}`, sel, o);
  const open = (k, video) => h.ev(([k, video]) => { window.__brfDone = 0; openBriefing(k, () => { window.__brfDone++; }, { video }); }, [k, video]);
  const lagos = suspect => `S.game.accusations = { lagos:{ suspect:'${suspect}', method:'alerts', money:'wallet', ok:{ suspect:${suspect === 'obi'}, method:true, money:true }, warrant:'signed', settled:'m3' } };`;
  const toast = () => h.ev(() => { const t = document.getElementById('toast'); return t && t.classList.contains('show') ? t.textContent : ''; });

  // icons used by the briefing file all exist
  const names = B.iconNames();
  const missing = await h.ev(n => n.filter(x => !icon(x)), names);
  h.log('icons', names.join(','));
  h.assert(missing.length === 0, 'no intended icon renders empty: ' + missing.join(','));
  // data: no WEEK numbers, no AKS, the h7 copy is clean
  const data = await h.ev(() => ({ all:JSON.stringify(BRIEFINGS) + JSON.stringify(GATEKEEPER_DIALOGUE) + TIP_TRUE + TIP_FALSE,
    h7:JSON.stringify(BRIEFINGS.m7) + JSON.stringify(['gk_caretaker', 'gk_care_igbo', 'gk_care_listen', 'gk_care_threat'].map(k => GATEKEEPER_DIALOGUE[k])) + TIP_TRUE + TIP_FALSE }));
  h.assert(!/\bAKS\b/.test(data.all) && !/WEEK \d/.test(data.all), 'no AKS and no "WEEK n" in the briefing data');
  h.assert(!/Akintola|blue gate/i.test(data.h7), 'h7 data never names Akintola Close or a blue gate');

  // ---------- the Week-1 plan (in person) and the POS attendant, wrongly held ----------
  await B.toHub('m4', BASE, new Function('S', `S.game.intel = { items:{}, briefed:{} }; S.game.evidence = [{ id:'laptop', name:'Encrypted laptop' }]; ${lagos('pos')}`), { wait:1200 });
  await h.ev(() => { S.game.currentMission = 'm3n'; showHUD(false); });
  await open('m3', false);
  await V('w1_plan', '#screen-briefing');
  await B.plan(['drives', 'pos']);
  await V('w1_out_first', '#screen-briefing');
  await B.click('#screen-briefing [data-b="next"]');
  h.assert(await B.shown('screen-dialogue') && await h.ev(() => DLG.scriptKey === 'gk_pos'), 'the POS call runs (it still runs when the agent was held)');
  await B.dialogues();
  await V('gk_portrait', '#dialogue-portrait');
  const port = await h.ev(() => { const w = document.getElementById('dialogue-portrait'); const r = w.querySelector('svg rect'); const p = w.querySelector('svg path');
    return { gk:!!w.querySelector('.v13-gk'), bg:r && getComputedStyle(r).fill, fig:p && getComputedStyle(p).fill, cmd:/#0b1426/i.test(w.innerHTML) }; });
  h.log('gk portrait', port);
  h.assert(port.gk && port.bg === 'rgb(140, 132, 115)' && port.fig === 'rgb(38, 38, 35)' && !port.cmd, 'gatekeeper: ink-2 silhouette on manila-3, not the Commander\'s portrait');
  const tags = await h.ev(() => { document.body.classList.add('v12-tags'); if(typeof skipTypewriter === 'function') skipTypewriter(); return { data:DIALOGUE.gk_pos[0].choices.map(c => c.tag || ''), dom:document.querySelectorAll('#dlg-choices .tag').length }; });
  h.assert(tags.data.every(t => !t) && tags.dom === 0, 'Senior: no choice tags on gatekeeper choices');
  await B.choose('custom');
  h.assert(await h.ev(() => DLG.scriptKey === 'gk_pos_badge'), 'POS wrongly held: the attendant answers with the badge line whatever you say');
  await B.dialogues();
  await h.step(200);
  const posTxt = await B.text('#screen-briefing .brf-note');
  h.assert(/Odogwu Ventures/.test(posTxt) && !/Sienna/.test(posTxt), 'POS wrongly held: only Odogwu Ventures');
  h.assert(await h.ev(() => !!S.game.intel.money.unlocked.n_odogwu && !!S.game.intel.reg.found.odogwu && S.game.intel.leads.pos === 'done'), 'POS wrongly held: the hub and its registry, nothing else');
  await V('w1_out', '#screen-briefing');
  await B.runToEnd();
  await B.click('#screen-briefing [data-b="done"]');
  await h.step(3300);
  h.assert(await h.ev(() => window.__brfDone === 1), 'the continuation runs once');

  // ---------- Recruit: tags shown, and Tunde wrongly held blocks his lead ----------
  await B.toHub('m6', BASE.concat(['m4', 'h4', 'm5']), new Function('S', `S.game.mem = { hubs:{ h2:1, h4:1 }, street:{}, phone:{}, reply:{}, seen:{} };
    S.game.intel = { items:{}, briefed:{ m3:true, m4:true }, reg:{ found:{ bluewater:true, apex:true }, ctc:{} }, flags:{ lead_gatehouse:true } };
    ${lagos('tunde')} S.game.accusations.route = { suspect:'ifeanyi', method:'route', money:'asaba', ok:{ suspect:true, method:true, money:true }, warrant:'signed' };`));
  await open('m5', true);
  const tun = await h.ev(() => { const b = document.querySelector('#screen-briefing [data-b="lead"][data-id="tunde"]'); return { dis:b.disabled, txt:b.textContent }; });
  h.assert(tun.dis && /stopped taking your calls after your charge sheet put him in a cell/.test(tun.txt), 'Tunde wrongly held: "Re-interview Tunde" is blocked with the in-world reason');
  await V('h5_plan', '#screen-briefing');
  await B.click('#screen-briefing [data-b="dec"][data-k="order"][data-v="comply"]');
  await V('h5_plan_dec', '#screen-briefing');
  // Senior van: the plate is the player's call
  const i0 = await h.ev(() => S.game.intelScore || 0);
  await B.plan(['stakeout', 'undercover'], { order:'comply' });
  h.assert(await B.shown('screen-so'), 'the van');
  await V('van_start', '#screen-so');
  for(const a of ['next', 'next', 'next', 'next', 'next']) await B.click(`#screen-so [data-so="${a}"]`);
  await V('van_corolla', '#screen-so');
  await B.click('#screen-so [data-so="photo"]');
  await B.click('#screen-so [data-so="plate"]');
  const sen = await h.ev(() => ({ match:!!S.game.intel.flags.so_plate_match, log:document.getElementById('so-log').textContent, intel:S.game.intelScore || 0 }));
  const tSen = await toast();
  h.log('senior plate', sen, tSen);
  h.assert(sen.match && !/MATCH/.test(sen.log) && !/PLATE MATCH/.test(tSen) && sen.intel === i0, 'Senior: plate logged only — no toast, no MATCH line, no +10; the match flag is set silently');
  await B.click('#screen-so [data-so="next"]', 2);
  await B.click('#screen-so [data-so="back"]');
  await V('van_end', '#screen-so');
  await B.click('#screen-so [data-so="finish"]');
  await h.step(200);
  h.assert(!/gatehouse/i.test(await B.text('#screen-briefing .brf-note')), 'Senior: the van summary does not draw the conclusion');
  await B.click('#screen-briefing [data-b="next"]');
  h.assert(await B.shown('screen-uc'), 'the wire');
  await V('uc_cover', '#screen-uc');
  await B.click('#screen-uc [data-uc="go"]');
  await V('uc_question', '#screen-uc');
  await B.click('#screen-uc [data-uc="ans"][data-k="0"]');
  await B.click('#screen-uc [data-uc="ans"][data-k="1"]');                   // "A friend at NACECA": +75
  await B.click('#screen-uc [data-uc="probe"]');                             // +15 → 90
  await V('uc_probe_log', '#screen-uc');
  await B.click('#screen-uc [data-uc="ans"][data-k="2"]');                   // +25 → blown
  await V('uc_result', '#screen-uc');
  h.assert(/blown/.test(await B.text('#screen-uc .uc-res')) && /a pause\. Too long\./.test(await B.text('#uc-body')), 'the wire: same in both modes (pause line, blown)');
  await B.click('#screen-uc [data-uc="end"]');
  await V('h5_out', '#screen-briefing');
  await B.runToEnd(); await B.click('#screen-briefing [data-b="done"]'); await h.step(600);

  // Recruit van and tags
  await B.toHub('m6', BASE.concat(['m4', 'h4', 'm5']), new Function('S', `S.game.difficulty = 'recruit'; S.game.mem = { hubs:{ h2:1, h4:1 }, street:{}, phone:{}, reply:{}, seen:{} };
    S.game.intel = { items:{}, briefed:{ m3:true, m4:true }, reg:{ found:{ bluewater:true, apex:true }, ctc:{} }, flags:{ lead_gatehouse:true } };
    ${lagos('obi')} S.game.accusations.route = { suspect:'ifeanyi', method:'route', money:'asaba', ok:{ suspect:true, method:true, money:true }, warrant:'signed' };`));
  await h.ev(() => { if(typeof syncDifficultyClass === 'function') syncDifficultyClass(); });
  h.assert(await h.ev(() => isRecruit()), 'Recruit on');
  await open('m5', true);
  h.assert(await h.ev(() => !document.querySelector('#screen-briefing [data-b="lead"][data-id="tunde"]').disabled), 'Tunde not held: his lead is open');
  const r0 = await h.ev(() => S.game.intelScore || 0);
  await B.plan(['stakeout', 'undercover'], { order:'comply' });
  for(const a of ['next', 'next', 'next', 'next', 'next']) await B.click(`#screen-so [data-so="${a}"]`);
  await B.click('#screen-so [data-so="plate"]');
  const rec = await h.ev(() => ({ match:!!S.game.intel.flags.so_plate_match, log:document.getElementById('so-log').textContent, intel:S.game.intelScore || 0 }));
  const tRec = await toast();
  h.log('recruit plate', rec, tRec);
  h.assert(rec.match && /MATCH/.test(rec.log) && /PLATE MATCH/.test(tRec) && rec.intel - r0 === 10, 'Recruit: PLATE MATCH toast, MATCH line, +10 intel');
  await V('van_match_recruit', '#screen-so');
  await B.vanDrive(['next', 'next', 'wait', 'finish']);
  h.assert(/the car from the Lekki gatehouse log/.test(await B.text('#screen-briefing .brf-note')), 'Recruit: the van summary may draw the conclusion');
  // the wire, every probe taken: the log stays glyph-free
  await B.click('#screen-briefing [data-b="next"]');
  await B.ucDrive(['go', ['ans', 0], ['ans', 0], 'probe', ['ans', 0], ['ans', 0], 'probe', ['ans', 0], 'probe'], { stay:true });
  await V('uc_all_probes', '#screen-uc');
  h.assert(/C\.A\. Consulting Services Ltd to the Ugbowo Relief Foundation/.test(await B.text('#uc-body')), 'the invoice line, no arrow glyph');
  await B.click('#screen-uc [data-uc="end"]');
  await B.runToEnd(); await B.click('#screen-briefing [data-b="done"]'); await h.step(600);
  // Recruit gatekeeper tags (h6 trustees call)
  await B.toHub('m7', BASE.concat(['m4', 'h4', 'm5', 'h5', 'm6']), new Function('S', `S.game.difficulty = 'recruit'; S.game.mem = { hubs:{ h2:1, h4:1, h5:1 }, street:{}, phone:{}, reply:{}, seen:{} };
    S.game.intel = { items:{}, briefed:{ m3:true, m4:true, m5:true } }; S.game.evidence = [{ id:'asaba_sims', name:'SIMs' }];`));
  await h.ev(() => { if(typeof syncDifficultyClass === 'function') syncDifficultyClass(); });
  await B.warrant({ strength:30, signed:false, refused:false, strikes:1, need:'Ink more links' });
  await open('m6', true);
  await V('h6_plan', '#screen-briefing');
  await B.plan(['burner', 'trustees'], { press:'bodycam' });
  await B.runToEnd({ until: s => s.dlg && s.key === 'gk_foundation' });
  await B.dialogues();
  const rtags = await h.ev(() => (typeof skipTypewriter === 'function' && skipTypewriter(), { data:DIALOGUE.gk_foundation[0].choices.map(c => c.tag || ''), dom:document.querySelectorAll('#dlg-choices .tag').length }));
  h.log('recruit tags', rtags);
  h.assert(rtags.data.every(t => t) && rtags.dom === 3, 'Recruit: gatekeeper choice tags shown');
  await B.choose('respect');
  await B.runToEnd({ until: s => s.phase === 'warrant' });
  await V('h6_warrant_unsigned', '#screen-briefing');
  await B.click('#screen-briefing [data-b="w-none"]');
  await V('h6_warrant_armed', '#screen-briefing');
  await B.click('#screen-briefing [data-b="w-none"]');
  await V('h6_out', '#screen-briefing');
  await B.runToEnd(); await B.click('#screen-briefing [data-b="done"]'); await h.step(600);
  await h.ev(() => { S.game.difficulty = 'senior'; if(typeof syncDifficultyClass === 'function') syncDifficultyClass(); });

  // ---------- h7: Tunde held blocks the tip; the DOM never says Akintola or blue gate ----------
  for(const branch of ['igbo', 'listen', 'threat']){
    await B.toHub('t7', BASE.concat(['m4', 'h4', 'm5', 'h5', 'm6', 'h6', 'm7']), new Function('S', `S.game.mem = { hubs:{ h2:1, h4:1, h5:1, h6:1 }, street:{}, phone:{}, reply:{}, seen:{} };
      S.game.intel = { items:{}, briefed:{ m3:true, m4:true, m5:true, m6:true }, warrants:{ w_cdr:{ status:'signed' } } }; S.game.evidence = [{ id:'tower_fix', name:'Handset fix' }]; ${lagos('tunde')}`));
    await B.warrant({ strength:70, signed:true, refused:false, strikes:0, need:'' });
    await h.ev(() => {
      window.__seen7 = [];
      if(!window.__rdl7){ window.__rdl7 = true; const r = window.renderDialogueLine; window.renderDialogueLine = function(){ const l = DLG.script && DLG.script[DLG.idx]; if(l) window.__seen7.push((l.speaker || '') + ' ' + (l.text || '') + ' ' + (l.textEn || '') + ' ' + (l.choices || []).map(c => c.text).join(' ')); return r.apply(this, arguments); }; }
      const b = document.getElementById('screen-briefing'); window.__dom7 = '';
      const mo = new MutationObserver(() => { window.__dom7 += ' ' + b.textContent; }); mo.observe(b, { childList:true, subtree:true, characterData:true }); window.__mo7 = mo;
    });
    await open('m7', true);
    const tip = await h.ev(() => { const b = document.querySelector('#screen-briefing [data-b="lead"][data-id="tip"]'); return { dis:b.disabled, txt:b.textContent }; });
    h.assert(tip.dis && /stopped taking your calls/.test(tip.txt), 'Tunde wrongly held: his tip is blocked too');
    h.assert(await h.ev(() => { const p = document.querySelector('#screen-briefing .brf-advice p'); return !!p && !/Tunde/.test(p.textContent); }), 'Tunde wrongly held: her advice no longer sends you to his tip');
    if(branch === 'igbo') await V('h7_plan', '#screen-briefing');
    await B.plan(['caretaker', 'pattern']);
    await B.runToEnd({ gk:{ gk_caretaker:branch }, until: s => s.phase === 'warrant' });
    if(branch === 'igbo'){ await V('h7_warrant', '#screen-briefing'); await B.click('#screen-briefing [data-b="w-route"][data-v="zonal"]'); await V('h7_warrant_armed', '#screen-briefing'); await B.click('#screen-briefing [data-b="w-route"][data-v="zonal"]'); }
    await B.runToEnd({ warrant: () => B.click('#screen-briefing [data-b="w-route"][data-v="commander"]', 2) });
    const seen = await h.ev(() => { window.__mo7.disconnect(); return { dom:window.__dom7 + ' ' + document.getElementById('screen-briefing').textContent, dlg:window.__seen7.join(' | ') }; });
    h.assert(seen.dlg.length > 20 && /CARETAKER/.test(seen.dlg), 'the caretaker call ran (' + branch + ')');
    h.assert(!/Akintola|blue gate/i.test(seen.dom) && !/Akintola|blue gate/i.test(seen.dlg), 'h7 (' + branch + '): never Akintola Close or a blue gate');
    h.assert(!/\bWEEK \d/.test(seen.dom), 'no WEEK n on screen');
    const src = await h.ev(() => (S.game.flags || {}).backgate_src || null);
    h.assert(branch === 'threat' ? src === null : src === 'caretaker', 'the back-way tip is credited to the caretaker when he gave it (' + branch + ': ' + src + ')');
    await B.click('#screen-briefing [data-b="done"]'); await h.step(500);
  }
  h.log('PASS v13_b_rules', tag);
};
