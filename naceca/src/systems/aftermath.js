/* =========================================================================
   NACECA · systems/aftermath.js
   Auto-extracted from game.js by split_modules.py
   Edit the modules; run build.py to rebuild naceca.html.
   ========================================================================= */
/* ===================== 18. AFTERMATH ===================== */
function generateHeadline(){
  const r = S.player.reputation;
  const force = (S.game.forceUsed||0) - ((S.game._opStart && S.game._opStart.force) || 0);
  const arrest = S.game.moralChoices.arrest;
  const checkpoint = S.game.moralChoices.checkpoint;
  const civ = S.game.civiliansRescued;
  const integ = r.integrity, trust = r.publicTrust;

  // Mission 8 — The Voice (Season 1 finale)
  if(S.game.currentMission==='m8' && typeof finaleHeadline==='function') return finaleHeadline();

  // Mission 7 — No Signal Zone (Ugbowo)
  if(S.game.currentMission==='m7'){
    const t = S.game.moralChoices && S.game.moralChoices.tower;
    if(t==='hold'){
      return { pub:'THE DAILY GONG', head:"NACECA Pins Kidnappers' Phone to Ekosodin in Ugbowo Tower Firefight", ded:'Two officers held a telecom cabinet under fire to finish a call trace. Rescue teams moved north before dawn.' };
    }
    if(t==='extract'){
      return { pub:'THE LAGOS LEDGER', head:'Anti-Fraud Officers Pull Civilians From Ugbowo Tower Ambush', ded:"Trace completed, cabinet abandoned. The site engineer and the missing student's mother walked out behind the officers." };
    }
    if(t==='backup'){
      return { pub:'NATIONAL DISPATCH', head:'Benin Zonal Command Reinforces NACECA at Sabotaged Ugbowo Mast', ded:'The ambush broke when the armoured unit arrived. Critics ask why two officers were sent alone.' };
    }
    if(t==='cut_extract'){
      return { pub:'WAVE24 NEWS', head:'Kidnappers Cut Power Twice at Ugbowo Tower — Call Trace Lost', ded:'NACECA withdrew with civilians and sabotage evidence. The ransom calls continue.' };
    }
    if(t==='cut_backup'){
      return { pub:'THE LAGOS LEDGER', head:'Standoff at Ugbowo Mast Ends Without Arrests', ded:'Reinforcements secured the site; the handset went dark before it could be fixed.' };
    }
    return { pub:'NATIONAL DISPATCH', head:'Operation Underway at Sabotaged Ugbowo Telecom Tower', ded:'The full picture of the Ugbowo operation is still developing.' };
  }

  // Mission 6 — The Disappeared (Asaba)
  if(S.game.currentMission==='m6'){
    if(S.game.moralChoices.asaba==='failed'){
      return { pub:'WAVE24 NEWS', head:'Asaba Warehouse Raid Ends With Fixer Escaped, Hostage Dead', ded:'Officers hesitated at the breach, sources say. NACECA has opened an internal review.' };
    }
    const choice = S.game.moralChoices && S.game.moralChoices.asaba;
    if(choice==='rescue'){
      return { pub:'THE DAILY GONG', head:'NACECA Pulls Accountant From Asaba Warehouse Fire — Fixer Escapes', ded:'A young officer chose the man over the lead. The fixer is in the wind; the witness can talk.' };
    }
    if(choice==='chase' && S.game._asabaHostageLost){
      return { pub:'WAVE24 NEWS', head:"Asaba Hostage Dies in Warehouse Fire as NACECA Cuffs Cartel Fixer", ded:"Civil-rights groups call for review of solo-squad authorisations on dual-objective operations." };
    }
    if(choice==='chase'){
      return { pub:'THE LAGOS LEDGER', head:'Asaba Bust: NACECA Cuffs Cartel Fixer, Hostage Recovered Alive', ded:'A close-run operation. The sergeant pulled the accountant out before the smoke turned.' };
    }
    return { pub:'NATIONAL DISPATCH', head:'Operation Underway at Asaba Commercial Warehouse', ded:'The full picture of the Asaba operation is still developing.' };
  }

  // Mission 5 — Forest Shrine
  if(S.game.currentMission==='m5'){
    const shrine = S.game.flags && S.game.flags.shrine;
    if(shrine==='leave'){
      return { pub:'NATIONAL DISPATCH', head:'Anti-Fraud Officer Halts Op at Forest Shrine — Awaits State Order', ded:'Some procedures are slower because they have to be. Custodian thanks NACECA.' };
    }
    if(shrine==='force'){
      return { pub:'WAVE24 NEWS', head:"'They Stepped on the Sacred' — Edo Village Protests NACECA Raid", ded:'Cache recovered. Custodian withdraws cooperation. Ozalla elders demand redress.' };
    }
    if(shrine==='negotiate'){
      return { pub:'THE DAILY GONG', head:"Custodian Cooperates: NACECA Recovers Ransom Cache From Forest Shrine", ded:'Pa Eze, who has tended the Ozalla shrine for forty years, opened the gate himself.' };
    }
    return { pub:'THE LAGOS LEDGER', head:'Operation Underway in Ozalla Forest', ded:'A young officer, a quiet morning, and a delicate decision.' };
  }

  // Mission 4 — checkpoint specific
  if(S.game.currentMission==='m4'){
    if(checkpoint==='arrest_driver'){
      return { pub:'WAVE24 NEWS', head:"Joint NACECA-AKS Bust: Ransom Ledger Seized On Benin Bypass", ded:'Driver in custody. Arms and a route ledger recovered from a livestock truck.' };
    }
    if(checkpoint==='flip_driver'){
      return { pub:'THE DAILY GONG', head:"NACECA Quietly Turns Bypass Driver — Wider Net Said To Be Closing", ded:'Sources confirm a cooperator is wired up. Names of upstream handlers expected.' };
    }
    if(checkpoint==='tail_driver'){
      return { pub:'THE LAGOS LEDGER', head:'Anti-Fraud Unit Plays the Long Game on Edo Bypass', ded:'Surveillance op underway. Officers refused to confirm the size of the net being drawn.' };
    }
    return { pub:'NATIONAL DISPATCH', head:'Cattle Truck Hides Cartel Cargo on Benin Bypass', ded:'A joint operation, an alert young officer, and a fresh case file.' };
  }

  // Mission 3 — mansion (existing branches)
  if(arrest==='bribe'){
    return { pub:'THE ISLAND HERALD', head:'NACECA Officer Spotted Leaving Mansion Empty-Handed — Witnesses Talk', ded:'Anti-fraud raid ends without an arrest. Sources say cash changed hands.' };
  }
  if(force >= 2 || integ < 35){
    return { pub:'WAVE24 BREAKING', head:'"Heavy-Handed" — NACECA Mansion Raid Sparks Outcry', ded:'Aides decry "political witch hunt" as evidence is bagged.' };
  }
  if(arrest==='informant'){
    return { pub:'THE DAILY GONG', head:"NACECA Flips Cybercrime Boss — 'Bigger Names' Said To Be Next", ded:'Suspect cooperating. Prosecutors signal a wider net.' };
  }
  if(arrest==='professional' && civ>=1 && trust>=60 && integ>=60){
    return { pub:'THE DAILY GONG', head:'Anti-Fraud Officer Praised for Clean Lekki Arrest', ded:'Witnesses describe a calm operation. Child handed safely to family liaison.' };
  }
  if(arrest==='forceful'){
    return { pub:'NATIONAL DISPATCH', head:'NACECA Raid Saves Witness — Questions Over Force', ded:'Arrests made; civil liberties groups want a review.' };
  }
  return { pub:'THE LAGOS LEDGER', head:'NACECA Mansion Raid: Suspect In Custody, Evidence Bagged', ded:'A measured operation. The case file moves to prosecution.' };
}

