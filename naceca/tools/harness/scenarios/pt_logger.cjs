// PLAYTEST LOG · the observed-slice signals: interact / interact_miss, blocked, obj_done, stuck, away,
// choice, the two post-slice questions, and dev on every event.
//   node tools/harness/run.cjs tools/harness/scenarios/pt_logger.cjs [--w 390 --h 844 --touch 1]
const read = h => h.ev(() => { try{ return JSON.parse(localStorage.getItem('naceca_pt_v1') || '[]'); }catch(e){ return []; } });
const flush = h => h.ev(() => { V12.log('_flush', {}); for(let i = 0; i < 12; i++) V12.log('_pad', {}); });
module.exports = async h => {
  await h.ev(() => { try{ localStorage.removeItem('naceca_pt_v1'); }catch(e){} });
  await h.start('m2', { completed:['m0', 'm1'] });
  const touch = await h.ev(() => document.body.classList.contains('touch-active'));

  // a tap that hits nothing, then a real interaction
  await h.ev(() => { const P = ENGINE.player.position; P.x = 40; P.z = 40; tryInteract(); });
  const it = await h.ev(() => { const x = ENGINE.interactables.find(i => i.mesh && i.mesh.position); const P = ENGINE.player.position; P.x = x.mesh.position.x; P.z = x.mesh.position.z; return x.label; });
  await h.step(200);
  await h.ev(() => { tryInteract(); showOverlay(null); if(typeof DLG !== 'undefined' && document.querySelector('#screen-dialogue.show')) endDialogue(); });
  // a refused action and an objective
  await h.ev(() => { toast('NOT YET', 'Uche and your phone first.', 800); toast('LINK INKED', '+8 INTEL', 800); });
  await h.ev(() => { const o = S.game.objectives.find(x => !x.done); if(o) completeObjective(o.id); });
  // an interaction the game refuses: classified as refused (and not double-counted as 'blocked')
  await h.ev(() => { const P = ENGINE.player.position; ENGINE.interactables.push({ mesh:{ position:{ x:P.x, y:0, z:P.z } }, label:'Test gate', range:3, priority:99, onInteract:()=>toast('NOT YET', 'test gate') }); tryInteract(); });
  await h.step(700);
  // the game's own hint, a silent mission end, a chase that ends, the wipe running out
  await h.ev(() => { toast('HINT', 'Try this next: Speak with Tunde. Follow the arrow.', 600); });
  await h.ev(() => { const r = { position:{ x:0, y:0, z:0 }, rotation:{ y:0 }, userData:{} }; const c = startChase({ runner:r, path:[[0,0],[5,0]], label:'TEST' }); c.bumps = 2; stopChase(); c.onEscaped(); });
  await h.ev(() => { S.game._wipeTotal = 55; S.game._wipeT = 55; S.game._wipeLost = true; });
  await h.step(1300);
  await h.ev(() => { S.game._wipeTotal = 0; S.game._wipeLost = false; });
  // stuck: pretend the last progress was two minutes of PLAY ago and let the sampler see it
  await h.ev(() => { ENGINE.movementEnabled = true; showOverlay(null); const P = V12._ptState; P.lastProg = P.play - 120000; P.stuckAt = 0; P.sig = progressSig(); });
  await h.step(2600);
  // a committed dialogue choice (two taps on a flagged choice, one on a plain one)
  await h.ev(() => {
    DIALOGUE._pt_test = [{ speaker:'SGT. UCHE', text:'Test?', choices:[{ text:'Plain one', tag:'lawful' }, { text:'Flagged one', tag:'harsh', flag:{ pt_test:true } }] }];
    startDialogue('_pt_test', ()=>{});
  });
  await h.step(400);
  await h.ev(() => { if(typeof skipTypewriter === 'function') skipTypewriter(); });
  await h.step(200);
  await h.ev(() => { const b = document.querySelectorAll('#dlg-choices .dialogue-choice')[1]; b.click(); });   // arms only
  await h.step(100);
  await h.ev(() => { const b = document.querySelectorAll('#dlg-choices .dialogue-choice')[1]; if(b) b.click(); });  // commits
  await h.step(300);
  await flush(h);
  let ev = await read(h);
  const of = t => ev.filter(e => e.type === t);
  h.log('types', [...new Set(ev.map(e => e.type))].join(','));
  h.assert(of('interact_miss').length >= 1 && of('interact_miss')[0].d.near && of('interact_miss')[0].d.dist > 3, 'a tap on nothing logs interact_miss with the nearest thing and its distance');
  h.assert(of('interact_result').some(e => e.d.label === it && ['progress', 'opened', 'refused', 'noop'].includes(e.d.outcome)), 'a real interaction logs its label and outcome');
  const gate = of('interact_result').find(e => e.d.label === 'Test gate');
  h.assert(gate && gate.d.outcome === 'refused' && gate.d.toast && gate.d.toast.big === 'NOT YET', 'a refused interaction is classified refused with its toast ' + JSON.stringify(gate && gate.d));
  h.assert(of('blocked').length === 1 && of('blocked')[0].d.big === 'NOT YET' && of('blocked')[0].d.small === 'Uche and your phone first.', 'only the refusal raised outside an interaction is logged as blocked');
  h.assert(of('hint').length === 1 && /Speak with Tunde/.test(of('hint')[0].d.what), 'the game hint is logged');
  const ce = of('chase_end')[0];
  h.assert(ce && ce.d.label === 'TEST' && ce.d.outcome === 'escaped' && ce.d.bumps === 2, 'chase_end carries outcome and bumps ' + JSON.stringify(ce && ce.d));
  const we = of('wipe_end')[0];
  h.assert(we && we.d.lost === true && we.d.pct === 100, 'wipe_end when the wipe runs out ' + JSON.stringify(we && we.d));
  const ss = ev.find(e => e.type === 'session');
  h.assert(ss && ss.d.build && ss.d.build.src && ss.d.settings, 'the session names its build and settings ' + JSON.stringify(ss && ss.d.build));
  const od = of('obj_done')[0];
  h.assert(od && typeof od.d.secs === 'number' && od.d.secs >= 0 && 'walked' in od.d && 'arrowPct' in od.d && 'towardPct' in od.d, 'objective completions carry play-time and navigation ' + JSON.stringify(od && od.d));
  h.assert(of('stuck').length >= 1 && of('stuck')[0].d.secs >= 90, 'two minutes without progress logs stuck');
  const ch = of('choice');
  h.assert(ch.length === 1 && ch[0].d.k === '_pt_test' && ch[0].d.i === 1 && ch[0].d.tag === 'harsh', 'the arming tap is not logged; the committed choice is (script, index, tag)');
  h.assert(ev.filter(e => e.type !== 'session').every(e => e.d && e.d.dev === (touch ? 'touch' : 'desk')), 'every event carries the device');

  // the two questions at the end of the slice (m3's aftermath), once per save
  await h.ev(() => { showOverlay(null); S.game.currentMission = 'm3'; S.game._ptAsked = {}; showAftermath(); });
  await h.step(2200);
  let st = await h.ev(() => ({ shown:!!document.querySelector('#screen-pt-survey.show'), q:[...document.querySelectorAll('#screen-pt-survey .pt-q')].map(x => x.textContent) }));
  h.assert(st.shown, 'the questions open after the slice aftermath');
  h.assert(st.q[0] === 'What was your most satisfying decision?' && st.q[1] === 'What happened that felt unfair?', 'the two questions, word for word');
  h.assert(!(await h.ev(() => { const t = document.getElementById('toast'); return !!(t && t.classList.contains('show')); })), 'no toast over the questions');
  const box = await h.ev(() => { const r = document.querySelector('#screen-pt-survey .pt-sheet').getBoundingClientRect(); return { l:r.left, r:r.right, w:innerWidth, sw:document.documentElement.scrollWidth }; });
  h.assert(box.l >= 12 && box.r <= box.w - 12 && box.sw <= box.w, 'the sheet fits the screen with side gutters ' + JSON.stringify(box));
  await h.shot('pt_survey');
  // typing into the answer does not reach the game's keys (E would interact, J would open the desk)
  await h.page.focus('#pt-a1');
  await h.page.keyboard.type('Flipping the driver, easy');
  await h.page.focus('#pt-a2');
  await h.page.keyboard.type('The guard saw me through a wall');
  st = await h.ev(() => ({ a1:document.getElementById('pt-a1').value, desk:!!document.querySelector('#screen-desk.show'), paused:!!document.querySelector('#screen-pause.show') }));
  h.assert(st.a1 === 'Flipping the driver, easy' && !st.desk && !st.paused, 'typing stays in the text box');
  const sizes = await h.ev(() => [...document.querySelectorAll('#screen-pt-survey button')].map(b => { const r = b.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }));
  if(touch) h.assert(sizes.every(([w, hh]) => w >= 44 && hh >= 44), 'buttons are 44px targets on touch ' + JSON.stringify(sizes));
  await h.ev(() => document.getElementById('pt-save').click());
  await h.step(200);
  await flush(h);
  ev = await read(h);
  const sv = ev.filter(e => e.type === 'survey');
  h.assert(sv.length === 1 && sv[0].d.satisfying === 'Flipping the driver, easy' && sv[0].d.unfair === 'The guard saw me through a wall' && sv[0].d.where === 'slice:m3', 'answers are saved in the playtest log');
  st = await h.ev(() => ({ survey:!!document.querySelector('#screen-pt-survey.show'), after:!!document.querySelector('#screen-aftermath.show') }));
  h.assert(!st.survey && st.after, 'saving returns to the aftermath');
  // not asked twice for the same save
  await h.ev(() => { showAftermath(); });
  await h.step(2200);
  h.assert(!(await h.ev(() => !!document.querySelector('#screen-pt-survey.show'))), 'asked once per save');
  await h.ev(() => completeMission('m2', { silent:true }));
  await flush(h); ev = await read(h);
  h.assert(ev.some(e => e.type === 'mission_end' && e.d.m === 'm2' && e.d.silent), 'a silent completion (the van) still logs mission_end');
  // Settings shows the count and can ask again
  await h.ev(() => { showOverlay(null); openSettings(); });
  await h.step(200);
  const note = await h.ev(() => [...document.querySelectorAll('#settings-body .set-row')].map(r => r.textContent).find(t => /Two questions/.test(t)) || '');
  h.assert(/1 answer saved/.test(note), 'Settings shows the saved answers: ' + note);
  h.assert(h.errors.length === 0, 'no page errors');
};
