// v13 review fixes (model / data / briefing), the briefing surfaces. Each block fails on the build before the fix.
//   node tools/harness/run.cjs tools/harness/scenarios/v13_fix_model_brief.cjs --html <build>/naceca.html
// R03  'leak' at h5: the Engineer does not vanish (h7 and the t7 tail still follow him); no dead engineer_fled flag
// R04  'leak' never creates the Engineer–"C." fact: the Locker lists only what the press printed
// R30  WHILE YOU WERE BUSY: a dropped lead says what happened, never "You lose nothing you need" (Senior)
// R23  Senior gets the same NFIU requests as Recruit when the briefing itself opens the trail
// R29  Senior van: WHAT CAME BACK repeats the feed log (every photo, every plate) without judging it; no relevance
//      toast for the 18:15 photo; Recruit keeps the drop's reading, with "the Corolla's plate"
// R19  the Apex wire: the Abuja officer is in the room — no "Kelechi—" slip, "He says", "His cover held / He walked out"
const LIB = require('./v13_b_lib.cjs');
const LAGOS = { suspect:'obi', method:'alerts', money:'wallet', ok:{ suspect:true, method:true, money:true }, warrant:'signed', settled:'m3' };
const ROUTE = { suspect:'ifeanyi', method:'route', money:'asaba', ok:{ suspect:true, method:true, money:true }, warrant:'signed' };
const H5 = ['m0', 'm1', 'm2', 'h2', 'm3', 'm3n', 'm4', 'h4', 'm5'];
module.exports = async h => {
  // V13FIX_SOFT=1 lists every failing check instead of stopping at the first (to show what a build before the fixes gets wrong)
  const soft = process.env.V13FIX_SOFT === '1', fails = [];
  const check = (c, m) => { if(c) return; if(!soft) h.assert(c, m); fails.push(m); h.log('CHECK FAILED: ' + m); };
  const B = LIB.lib(h);
  const toastSpy = () => h.ev(() => {
    window.__toasts = [];
    if(!window.__toastWrapped){ window.__toastWrapped = true; const t = window.toast; window.toast = function(a, b){ window.__toasts.push(a + ' | ' + (b || '')); return t.apply(this, arguments); }; }
  });
  // a save at the h5 office: Lagos and route filed, Bluewater and Apex on file, the gatehouse lead worked
  const atH5 = async (diff, extra) => {
    await B.toHub('m6', H5, new Function('S', `S.game.mem = { hubs:{ h2:1, h4:1 }, street:{}, phone:{}, reply:{}, seen:{} };
      S.game.intel = { items:{}, briefed:{ m3:true, m4:true }, reg:{ found:{ bluewater:true, apex:true }, ctc:{} }, flags:{ lead_gatehouse:true } };
      S.game.accusations = { lagos:${JSON.stringify(LAGOS)}, route:${JSON.stringify(ROUTE)} };
      S.game.difficulty = '${diff}'; ${extra || ''}`));
    await h.ev(() => { if(typeof syncDifficultyClass === 'function') syncDifficultyClass(); });
    await toastSpy();
    await h.ev(() => openBriefing('m5', () => {}, { video:true }));
    await h.step(200);
  };

  // ================= R03 / R04: the order, 'Pass it to a crime reporter' =================
  // no Abuja address yet (Tunde is the one lead); one exhibit in the Locker so its WHO KNOWS WHAT panel shows
  await atH5('senior', `S.game.intel.reg = { found:{}, ctc:{} }; S.game.evidence = [{ id:'phishing_template', name:'Phishing Template' }];
    S.game.intel.items = { phishing_template:{ id:'phishing_template', m:'m2', cert:true, custody:[{ t:'Logged by Agt. Kelechi' }] } };`);
  await B.plan(['tunde'], { order:'leak' });
  await B.runToEnd();
  const leakOut = await B.text('#screen-briefing .brf-note');
  await B.click('#screen-briefing [data-b="done"]'); await h.step(250);
  const leak = await h.ev(() => {
    openDesk('locker'); const locker = document.getElementById('desk-body').innerText; closeDesk();
    return { known:JSON.parse(JSON.stringify(I().known || {})), fled:I().flags.engineer_fled, locker, h7:BRIEFINGS.m7.intro,
      engineerLog:intelHas('engineer_log'), invEngineer:intelHas('inv_engineer') };
  });
  h.log('R03/R04 leak:', leakOut, '| known', JSON.stringify(leak.known), '| fled', leak.fled);
  h.log('R04 locker:', (leak.locker.match(/WHO KNOWS WHAT[\s\S]{0,160}/) || ['(no panel)'])[0].replace(/\n+/g, ' | '));
  check(/NACECA informant linked to kidnap ring/.test(leakOut), 'R03: the leak still runs as a story');
  check(!/vanish/i.test(leakOut), 'R03: the leak does not say the Engineer vanished (h7 and the tail follow him)');
  check(/Engineer/.test(leak.h7), 'R03: (the h7 briefing still goes after the Engineer)');
  check(leak.fled === undefined, 'R03: no engineer_fled flag that nothing reads');
  check(!leak.engineerLog && !leak.invEngineer, 'R04: (the line was never pulled)');
  check(!leak.known.engineer, 'R04: the leak never creates the Engineer–"C." fact (only pulling his line does)');
  check(Array.isArray(leak.known.engineer_leak) && leak.known.engineer_leak.includes('The press'), 'R04: the press knows what it printed');
  check(!/calls to "C\."/.test(leak.locker), 'R04: the Locker\'s WHO KNOWS WHAT never lists the Engineer\'s calls to "C." after a leak');
  check(/WHO KNOWS WHAT[\s\S]*A NACECA informant inside the kidnap ring[\s\S]*The press/.test(leak.locker), 'R04: the Locker lists the leaked story and who has it');

  // ================= R30: WHILE YOU WERE BUSY after taking her h4 advice =================
  await B.toHub('m5', ['m0', 'm1', 'm2', 'h2', 'm3', 'm3n', 'm4'], new Function('S', `S.game.mem = { hubs:{ h2:1 }, street:{}, phone:{}, reply:{}, seen:{} };
    S.game.intel = { items:{}, briefed:{ m3:true } }; S.game.accusations = { lagos:${JSON.stringify(LAGOS)} };`));
  await h.ev(() => openBriefing('m4', () => {}, { video:true }));
  await B.plan(['musa', 'cac']);
  await B.runToEnd(); await B.click('#screen-briefing [data-b="done"]'); await h.step(400);
  await h.ev(route => { S.game.completedMissions.push('h4', 'm5'); S.game.accusations.route = route; openBriefing('m5', () => {}, { video:true }); }, ROUTE);
  await h.step(250);
  const busy = await B.text('#screen-briefing .brf-note');
  h.log('R30 busy:', busy);
  check(/WHILE YOU WERE BUSY/.test(busy) && /The E\. entries stay a pattern without a face\./.test(busy), 'R30: the dropped E. lead is reported');
  check(!/lose nothing|nothing you need/i.test(busy), 'R30: no narrator verdict on the dropped lead (Senior confirms nothing)');
  check(await h.ev(() => Object.values(BRIEFINGS).every(b => b.leads.every(l => !/lose nothing|nothing you need/i.test(l.dropped || '')))), 'R30: no dropped line in any briefing grades the drop');
  await h.ev(() => { showOverlay(null); BRF.k = null; });

  // ================= R23: the briefing that opens Senior's trail tops it up like Recruit's =================
  const reqs = {};
  for(const diff of ['recruit', 'senior']){
    await h.start('m4', { completed:['m0', 'm1', 'm2', 'm3', 'm3n'], briefings:true, state:(S => { S.game.mem = { hubs:{ h2:1 } }; S.game.intel = { items:{}, briefed:{ m3:true } }; S.game.evidence = [{ id:'phishing_template', name:'x' }]; }) });
    reqs[diff] = await h.ev(diff => {
      S.game.difficulty = diff; if(typeof syncDifficultyClass === 'function') syncDifficultyClass();
      const d = I();
      d.items.phishing_template = d.items.phishing_template || { id:'phishing_template', m:'m2', cert:true, custody:[] };
      flagClue('kc_bank_150k', true);
      const atFlag = d.money.req;
      openBriefing('m4', () => {}, { video:true, hub:'h4' });
      const shown = (document.querySelector('#screen-briefing .brf-small:last-of-type') || {}).textContent || '';
      const out = { atFlag, req:d.money.req, open:d.money.open, nodes:Object.keys(d.money.unlocked), shown };
      showOverlay(null); BRF.k = null;
      return out;
    }, diff);
  }
  h.log('R23 requests:', JSON.stringify(reqs));
  check(reqs.recruit.atFlag === 4 && reqs.senior.atFlag === 0, 'R23: (Recruit opens the trail on the flag, Senior at the briefing)');
  check(reqs.senior.open && reqs.senior.nodes.join() === reqs.recruit.nodes.join(), 'R23: (the same nodes after the briefing)');
  check(reqs.senior.req === reqs.recruit.req && reqs.senior.req === 6, `R23: the same NFIU requests after the briefing (Recruit ${reqs.recruit.req}, Senior ${reqs.senior.req})`);

  // ================= R29: the Abuja van =================
  const van = async (diff, acts, label) => {
    await atH5(diff);
    await B.plan(['stakeout', 'tunde'], { order:'comply' });
    check(await B.shown('screen-so'), label + ': the van opens');
    for(const a of acts){ if(await B.has(`#screen-so [data-so="${a}"]`)) await B.click(`#screen-so [data-so="${a}"]`); }
    const log = await B.text('#so-log');
    for(let i = 0; i < 12 && !(await B.has('#screen-so [data-so="finish"]')); i++){
      if(await B.has('#screen-so [data-so="wait"]')) await B.click('#screen-so [data-so="wait"]');
      else if(await B.has('#screen-so [data-so="next"]')) await B.click('#screen-so [data-so="next"]');
    }
    await toastSpy();
    await B.click('#screen-so [data-so="finish"]'); await h.step(300);
    const note = await B.text('#screen-briefing .brf-note');
    const r = await h.ev(() => ({ toasts:window.__toasts.slice(), stakeout:intelHas('inv_stakeout'), match:intelHas('so_plate_match') }));
    h.log(`R29 [${label}] log: ${log}`); h.log(`R29 [${label}] came back: ${note} | toasts ${JSON.stringify(r.toasts)}`);
    await B.runToEnd(); await B.click('#screen-briefing [data-b="done"]'); await h.step(400);
    return Object.assign({ log, note }, r);
  };
  // (a) four photos (the cash bags among them) and both plates
  const ALL = ['photo', 'next', 'photo', 'next', 'photo', 'next', 'photo', 'next', 'plate', 'next', 'plate', 'next', 'next'];
  const a = await van('senior', ALL, 'senior all');
  check(['14:10', '14:40', '15:20', '17:30'].every(t => a.note.includes(t)), 'R29: Senior lists every photograph taken, decoys included');
  check(a.note.includes('LAG 771 XC') && a.note.includes('LND 590 XA'), 'R29: Senior lists every plate logged, the Lexus included');
  check(!/courier|cash bags|its plate/.test(a.note), 'R29: Senior\'s summary never picks out the frames that matter');
  check(a.match, 'R29: (the plate match is still set silently)');
  // (b) decoys only
  const b = await van('senior', ['photo', 'next', 'photo', 'next', 'next', 'photo', 'next', 'photo', 'plate', 'next', 'next', 'next'], 'senior decoys');
  check(!/nothing you can use/i.test(b.note), 'R29: Senior is never told the feed was worthless');
  check(/4 photographs/.test(b.note) && b.note.includes('LAG 771 XC'), 'R29: Senior\'s decoy run reads like any other log');
  // (c) the 18:15 photo: the exhibit lands in the Locker, with no toast in Senior
  const c = await van('senior', ['next', 'next', 'next', 'next', 'next', 'photo', 'next', 'next'], 'senior 18:15');
  check(c.stakeout, 'R29: (the 18:15 photo still makes the stakeout exhibit)');
  check(!c.toasts.some(t => /ADDED TO THE CASE/.test(t)), 'R29: no ADDED TO THE CASE toast in Senior for the one photo that matters');
  // (d) Recruit keeps the drop's reading; the plate is the Corolla's, never "its plate" after the courier
  const d = await van('recruit', ALL, 'recruit all');
  check(/courier carrying cash bags/.test(d.note) && /the Corolla's plate, LND 590 XA/.test(d.note) && !/its plate/.test(d.note), 'R29: Recruit: "the Corolla\'s plate", never "its plate"');
  const e = await van('recruit', ['next', 'next', 'next', 'next', 'next', 'photo', 'next', 'next'], 'recruit 18:15');
  check(e.toasts.some(t => /ADDED TO THE CASE/.test(t)), 'R29: (Recruit keeps the exhibit toast)');

  // ================= R19: the officer on a wire =================
  const wire = async plan => {
    await atH5('senior');
    await B.plan(['undercover'], { order:'quiet' });
    check(await B.shown('screen-uc'), 'the wire opens');
    await B.click('#screen-uc [data-uc="go"]');
    const q1 = await h.ev(() => [...document.querySelectorAll('#screen-uc .uc-opt')].map(b => b.textContent));
    for(const p of plan){ if(Array.isArray(p)) await B.click(`#screen-uc [data-uc="${p[0]}"][data-k="${p[1]}"]`); else await B.click(`#screen-uc [data-uc="${p}"]`); }
    const body = await B.text('#uc-body');
    const res = await B.text('#screen-uc .uc-res');
    await B.click('#screen-uc [data-uc="end"]'); await h.step(250);
    return { q1, body, res };
  };
  // the slip, then a clean run: the cover holds
  const held = await wire([['ans', 1], ['ans', 0], 'probe', ['ans', 0], ['ans', 0], 'skip', ['ans', 0], 'skip']);
  h.log('R19 held:', JSON.stringify(held.q1), '|', held.res);
  check(!held.q1.some(t => /Kelechi/.test(t)), 'R19: the officer\'s slip never says Kelechi\'s name');
  check(held.q1.some(t => /Obinna— sorry/.test(t)), 'R19: (the slip is still offered: a wrong surname)');
  check(/He says: "Obinna— sorry\. Obinna Okafor\." \(a pause\. Too long\.\)/.test(held.body) && !/— You: "/.test(held.body), 'R19: the wire log says what he answered, not "You:"');
  check(/His cover held\. He walked out with: the visitor book pattern\./.test(held.res) && !/\bYour cover\b|\bYou walked\b/.test(held.res), 'R19: "His cover held. He walked out with" under WHAT HE WALKED OUT WITH');
  // too many pauses: the cover is blown with two things in hand
  const blown = await wire([['ans', 1], ['ans', 0], 'probe', ['ans', 2], ['ans', 1], 'probe']);
  h.log('R19 blown:', blown.res);
  check(/The cover is blown/.test(blown.res) && /He still walked out with 2 things you can use\./.test(blown.res) && !/You still walked/.test(blown.res), 'R19: a blown cover — "He still walked out with"');
  // nothing he took: still his cover
  const empty = await wire([['ans', 0], ['ans', 0], 'skip', ['ans', 0], ['ans', 0], 'skip', ['ans', 0], 'skip']);
  check(/His cover held, and he took nothing\./.test(empty.res), 'R19: "His cover held, and he took nothing"');
  check(await h.ev(() => FACTS.cover === 'The Apex cover name'), 'R19: the Locker calls it the Apex cover name, not "Your" cover');
  h.assert(!fails.length, fails.length + ' checks failed: ' + fails.join(' · '));
  h.log('v13_fix_model_brief: all checks passed');
};
