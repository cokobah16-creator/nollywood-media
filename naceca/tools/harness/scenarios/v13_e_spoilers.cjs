// v13 · E · spoilers and canon (the content & canon pass, CONTENT-v13.md decisions 1–13).
// A first-time Senior Agent works every v13 surface from Case 02 to the h7 call: the Case Desk (locker,
// phones, money, registry searches for 'apex', 'C.A.', 'consulting', 'zuma', statements, warrants), the
// Week-1 briefing and the h4–h7 calls with their leads, gatekeeper calls, the Abuja van and the officer on
// a wire, and the radio. Everything rendered is collected; none of it may contain:
//   - Adaeze / the Commander / her office tied to "C.A." (in one line or sentence)
//   - her tenure ("since March 2019", "in command since", "the month she took command")
//   - "CONTROL" (the contact is "C."), "motor pool", "NACECA pool car" / "agency car" (before the h5 plate
//     match — and, in Senior, at all), "Akintola" or "blue gate" (before the t7 tail), "AKS"
// The same rules run on every pre-M8 data string (belt and braces), and on a Recruit pass of the desk.
// Then the canon test: Tobi's branch reads the same in the h6 lead, the review, the epilogue, the court and
// the radio for rescue / chase-alive / chase-lost (and with Tobi wrongly named on the route sheet).
//   node tools/harness/run.cjs tools/harness/scenarios/v13_e_spoilers.cjs --html <build>/naceca.html [--w 390 --h 844 --touch 1]
const LIB = require('./v13_b_lib.cjs');

// ---- page side: everything a v13 surface renders, tagged with the stage of the season it was seen in ----
const PAGE = String.raw`
window.__E = (function(){
  const seen = [], keys = new Set();
  let stage = 'start';
  const add = (src, t) => {
    t = String(t == null ? '' : t).replace(/[ \t]+/g, ' ').trim(); if(!t) return;
    const k = stage + '|' + src + '|' + t; if(keys.has(k)) return; keys.add(k); seen.push({ stage, src, t });
  };
  const V13 = ['screen-briefing', 'screen-so', 'screen-uc', 'screen-desk'];
  function grab(){
    for(const id of V13){
      const el = document.getElementById(id); if(!el || !el.classList.contains('show')) continue;
      el.querySelectorAll('details').forEach(d => { d.open = true; });                // custody chains too
      add(id, el.innerText || el.textContent);
    }
    const tt = document.getElementById('toast'); if(tt && tt.classList.contains('show')) add('toast', tt.innerText || tt.textContent);
    const dn = document.getElementById('desk-note'); if(dn && dn.classList.contains('on')) add('desk-note', dn.innerText || dn.textContent);
  }
  let queued = false;
  new MutationObserver(() => { if(queued) return; queued = true; Promise.resolve().then(() => { queued = false; try{ grab(); }catch(e){} }); })
    .observe(document.body, { childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:['class'] });
  // gatekeeper lines (every v13 call), toasts and radio bulletins
  const rdl = window.renderDialogueLine;
  window.renderDialogueLine = function(){
    try{ const k = (typeof DLG !== 'undefined' && DLG.scriptKey) || '', l = DLG.script && DLG.script[DLG.idx];
      if(l && /^gk_/.test(k)) add('dlg:' + k, [l.speaker, l.text, l.textEn, (l.choices || []).map(c => c.text).join(' | ')].filter(Boolean).join('\n')); }catch(e){}
    return rdl.apply(this, arguments);
  };
  const ts = window.toast; window.toast = function(b, s){ add('toast', String(b) + '\n' + String(s || '')); return ts.apply(this, arguments); };
  const rl = window.radioLine; if(typeof rl === 'function') window.radioLine = function(sp, t){ add('radio', String(sp) + '\n' + String(t)); return rl.apply(this, arguments); };
  return { seen, add, grab, setStage(v){ grab(); stage = v; } };
})();`;