function nextMissionPreview(){
  const cur = S.game.currentMission;
  if(cur==='m3'){
    return `Mission 4 — <b>Checkpoint Shakedown</b> · joint op with Anti-Kidnapping Squad on the Benin Bypass.
      <span style="display:inline-block;margin-left:8px;padding:2px 8px;border:1px solid rgba(93,208,122,.5);color:#5dd07a;font-family:Oswald;font-size:10px;letter-spacing:.18em">PLAYABLE</span>`;
  }
  if(cur==='m4'){
    return `Mission 5 — <b>Forest Shrine Compound</b> · investigate a shrine used as fear-cover by the cartel. Respect the sacred ground while you search.
      <span style="display:inline-block;margin-left:8px;padding:2px 8px;border:1px solid rgba(93,208,122,.5);color:#5dd07a;font-family:Oswald;font-size:10px;letter-spacing:.18em">PLAYABLE</span>`;
  }
  if(cur==='m5'){
    return `Mission 6 — <b>The Disappeared</b> · hostage rescue in an Asaba warehouse. Chase the runner, or save the captive — pick one, lose the other.
      <span style="display:inline-block;margin-left:8px;padding:2px 8px;border:1px solid rgba(93,208,122,.5);color:#5dd07a;font-family:Oswald;font-size:10px;letter-spacing:.18em">PLAYABLE</span>`;
  }
  if(cur==='m6'){
    return `Mission 7 — <b>No Signal Zone</b> · sabotaged telecom tower behind the UNIBEN gate. Restore power, trace the ransom calls, decide under fire.
      <span style="display:inline-block;margin-left:8px;padding:2px 8px;border:1px solid rgba(93,208,122,.5);color:#5dd07a;font-family:Oswald;font-size:10px;letter-spacing:.18em">PLAYABLE</span>`;
  }
  if(cur==='m7'){
    return `Mission 8 — <b>The Voice</b> · Season 1 finale. Ekosodin, after dark. Find the house, get Osas out, and face whoever has been making those calls.
      <span style="display:inline-block;margin-left:8px;padding:2px 8px;border:1px solid rgba(93,208,122,.5);color:#5dd07a;font-family:Oswald;font-size:10px;letter-spacing:.18em">PLAYABLE</span>`;
  }
  if(cur==='m8'){
    return `<b>Season 1 is complete.</b> Continue for the epilogue — and for who protected her.
      <span style="display:inline-block;margin-left:8px;padding:2px 8px;border:1px solid rgba(216,166,74,.6);color:#ffd76a;font-family:Oswald;font-size:10px;letter-spacing:.18em">SEASON 2 — COMING</span>`;
  }
  return 'Open the mission select to choose your next operation.';
}

