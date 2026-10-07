/* =========================================================================
   NACECA · v12 raid planning — "I knew there were three suspects inside
   because I did the work."
   The Lekki raid opens on a plan. Uche's briefing only contains what the
   player earned: the SIM theory (suspects, the laptop's room), KC's tip if
   he was treated fairly (side gate, civilians), a Street Sources text, the
   warrant. The plan — entry, power, Uche's post — sets the wipe clock,
   civilian safety and who gets away.
   ========================================================================= */
(function(){
'use strict';
const V12 = window.V12;

function intel(){
  const sims = V12.theory('t_sims');
  const kc = typeof kcIsFair === 'function' && kcIsFair();
  const tip = !!S.game._tipM3;
  return {
    suspects: sims ? { known:true, text:'Three. Two upstairs, one in the study: the principal.', src:'your SIM theory' }
            : tip ? { known:true, text:'Three men inside.', src:'Street Sources' }
            : { known:false, text:'Unknown. Lights upstairs, movement downstairs.' },
    laptop: sims ? { known:true, text:'In the study, on Obi\'s desk.', src:'the SIM pings' }
          : kc ? { known:true, text:'In the study, on Obi\'s desk.', src:'KC' }
          : { known:false, text:'Somewhere downstairs.' },
    gate: kc ? { known:true, text:'Side gate by the generator house. Never locked.', src:'KC' } : { known:false, text:'Front door only, as far as you know.' },
    civ: kc ? { known:true, text:'A child in the living room. Staff in the kitchen.', src:'KC' }
        : tip ? { known:true, text:'A child upstairs earlier. Staff in the kitchen.', src:'Street Sources' }
        : { known:false, text:'Unknown. Assume there are.' },
    warrant: V12.warrant() ? { known:true, text:'Signed.', src: V12.theory('t_money') ? 'the money trail' : 'your intel' } : { known:false, text:'Not yet. You go in under exigent circumstances.' },
  };
}
V12.m3Intel = intel;
const wipeFor = (plan, I)=>{
  let t = { quiet: I.gate.known ? 80 : 65, knock:55, loud:40 }[plan.entry] || 55;
  if(I.laptop.known) t += 15;
  if(plan.power === 'cut') t += 12;
  return t;
};

function sketch(I, plan){
  const q = (x, y)=>`<text x="${x}" y="${y}" class="unk">?</text>`;
  const dot = (x, y, cls)=>`<circle cx="${x}" cy="${y}" r="7" class="${cls}"/>`;
  return `<svg viewBox="0 0 320 250" class="plan-svg" role="img" aria-label="Lekki mansion sketch">
    <rect x="40" y="20" width="200" height="170" class="house"/>
    <line x1="40" y1="70" x2="240" y2="70" class="wall"/><text x="140" y="35" class="room">UPSTAIRS (FLOOR ABOVE)</text>
    <line x1="150" y1="70" x2="150" y2="190" class="wall"/><line x1="40" y1="140" x2="105" y2="140" class="wall"/>
    <text x="95" y="108" class="room">LIVING ROOM</text><text x="195" y="108" class="room">STUDY</text><text x="72" y="168" class="room">KITCHEN</text>
    <rect x="125" y="186" width="50" height="8" class="door"/><text x="150" y="214" class="room">FRONT DOOR</text>
    <rect x="262" y="120" width="42" height="40" class="${I.gate.known ? 'gen' : 'gen dim'}"/><text x="283" y="176" class="room sm">GENERATOR</text>
    ${I.gate.known ? `<rect x="236" y="150" width="8" height="30" class="gate"/><text x="283" y="198" class="room sm gold">SIDE GATE</text>` : ''}
    ${I.suspects.known ? (V12.theory('t_sims') ? dot(110, 54, 'sus') + dot(170, 54, 'sus') + dot(205, 125, 'sus') : dot(110, 54, 'sus') + dot(150, 54, 'sus') + dot(190, 54, 'sus')) : q(140, 62) + q(200, 135)}
    ${I.laptop.known ? `<rect x="214" y="146" width="20" height="13" class="lap"/>` : q(120, 128)}
    ${I.civ.known ? dot(85, 122, 'civ') + dot(70, 178, 'civ') : q(80, 128)}
    ${plan.uche === 'rear' ? `<circle cx="140" cy="10" r="7" class="uche"/><text x="152" y="14" class="room sm gold" style="text-anchor:start">UCHE · REAR WALL</text>` : ''}
    ${plan.power === 'cut' ? `<text x="283" y="112" class="room sm red">CUT</text>` : ''}
  </svg>`;
}

V12.planM3 = function(onGo){
  let ov = document.getElementById('screen-plan');
  if(!ov){ ov = V12.el('div', 'overlay', ''); ov.id = 'screen-plan'; document.getElementById('game-root').appendChild(ov); }
  const I = intel();
  const plan = { entry: I.gate.known ? 'quiet' : 'knock', power:'leave', uche:'with' };
  const seg = (k, opts)=>`<div class="seg plan-seg">${opts.map(([v, l, lock]) => `<button data-k="${k}" data-v="${v}" class="${plan[k] === v ? 'on' : ''}" ${lock ? 'disabled title="' + lock + '"' : ''}>${l}</button>`).join('')}</div>`;
  const draw = ()=>{
    const w = wipeFor(plan, I);
    ov.innerHTML = `<div class="overlay-bg"></div><div class="plan-frame">
      <div class="plan-head"><div><div class="plan-k">CASE 03 · PRE-BREACH</div><div class="plan-t">THE PLAN</div></div><div class="plan-sub">LEKKI · OLD GRA · 21:30</div></div>
      <div class="plan-body">
        <div class="plan-a">${sketch(I, plan)}
          <div class="plan-legend"><span><i class="sus"></i>suspect</span><span><i class="civ"></i>civilian</span><span><i class="lap"></i>laptop</span><span class="unk">?</span>unknown</div></div>
        <div class="plan-b">
          <div class="plan-h">WHAT YOU KNOW</div>
          ${[['SUSPECTS', I.suspects], ['LAPTOP', I.laptop], ['WAY IN', I.gate], ['CIVILIANS', I.civ], ['WARRANT', I.warrant]].map(([l, x]) => `
            <div class="plan-row ${x.known ? 'k' : 'u'}"><span class="pl">${l}</span><span class="pv">${x.text}${x.src ? `<em>from ${x.src}</em>` : ''}</span></div>`).join('')}
        </div>
        <div class="plan-c">
          <div class="plan-h">YOUR PLAN</div>
          <div class="plan-q"><span>ENTRY</span>${seg('entry', [['knock','Knock and announce'], ['quiet', I.gate.known ? 'Side gate, quiet' : 'Pick the side door'], ['loud','Loud breach']])}</div>
          <div class="plan-q"><span>POWER</span>${seg('power', [['leave','Leave it'], ['cut','Cut the generator']])}</div>
          <div class="plan-q"><span>UCHE</span>${seg('uche', [['with','With you'], ['rear','Rear wall', V12.has('squad') ? '' : 'Needs the Squad Trust capability']])}</div>
        </div>
        <div class="plan-d">
          <div class="plan-pred">
            <div><b>Wipe clock</b> about <b>${w} s</b>${I.laptop.known ? ' · you go straight to the study' : ' · you\'ll have to find the laptop'}</div>
            ${plan.entry === 'loud' ? '<div class="bad">Loud entry: force on the record, Underworld Heat rises.</div>' : ''}
            ${plan.power === 'cut' ? '<div>Dark house: his remote wipe trigger arrives late. The child wakes frightened.</div>' : ''}
            ${plan.uche === 'rear' ? '<div>Anyone going over the back wall runs into Uche.</div>' : ''}
            ${!I.warrant.known ? '<div class="bad">No warrant: Agency Standing −5, and the defence will ask why.</div>' : ''}
          </div>
          <button class="btn primary plan-go" id="plan-go">GO ▶</button>
        </div>
      </div></div>`;
    ov.querySelectorAll('.plan-seg button').forEach(b => b.addEventListener('click', ()=>{ if(b.disabled) return; plan[b.dataset.k] = b.dataset.v; if(typeof sfxClick === 'function') sfxClick(); draw(); }));
    ov.querySelector('#plan-go').addEventListener('click', go);
  };
  const go = ()=>{
    const known = { suspects:I.suspects.known, laptop:I.laptop.known, gate:I.gate.known, civ:I.civ.known, warrant:I.warrant.known };
    S.game._plan = Object.assign({}, plan, { known });
    S.game.flags = S.game.flags || {}; S.game.flags.entry = plan.entry; S.game.moralChoices.entry = plan.entry;
    applyEffect(({ knock:{ integrity:+6, publicTrust:+5, agencyFavour:-2 }, quiet:{ integrity:+2, publicTrust:+2, agencyFavour:+3 }, loud:{ integrity:-4, publicTrust:-4, agencyFavour:+5, force:+1 } })[plan.entry]);
    if(!known.warrant) applyEffect({ agencyFavour:-5 }); else applyEffect({ agencyFavour:+2 });
    if(plan.power === 'cut') applyEffect({ publicTrust:-2 });
    if(known.suspects && known.laptop && known.gate && typeof unlock === 'function') unlock('did_the_work');
    V12.log('plan_m3', { plan, known });
    showOverlay(null);
    // Uche's briefing holds only what was earned
    const sims = V12.theory('t_sims'), L = [];
    L.push({ speaker:'SQUAD LEAD — SGT. UCHE', portrait:'sergeant', text: known.suspects
      ? (sims ? 'Your SIM work paid off, sir. Three Mama Florence handsets sleep in that house: two upstairs, one in the study. The study is our principal.' : 'Your source was right, sir. Three men inside.')
      : 'We\'re going in half-blind, sir. Lights upstairs, movement downstairs. Could be three men. Could be ten.' });
    if(known.laptop) L.push({ speaker:'SGT. UCHE', text:'The laptop is in the study, on his desk. Straight there, before he can kill it.' });
    if(known.gate) L.push({ speaker:'SGT. UCHE', text:'And your boy KC came through. Side gate by the generator house — never locked.' });
    L.push({ speaker:'SGT. UCHE', text: known.civ ? 'There\'s a child in the living room and staff in the kitchen. Nobody touches a civilian.' : 'If there are civilians inside, we find out when we\'re through the door.' });
    L.push({ speaker:'SGT. UCHE', mood: known.warrant ? undefined : 'evasive', text: known.warrant ? 'Warrant\'s signed. We do this by the book.' : 'No warrant, sir. If this goes wrong, it\'s on us.' });
    L.push({ speaker:'AGENT KELECHI', portrait:'kelechi', text: ({ knock:'Knock and announce. There are civilians inside.', quiet: known.gate ? 'Quiet. Side gate, then the side door.' : 'Quiet. We pick the side door.', loud:'Loud. Don\'t give him time to wipe it.' })[plan.entry] });
    if(plan.power === 'cut') L.push({ speaker:'SGT. UCHE', text:'Generator first. When the lights go, we go.' });
    if(plan.uche === 'rear') L.push({ speaker:'SGT. UCHE', text:'I\'ll take the back wall. Anyone who runs, runs into me.' });
    DIALOGUE.mansion_pre_breach = L;
    if(typeof onGo === 'function') onGo();
  };
  draw();
  showOverlay('screen-plan');
};

/* the wipe clock follows the plan */
window.startMansionWipe = function(){
  const P = S.game._plan || {}, K = P.known || {};
  const entry = (S.game.flags && S.game.flags.entry) || S.game.moralChoices.entry || 'knock';
  let total = { quiet: K.gate ? 80 : 65, knock:55, loud:40 }[entry] || 55;
  if(K.laptop) total += 15;
  if(P.power === 'cut') total += 12;
  S.game._wipeTotal = total; S.game._wipeT = 0; S.game._wipeDone = false; S.game._wipeLost = false;
  toast('LAPTOP WIPE RUNNING', K.laptop ? `Obi hit a remote wipe. The study — about ${total} seconds.` : `Obi triggered a remote wipe. Find the laptop — about ${total} seconds.`, 2800);
};

/* Uche opens the plan instead of a dialogue choice; extraction pays off the plan */
V12.wrap('buildSceneMansion', orig => function(){
  S.game._plan = null; S.game._planPaid = false;
  const r = orig.apply(this, arguments);
  try{
    const it = ENGINE.interactables.find(i => /^Brief with Sgt\. Uche/.test(i.label || ''));
    if(it){
      it.label = 'Plan the raid with Sgt. Uche';
      it.onInteract = ()=>{
        if(S.game._mansionPreBriefed){ toast('READY', 'Move when ready'); return; }
        const u = it.mesh; if(u && u.userData && u.userData.anim) u.userData.anim.play('talk', { fade:0.3 });
        V12.planM3(()=>startDialogue('mansion_pre_breach', ()=>{ if(u && u.userData && u.userData.anim && u.userData.anim.oneShot) u.userData.anim.oneShot('yes', 'idle'); }));
      };
    }
    const ex = ENGINE.interactables.find(i => /^Extract/.test(i.label || ''));
    if(ex && !ex._v12){
      ex._v12 = true; const go = ex.onInteract;
      ex.onInteract = function(){
        const allReq = S.game.moralChoices.arrest && S.game._civChild;
        if(allReq && !S.game._planPaid && S.game._plan){
          S.game._planPaid = true;
          const P = S.game._plan;
          if(P.uche === 'rear'){ S.game.arrests = (S.game.arrests || 0) + 1; applyEffect({ intel:+6 }); toast('UCHE AT THE BACK WALL', 'One of the upstairs men went over the wall — straight into Uche.', 2600); }
          if(P.known && P.known.civ){ S.game.civiliansRescued = (S.game.civiliansRescued || 0) + 1; }
          setTimeout(()=>go.apply(this, arguments), P.uche === 'rear' ? 1500 : 0);
          return;
        }
        return go.apply(this, arguments);
      };
    }
    const o = (S.game.objectives || []).find(x => x.id === 'o1_brief_squad'); if(o){ o.text = 'Plan the raid with Sgt. Uche'; if(typeof renderObjectives === 'function') renderObjectives(); }
  }catch(e){ console.warn('[v12] mansion', e); }
  return r;
});
/* the grade remembers whether you did the work */
V12.wrap('computeGrade', orig => function(op){
  const r = orig.apply(this, arguments);
  try{
    if(S.game.currentMission === 'm3' && S.game._plan){
      const K = S.game._plan.known || {};
      let pts = r.pts + (K.suspects && K.laptop ? 5 : 0) - (K.warrant ? 0 : 5);
      r.pts = Math.round(pts);
      r.g = pts >= 85 ? 'S' : pts >= 70 ? 'A' : pts >= 55 ? 'B' : pts >= 40 ? 'C' : 'D';
    }
  }catch(e){}
  return r;
});

})();