// ---- the rules (node side) ----
// abbreviations never end a sentence; "C.A." and "C." stay one token
const norm = s => s.replace(/\bC\.A\./g, 'CA_').replace(/\b(Cdr|Mrs|Mr|Sgt|Barr|Rev|Engr|Insp|Alh|Ltd|Nig|No|Dr|St|Agt|ss?)\./g, '$1_').replace(/\bC\./g, 'C_');
const sentences = t => t.split(/\n+/).flatMap(line => norm(line).split(/(?<=[.!?])\s+/));
const TIE = s => /\b(Adaeze|Commander|her office)\b/i.test(s) && /\bCA_|\bC\.A\b|\bCA Consulting/i.test(s);
const RULES = [
  ['the Commander tied to C.A.', t => sentences(t).find(TIE)],
  ['her tenure', t => (t.match(/since March 2019|in command since|(month|year) she took (command|over)|took command of the unit/i) || [])[0]],
  ['"CONTROL"', t => (t.match(/\bCONTROL\b/) || [])[0]],
  ['motor pool', t => (t.match(/motor[\s-]?pool/i) || [])[0]],
  ['NACECA / agency pool car', t => (t.match(/NACECA[^.\n]{0,24}\b(pool )?car\b|agency car|pool car/i) || [])[0]],
  ['AKS', t => (t.match(/\bAKS\b/) || [])[0]],
];
const PRE_T7 = [['Akintola', t => (t.match(/Akintola/i) || [])[0]], ['blue gate', t => (t.match(/blue gate/i) || [])[0]]];

