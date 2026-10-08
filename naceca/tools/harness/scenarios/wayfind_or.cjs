// Wayfinding · "current objective" with OR-alternatives (M6): once one alternative is done
// (or no longer possible) the other is not the current objective any more.
const lib = require('./wayfind_lib.cjs');
const DONE = ['m0', 'm1', 'm2', 'm3', 'm4', 'm5'];
const state = h => h.ev(() => {
  const c = WAY.current(), r = document.querySelector('#hud-mission-objs .obj');
  const res = WAY.resolve();
  return { cur: c.obj && c.obj.id, done: c.done, total: c.total, cls: r.className, txt: r.querySelector('.obj-t').textContent,
           count: r.querySelector('.obj-count').textContent, res: res && (res.label + (res.uiOnly ? ' (ui)' : '')) };
});

module.exports = async h => {
  // ---- rescue Tobi ----
  await lib.start(h, 'm6', { completed: DONE });
  await lib.realClock(h);
  await h.step(300);
  let s = await state(h);
  h.assert(s.cur === 'o1_breach' && s.res === 'Brief with Sgt. Uche', 'before the briefing: Uche is next ' + JSON.stringify(s));
  h.assert(s.count === '1/2', 'the two alternatives count as one step: ' + s.count);
  await h.ev(() => { S.game._asabaBriefed = true; WAY.invalidate(); });
  await h.step(300);
  s = await state(h);
  h.assert(s.cur === 'o1_breach' && s.res === 'Breach the warehouse', 'after the briefing the breach line is the target ' + JSON.stringify(s));
  await h.ev(() => { stopChase(); completeObjective('o1_breach'); });
  await h.step(300);
  s = await state(h);
  h.assert(s.cur === 'o2_runner' && /OR — apprehend/.test(s.txt), 'first alternative current while both are open ' + JSON.stringify(s));
  // (his flight to the van uses Vector3 maths the three.js stand-in doesn't have: keep him still)
  await h.ev(() => { ENGINE._asabaRunner.update = () => {}; makeAsabaChoice('rescue', ENGINE._asabaTobi); });
  await h.step(300);
  s = await state(h);
  h.log('after rescue:', JSON.stringify(s));
  h.assert(s.cur === null, 'after the rescue the fixer is no longer the current objective');
  h.assert(/allclear/.test(s.cls) && /All clear/.test(s.txt) && s.count === '2/2', 'HUD: all clear 2/2 ' + JSON.stringify(s));
  h.assert(!/apprehend/i.test(s.txt), 'HUD no longer shows "OR — apprehend the fixer"');

  // ---- chase Ifeanyi: the hostage alternative drops out ----
  await lib.start(h, 'm6', { completed: DONE });
  await h.ev(() => { S.game._asabaBriefed = true; completeObjective('o1_breach'); makeAsabaChoice('chase', ENGINE._asabaRunner); });
  await h.step(300);
  s = await state(h);
  h.assert(s.cur === null && /All clear/.test(s.txt), 'after the arrest the rescue is no longer current ' + JSON.stringify(s));

  // ---- the runner got away with nobody committed: the rescue is what's left ----
  await lib.start(h, 'm6', { completed: DONE });
  await h.ev(() => { S.game._asabaBriefed = true; completeObjective('o1_breach'); ENGINE._asabaRunner.userData._escaped = true; ENGINE._asabaRunner.visible = false; renderObjectives(); });
  await h.step(300);
  s = await state(h);
  h.assert(s.cur === 'o3_hostage' && /rescue the hostage/.test(s.txt) && s.res === 'Rescue the hostage', 'runner gone → rescue is current ' + JSON.stringify(s));
  h.assert(!h.errors.length, 'no page errors');
};