function showAftermath(){
  if(typeof sideFinalize==='function') sideFinalize();
  // swap to victory music for the headline screen
  if(typeof musicForScene === 'function') musicForScene('victory');

  $('#aftermath-title').textContent = (MISSIONS.find(m=>m.id===S.game.currentMission)||{}).name||'OPERATION';
  $('#aftermath-region').textContent = ((MISSIONS.find(m=>m.id===S.game.currentMission)||{}).region||'').toUpperCase();
  const head = generateHeadline();
  S.game.headlines.push(head);

  const r = S.player.reputation;
  const arrestText = S.game.currentMission!=='m3' ? '—' : ({professional:'Professional restraint', forceful:'Forceful takedown', informant:'Informant deal', bribe:'BRIBED — case compromised'})[S.game.moralChoices.arrest] || '—';

  const o = S.game._opStart || {arrests:0, civ:0, force:0, intel:0, xp:S.player.xp};
  const op = {
    arrests: (S.game.arrests||0) - o.arrests,
    civ: (S.game.civiliansRescued||0) - o.civ,
    force: (S.game.forceUsed||0) - o.force,
    intel: (S.game.intelScore||0) - o.intel,
    ev: missionEvidenceCount(),
    xp: Math.max(0, (S.player.xp||0) - o.xp),
  };
  const grid = $('#aftermath-grid');
  grid.innerHTML = `
    <div class="aftermath-block">
      <h3>OPERATIONAL STATS</h3>
      <div class="stat-row"><span class="lbl">Arrests made</span><span class="val">${op.arrests}</span></div>
      <div class="stat-row"><span class="lbl">Evidence collected</span><span class="val">${op.ev}</span></div>
      <div class="stat-row"><span class="lbl">Civilians rescued</span><span class="val">${op.civ}</span></div>
      <div class="stat-row"><span class="lbl">Force used</span><span class="val ${op.force>0?'down':''}">${op.force}</span></div>
      <div class="stat-row"><span class="lbl">Intel gained</span><span class="val">+${op.intel}</span></div>
      <div class="stat-row"><span class="lbl">Arrest method</span><span class="val">${arrestText}</span></div>
    </div>
    <div class="aftermath-block">
      <h3>REPUTATION</h3>
      <div class="stat-row"><span class="lbl">Integrity</span><span class="val ${r.integrity>=60?'up':r.integrity<=40?'down':''}">${r.integrity}</span></div>
      <div class="stat-row"><span class="lbl">Public Trust</span><span class="val ${r.publicTrust>=60?'up':r.publicTrust<=40?'down':''}">${r.publicTrust}</span></div>
      <div class="stat-row"><span class="lbl">Agency Favour</span><span class="val ${r.agencyFavour>=60?'up':r.agencyFavour<=40?'down':''}">${r.agencyFavour}</span></div>
      <div class="stat-row"><span class="lbl">XP this op</span><span class="val up">+${op.xp}</span></div>
      <div class="stat-row"><span class="lbl">Total XP</span><span class="val">${S.player.xp}</span></div>
      <div class="stat-row"><span class="lbl">Level</span><span class="val">${S.player.level}</span></div>
    </div>
    <div class="headline-block">
      <div class="pub">${head.pub} · MORNING EDITION</div>
      <div class="head">${head.head}</div>
      <div class="ded">${head.ded}</div>
    </div>
    <div class="aftermath-block" style="grid-column:1/-1">
      <h3>NEXT IN THE INVESTIGATION</h3>
      <div style="font-size:13px;color:#bcc6d4;line-height:1.7">
        ${nextMissionPreview()}
      </div>
      <div style="font-size:12px;color:#7a8aa3;margin-top:8px">Season 2 (missions 9–12) is outlined in the mission select. Each card holds the briefing and chosen region.</div>
    </div>`;

  if(typeof onAftermath==='function') onAftermath(op, head);
  saveGame();
  showHUD(false);
  showOverlay('screen-aftermath');
}