module.exports = async h => {
  const B = LIB.lib(h);
  const touch = await h.ev(() => document.body.classList.contains('touch-active'));
  const tag = (touch ? 'touch' : 'desk') + (await h.ev(() => innerWidth));
  const fails = [];
  const check = (label, text, rules) => { for(const [name, f] of rules){ const hit = f(text); if(hit) fails.push(`${label}: ${name} — "${String(hit).slice(0, 140)}"`); } };

  // ================= 0. every pre-M8 data string a player can be shown =================
  const data = await h.ev(() => {
    const out = [];
    const push = (k, v) => { if(typeof v === 'string') out.push([k, v]); };
    PHONES.forEach(p => { push('phone ' + p.id, p.name + ' ' + p.model); p.items.forEach(c => { push('phone ' + c.id, [c.from, c.text, c.why].filter(Boolean).join('\n')); }); });
    Object.entries(MONEY_NODES).forEach(([k, n]) => push('money ' + k, n.name + '\n' + n.desc));
    Object.entries(REGISTRY).forEach(([k, e]) => push('registry ' + k, [e.name, e.no, e.type, e.inc, ...(e.people || []), e.sec, e.addr].join('\n')));
    // h2's why is shown only once the M8 recording is held (after the reveal)
    STATEMENTS.forEach(s => s.claims.forEach(c => push('statement ' + c.id, c.text + (c.id === 'h2' ? '' : '\n' + (c.why || '')))));
    Object.entries(BRIEFINGS).forEach(([k, b]) => {
      push('brief ' + k, [b.title, b.sub, b.intro, b.advice && b.advice.text, b.advice && b.advice.alt, b.custody && b.custody.ask, b.order && b.order.text].filter(Boolean).join('\n'));
      b.leads.forEach(l => push('lead ' + l.id, [l.name, l.desc, l.res, l.dropped, l.blocked, l.heatBlocked, l.tailBlocked].filter(Boolean).join('\n')));
    });
    Object.entries(GATEKEEPER_DIALOGUE).forEach(([k, lines]) => lines.forEach((l, i) => push('gk ' + k + i, [l.speaker, l.text, l.textEn, ...(l.choices || []).map(c => c.text)].filter(Boolean).join('\n'))));
    push('tip', TIP_TRUE + '\n' + TIP_FALSE);
    Object.entries(INV_NAMES).forEach(([k, v]) => push('exhibit ' + k, v));
    Object.entries(INTEL_ITEMS).filter(([, m]) => m.m !== 'm8').forEach(([k, m]) => push('source ' + k, m.src));
    Object.entries(INTEL_NAMES).filter(([k]) => !/^(fin_|bodycam)/.test(k)).forEach(([k, v]) => push('label ' + k, v));
    Object.entries(FACTS).forEach(([k, v]) => push('fact ' + k, v));
    WARRANTS.forEach(w => push('warrant ' + w.id, w.name + '\n' + w.court));
    push('radio', [RADIO_STATION, ...RADIO_FILLER, ...RADIO_RUMOURS.map(r => r.text)].join('\n'));
    return out;
  });
  for(const [k, v] of data) check('data ' + k, v, RULES.concat(PRE_T7));
  h.log('data strings checked:', data.length);

  // ================= 1. Case 02: KC's phone, an empty money tab, the register =================
  await h.start('m2', { completed:['m0', 'm1'], briefings:true, state:S => { S.game.intel = { items:{}, briefed:{} }; } });
  await h.page.addScriptTag({ content:PAGE });
  const stage = s => h.ev(s => __E.setStage(s), s);
  const ev = ids => h.ev(ids => { ids.forEach(id => { if((S.game.evidence || []).some(e => e.id === id)) return; const e = { id, name:(typeof INTEL_NAMES !== 'undefined' && INTEL_NAMES[id]) || id }; S.game.evidence.push(e); intelOnEvidence(e); }); }, ids);
  // the desk, every tab and sub-view, the way a careful player reads it
  const deskTour = async () => {
    await h.ev(() => {
      const g = () => __E.grab();
      openDesk('locker'); g();
      deskDo('goto', { tab:'phones' }); g();
      PHONES.filter(p => typeof phoneUnlocked === 'function' && phoneUnlocked(p)).forEach(p => {
        deskDo('phone', { id:p.id }); g();
        [...new Set(p.items.map(c => c.sec))].forEach(sec => { deskDo('sec', { sec }); p.items.filter(c => c.sec === sec).forEach(c => { if(!I().flagged[c.id]) deskDo('flag', { id:c.id }); }); g(); });
        deskDo('phone-back'); g();
      });
      deskDo('goto', { tab:'money' }); g();
      if(I().money) I().money.req = Math.max(I().money.req || 0, 30);
      for(let i = 0; i < 30; i++){ const b = document.querySelector('#desk-body [data-act="trace"]:not([disabled])'); if(!b) break; deskDo('trace', { id:b.dataset.id }); g(); }
      deskDo('goto', { tab:'registry' }); g();
      for(const q of ['apex', 'C.A.', 'consulting', 'zuma', 'bluewater', 'kunle', 'sapele']){
        const inp = document.getElementById('reg-q'); if(inp) inp.value = q; DESK.regQ = q; deskDo('reg-search'); g();
        [...document.querySelectorAll('#desk-body .dk-slip')].map(b => b.dataset.key).forEach(k => { deskDo('reg-open', { key:k }); g(); deskDo('reg-back'); });
      }
      Object.keys(I().reg.found || {}).forEach(k => { deskDo('reg-open', { key:k }); g();
        const a = document.querySelector('#desk-body [data-act="reg-addr"]'); if(a){ deskDo('reg-addr', { addr:a.dataset.addr }); g(); } deskDo('reg-back'); });
      deskDo('goto', { tab:'statements' }); g();
      STATEMENTS.filter(s => typeof stAvailable === 'function' && stAvailable(s)).forEach(s => { deskDo('st', { id:s.id }); g(); deskDo('st-back'); });
      deskDo('goto', { tab:'warrants' }); g();
      deskDo('goto', { tab:'locker' }); g();
      closeDesk();
    });
    await h.step(80);
  };
  const lagos = { suspect:'obi', method:'phish', money:'wallet', ok:{ suspect:true, method:true, money:true }, warrant:'signed', settled:'m3' };
  const route = { suspect:'ifeanyi', method:'route', money:'asaba', ok:{ suspect:true, method:true, money:true }, warrant:'signed', settled:'m6' };

  await stage('c02');
  await ev(['phishing_template', 'kc_sims']);
  await h.ev(() => { showOverlay(null); showHUD(true); ENGINE.movementEnabled = true; });
  await deskTour();
  const c02 = await h.ev(() => ({ ca:!!I().reg.found.ca, apex:!!I().reg.found.apex, traced:Object.keys(I().money.traced || {}).length }));
  h.assert(c02.apex && !c02.ca, 'Case 02: "apex" finds Apex, but neither a name search nor the Zuma Court address search lists C.A. Consulting');
  h.assert(c02.traced === 0, 'Case 02: nothing can be traced before the Lagos charge sheet');

  // ================= 2. after Lekki: the Week-1 briefing at Lagos HQ, the next morning =================
  await stage('w1');
  await h.ev(lagos => { S.game.accusations = { lagos }; S.game.completedMissions.push('h2', 'm3', 'm3n'); S.game.currentMission = 'm3n'; }, lagos);
  await ev(['laptop', 'cash', 'safe_drives', 'obi_notebook', 'osas_voicemail']);
  const open = (k, video) => h.ev(([k, video]) => { window.__eDone = 0; openBriefing(k, () => { window.__eDone++; }, { video }); __E.grab(); }, [k, video]);
  await open('m3', false);
  h.assert(/NACECA HQ · LAGOS · THE NEXT MORNING/.test(await B.text('#brf-bar')), 'Week 1: Lagos HQ, the next morning');
  h.assert(!/good work/i.test(await B.text('#screen-briefing .brf-say')), 'Week 1: the intro does not repeat Night Shift\'s "good work"');
  await B.plan(['drives', 'gatehouse']);
  await B.runToEnd();
  const gate = await B.text('#screen-briefing .brf-note');
  h.assert(/LND-412-KJ/.test(gate) && /government plates/.test(gate), 'the gatehouse log: a plate and a government car');
  await B.click('#screen-briefing [data-b="done"]'); await h.step(300);
  await deskTour();
  const w1 = await h.ev(() => ({ ca:!!I().reg.found.ca, n_ca:!!I().money.traced.n_ca, obi:!!I().money.traced.n_obi, bw:!!I().money.traced.n_bluewater, charity:!!I().money.traced.n_charity }));
  h.log('after Week 1', JSON.stringify(w1));
  h.assert(w1.obi && !w1.bw && !w1.charity && !w1.n_ca && !w1.ca, 'the Lagos trail ends at Obi and the Foundation is listed but closed; no route node, no C.A.');

  // ================= 3. h4: the ledger to her office, Musa, the CAC (video call) =================
  await stage('h4');
  await h.ev(() => { S.game.completedMissions.push('m4'); S.game.currentMission = 'h4'; S.game.moralChoices = Object.assign(S.game.moralChoices || {}, { checkpoint:'arrest_driver' }); });
  await ev(['ransom_ledger', 'musa_statement', 'broken_seal', 'concealed_arms']);
  await open('m4', true);
  await B.plan(['musa', 'cac'], { custody:'gave' });
  await B.runToEnd();
  await B.click('#screen-briefing [data-b="done"]'); await h.step(300);
  await deskTour();
  const h4 = await h.ev(() => ({ ca:!!I().reg.found.ca, cluster:!!I().flags.zuma_cluster, n_ca:!!I().money.traced.n_ca, bw:!!I().money.traced.n_bluewater }));
  h.log('after h4', JSON.stringify(h4));
  h.assert(h4.ca && h4.cluster, 'h4: the Zuma Court address search lists C.A. Consulting (the player\'s own search)');
  h.assert(!h4.n_ca && !h4.bw, 'h4: the route\'s money (Bluewater) and C.A. can\'t be traced before the route charge sheet');

  // ================= 4. h5: the route sheet is filed; the Engineer order; the van; the wire =================
  await stage('h5pre');
  await h.ev(route => { S.game.accusations.route = route; S.game.completedMissions.push('h4', 'm5'); S.game.currentMission = 'h5'; }, route);
  await open('m5', true);
  await B.plan(['stakeout', 'undercover'], { order:'confront' });
  h.assert(await B.shown('screen-so'), 'the Abuja van');
  for(const a of ['photo', 'next', 'next', 'photo', 'next', 'next', 'photo', 'plate', 'next', 'photo']) await B.click(`#screen-so [data-so="${a}"]`);
  await stage('h5');                                   // the Corolla's plate goes in the log now
  await B.click('#screen-so [data-so="plate"]');
  h.assert(await h.ev(() => !!I().flags.so_plate_match), 'the plate match is set (silently, in Senior)');
  await B.vanDrive(['next', 'follow', 'finish']);
  await B.runToEnd({ uc:['go', ['ans', 0], ['ans', 0], 'probe', ['ans', 0], ['ans', 0], 'probe', ['ans', 0], 'probe', 'end'] });
  await B.click('#screen-briefing [data-b="done"]'); await h.step(300);
  await deskTour();
  const h5 = await h.ev(() => ({ n_ca:!!I().money.traced.n_ca, inv:intelHas('inv_ca'), known:JSON.stringify(I().known) }));
  h.log('after h5', JSON.stringify(h5));
  h.assert(h5.n_ca && h5.inv, 'h5: the trail reaches C.A. Consulting once the route case is filed and the h5 call is on');
  h.assert(!/"engineer"/.test(h5.known), '"confront" hands over nothing: no Engineer–"C." fact');

  // ================= 5. h6: the burner, Tobi (rescued), the production order =================
  await stage('h6');
  await h.ev(() => { S.game.completedMissions.push('h5', 'm6'); S.game.currentMission = 'h6'; S.game.moralChoices.asaba = 'rescue'; });
  await ev(['asaba_sims', 'asaba_runner', 'asaba_hostage']);
  await B.warrant({ strength:70, signed:true, refused:false, strikes:0, need:'' });
  await open('m6', true);
  await B.plan(['burner', 'tobi'], { press:'trace' });
  await B.runToEnd();
  await B.click('#screen-briefing [data-b="done"]'); await h.step(300);
  await deskTour();

  // ================= 6. h7: before the tail — caretaker, the call pattern, the Ekosodin warrant =================
  await stage('h7');
  await h.ev(() => { S.game.completedMissions.push('h6', 'm7'); S.game.currentMission = 'h7'; S.game.moralChoices.tower = 'hold'; });
  await ev(['tower_fibre', 'tower_cdr', 'tower_fix']);
  await open('m7', true);
  await B.plan(['caretaker', 'pattern']);
  await B.runToEnd({ gk:{ gk_caretaker:'igbo' }, warrant: () => B.click('#screen-briefing [data-b="w-route"][data-v="commander"]', 2) });
  await B.click('#screen-briefing [data-b="done"]'); await h.step(300);
  await deskTour();
  const locker = await h.ev(() => { openDesk('locker'); const t = document.getElementById('desk-body').innerText; closeDesk(); return t; });
  h.assert(/WHO KNOWS WHAT/.test(locker) && /Lagos HQ/.test(locker) && !/Adaeze/.test(locker), 'the Locker lists her unit, never her, before the reveal');
  // the radio, every field operation, on the branches this player took and the others
  await h.ev(() => {
    const mc0 = Object.assign({}, S.game.moralChoices);
    for(const mc of [mc0, Object.assign({}, mc0, { shrine:'force', asaba:'failed' }), Object.assign({}, mc0, { shrine:'negotiate', asaba:'chase' })]){
      S.game.moralChoices = mc;
      ['m2', 'm3', 'm4', 'm5', 'm6', 'm7'].forEach(m => radioLines(m).forEach(t => __E.add('radio', RADIO_STATION + '\n' + t)));
    }
    S.game.moralChoices = mc0;
  });

  // ================= 7. the same desk on Recruit (Uche's notes, the toasts, statement feedback) =================
  await stage('recruit');
  await h.ev(() => { S.game.difficulty = 'recruit'; if(typeof syncDifficultyClass === 'function') syncDifficultyClass(); });
  await deskTour();
  await h.ev(() => {
    openDesk('statements');
    STATEMENTS.filter(s => stAvailable(s)).forEach(s => { deskDo('st', { id:s.id }); s.claims.forEach(c => { deskDo('verdict', { st:s.id, c:c.id, v:stExpected(c) }); __E.grab(); }); deskDo('st-back'); });
    closeDesk();
    S.game.difficulty = 'senior'; if(typeof syncDifficultyClass === 'function') syncDifficultyClass();
  });

  // ================= the verdict on everything rendered =================
  const seen = await h.ev(() => __E.seen.slice());
  const stages = [...new Set(seen.map(x => x.stage))];
  h.log('rendered texts collected:', seen.length, 'stages:', stages.join(','));
  h.assert(['c02', 'w1', 'h4', 'h5pre', 'h5', 'h6', 'h7', 'recruit'].every(s => stages.includes(s)), 'every stage rendered something');
  for(const x of seen) check(`[${x.stage}] ${x.src}`, x.t, RULES.concat(PRE_T7));
  // the surfaces the brief names were all on screen
  const srcs = new Set(seen.map(x => x.src.replace(/:.*/, '')));
  for(const s of ['screen-briefing', 'screen-desk', 'screen-so', 'screen-uc', 'dlg', 'radio']) h.assert(srcs.has(s), 'rendered: ' + s);
  const all = seen.map(x => x.t).join('\n');
  h.assert(/C\.A\. Consulting/.test(all) && /"C\."|C\. /.test(all) && /LND-412-KJ/.test(all), 'the earned clues are there: C.A. Consulting, "C.", the plate');

  // ================= 8. canon: Tobi reads the same everywhere =================
  const tobi = await h.ev(() => {
    const out = {};
    const branches = { rescue:{ asaba:'rescue', lost:false }, chase_alive:{ asaba:'chase', lost:false }, chase_lost:{ asaba:'chase', lost:true } };
    const base = JSON.parse(JSON.stringify(S.game.accusations || {}));
    const dropBase = (I().dropLog || []).filter(x => x.lead !== 'tobi');
    for(const [name, b] of Object.entries(branches)){
      for(const named of [false, true]){
        S.game.moralChoices = Object.assign({}, S.game.moralChoices, { asaba:b.asaba, finale:'proven' }); S.game._asabaHostageLost = b.lost;
        S.game.accusations = JSON.parse(JSON.stringify(base));
        if(named) S.game.accusations.route = { suspect:'tobi', method:'route', money:'asaba', ok:{ suspect:false, method:true, money:true }, warrant:'signed', settled:'m6' };
        // the h6 lead, on a fresh call (a dead Tobi's blocked lead leaves no "while you were busy" line)
        const d = I(); delete d.brf; delete d.briefed.m6; delete d.leads.tobi; d.dropLog = dropBase.slice();
        openBriefing('m6', () => {}, { video:true });
        const lb = document.querySelector('#screen-briefing [data-b="lead"][data-id="tobi"]');
        const lead = { open:!!lb && !lb.disabled, text:lb ? lb.textContent.replace(/\s+/g, ' ').trim() : '' };
        BRF.then = null; finishBriefing();
        d.leads.tobi = lead.open ? 'done' : 'dropped';
        const st = stAvailable(STATEMENTS.find(s => s.id === 'st_tobi'));
        S.game.seasonOneComplete = true;
        const div = document.createElement('div'); div.innerHTML = renderReviewHTML(false);
        const review = div.textContent.replace(/\s+/g, ' ');
        const epi = (epilogueSlides().find(x => x.name === 'TOBI ONUOHA') || {}).text || '';
        const court = courtExhibits().some(x => x.id === 'tobi');
        // the Asaba rumour on its own (no headline or press story ahead of it in the two bulletin slots)
        const hl = S.game.headlines, pr = d.press, od = d.order; S.game.headlines = []; d.press = null; d.order = null;
        const radio = radioLines('m6').join(' ');
        S.game.headlines = hl; d.press = pr; d.order = od;
        out[name + (named ? '_named' : '')] = { alive:intelTobiAlive(), lead, st, review:(review.match(/[^.]*Tobi[^.]*\.([^.]*witness box\.)?/g) || []).join(' | '), epi, court, rescueRumour:/a rescue/.test(radio) };
      }
    }
    S.game.seasonOneComplete = false; delete S.game.moralChoices.finale;
    return out;
  });
  h.log('tobi', JSON.stringify(tobi, null, 1));
  for(const [k, t] of Object.entries(tobi)){
    const alive = !/^chase_lost/.test(k), rescue = /^rescue/.test(k);
    h.assert(t.alive === alive, k + ': intelTobiAlive');
    h.assert(t.lead.open === alive && (alive ? /pulled out of the smoke/.test(t.lead.text) : /did not survive Asaba/.test(t.lead.text)), k + ': the h6 lead ' + JSON.stringify(t.lead));
    h.assert(t.st === alive, k + ': his statement is on file only if he lived');
    h.assert(alive ? /carried Tobi out of the smoke/.test(t.review) && !/did not make it/.test(t.review) : /Tobi did not make it out of Asaba/.test(t.review) && !/carried Tobi|goes home/.test(t.review), k + ': the review ' + t.review);
    h.assert(alive ? !/^Tobi did not live/.test(t.epi) && /read the drive/.test(t.epi) : /^Tobi did not live to read the drive/.test(t.epi), k + ': the epilogue ' + t.epi);
    h.assert(t.court === rescue, k + ': testimony at the trial only after the rescue');
    if(alive && !rescue){ h.assert(/witness box/.test(t.review) && /witness box/.test(t.epi), k + ': review and epilogue both say why he does not testify'); h.assert(/^Sgt\. Uche carried Tobi out/.test(t.epi), k + ': Uche carried him'); }
    if(/_named$/.test(k)) h.assert(alive ? /charge sheet|cuffed/.test(t.epi) : /charge sheet/.test(t.epi), k + ': the wrongful naming is in his epilogue');
    h.assert(t.rescueRumour === alive, k + ': the radio says "a rescue" only if he came out');
  }

  if(fails.length){ [...new Set(fails)].slice(0, 40).forEach(f => h.log('  SPOILER/CANON: ' + f)); }
  h.assert(fails.length === 0, `no spoiler or canon breach in anything rendered (${fails.length})`);
  h.assert(h.errors.length === 0, 'no page errors: ' + h.errors.join(' | '));
  h.log('PASS v13_e_spoilers', tag);
};
