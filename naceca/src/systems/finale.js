/* =========================================================================
   NACECA · systems/finale.js
   Season 1 ending. Every route reaches Commander Adaeze; what the player
   built across seven missions decides whether her guilt can be PROVEN.
   Also: the epilogue (where everyone ended up), credits, and the Season 2
   stinger, which reveals who protected her without undoing her defeat.
   Beta casework: a wrong name on a charge sheet (Lagos, the route, the
   finale) follows that person into the headline and the epilogue.
   ========================================================================= */

/* who a filed charge sheet wrongly named, per case (settled sheets only for raids) */
function _cwWrong(c){
  const a = S.game && S.game.accusations, r = a && a[c];
  if(!r || !r.ok || r.ok.suspect) return null;
  if(c !== 'voice' && !r.settled) return null;
  return r.suspect;
}

/* What Kelechi can actually put to her. Each entry is earned earlier. */
function finaleProofs(){
  const m = S.game.moralChoices || {}, f = S.game.flags || {};
  const out = [];
  if(m.tower === 'hold')               out.push('Cabinet timing data — her handset in that compound, every night');
  if(m.asaba === 'rescue')             out.push("Tobi Onuoha can read Osas's drive — the 'C.A.' payroll line is hers");
  if(S.game._finCourierPhone)          out.push("The courier's phone — one saved number: Adaeze's private line");
  if(S.game._finRecording)             out.push('The recorded ransom call — a full trace, and her voice');
  if(f.fin_bodycam)                    out.push('Body-cam: her own words in the yard');
  if(f.musa_tip || m.checkpoint === 'flip_driver') out.push("Musa's statement — the Engineer took orders from 'Madam'");
  return out;
}

/* Called when the reveal conversation ends. */
function finaleResolve(){
  const proofs = finaleProofs();
  const n = proofs.length;
  const outcome = n >= 2 ? 'proven' : n === 1 ? 'contested' : 'unproven';
  S.game.moralChoices.finale = outcome;
  const hurt = (S.game._finRisk || 0) > 0;
  S.game.flags.fin_osas = hurt ? 'hurt' : 'safe';
  const key = 'fin_end_' + outcome;
  const sysLine = { speaker:'NACECA SYSTEM',
    text: (n ? `Evidence you can put to her (${n}): ` + proofs.join(' · ') + '.' : 'Evidence you can put to her: nothing that will hold up in court.')
        + (hurt ? ' Osas is hurt in the scramble — a broken wrist, nothing worse.' : ' Osas walks out on his own feet.') };
  DIALOGUE[key + '_run'] = [sysLine].concat(DIALOGUE[key]);
  startDialogue(key + '_run', ()=>{
    completeObjective('o5_voice');
    if(!S.game.completedMissions.includes('m8')) S.game.completedMissions.push('m8');
    if(outcome === 'proven') { S.game.arrests = (S.game.arrests||0) + 1; if(typeof unlock==='function') unlock('airtight'); }
    if(outcome === 'contested') S.game.arrests = (S.game.arrests||0) + 1;
    S.game.civiliansRescued = (S.game.civiliansRescued||0) + 1;
    awardXP(outcome === 'proven' ? 500 : outcome === 'contested' ? 400 : 300);
    sfxComplete(); stopAmbient(); showAftermath();
  });
}

/* Before the reveal: a bribe taken in Mission 3 is leverage she uses. */
function finaleRevealScript(){
  const base = DIALOGUE.fin_reveal.slice();
  if(S.game.moralChoices && S.game.moralChoices.arrest === 'bribe'){
    const i = base.findIndex(l => (l.text||'').startsWith('Give me the drive.'));
    if(i >= 0) base.splice(i, 0, { speaker:'COMMANDER ADAEZE', mood:'evasive',
      text:"And Chief Obi's drawer stays closed. I know what you took from it, Kelechi. I always knew." });
  }
  DIALOGUE.fin_reveal_run = base;
  return 'fin_reveal_run';
}

function finaleHeadline(){
  const o = S.game.moralChoices.finale, hurt = S.game.flags.fin_osas === 'hurt';
  let h;
  if(o === 'proven')    h = { pub:'THE DAILY GONG', head:'NACECA Commander Arrested in Ekosodin Kidnap Plot — Student Freed', ded:`The ransom calls came from inside the agency, investigators say. ${S.game.moralChoices.asaba === 'rescue' ? 'A flash drive and an accountant\'s testimony sealed the case.' : 'A flash drive and the payroll it held sealed the case.'}${hurt?' The student was treated for a broken wrist.':''}` };
  else if(o === 'contested') h = { pub:'THE LAGOS LEDGER', head:'Senior NACECA Officer Detained After UNIBEN Student Rescue', ded:'Prosecutors face a fight: one piece of hard evidence, a powerful defence, and an agency in shock.' };
  else h = { pub:'NATIONAL DISPATCH', head:'Kidnapped UNIBEN Student Freed; NACECA Commander Suspended Pending Inquiry', ded:'Questions mount over why Cdr. Adaeze reached the compound before backup did.' };
  // the wrong name went first, in public
  const w = _cwWrong('voice');
  if(w){
    const nm = ({ uche:'Sgt. Uche', osaro:'Engr. Osaro', obi:'Chief Obi', ifeanyi:'Ifeanyi', chidi:'Insp. Chidi' })[w] || 'another officer';
    h = Object.assign({}, h, { head:h.head.replace(/ — Student Freed$/, '') + ` — Hours After ${nm} Was Arrested in Error`, ded:h.ded + ` Earlier that night, on the investigating agent's word, ${nm} was arrested in public.` });
  }
  return h;
}

/* ---------------- epilogue, credits, stinger ---------------- */
function epilogueSlides(){
  const m = S.game.moralChoices || {}, f = S.game.flags || {}, rep = S.player.reputation;
  const o = m.finale, hurt = f.fin_osas === 'hurt';
  const kcFair = m.market_runner === 'caught' && m.choice !== 'force';
  const S_ = [];
  S_.push({ art:'osas_relieved', name:'OSAS EHIGIE', text: hurt ? 'Osas went home to Ugbowo with his arm in a cast. He sat his exams anyway, left-handed.' : "Osas went home to Ugbowo. He sat his exams a week late. He passed." });
  S_.push({ art:'ehigie_neutral', name:'MRS. EHIGIE', text:'She still puts her phone on the table at seven. It doesn\'t ring anymore.' });
  S_.push({ art: o==='proven' ? 'adaeze_afraid' : o==='contested' ? 'adaeze_evasive' : 'adaeze_angry', name:'COMMANDER ADAEZE',
    text: o==='proven' ? 'Convicted on four counts. She has never said who she answered to.'
        : o==='contested' ? 'On remand in Kirikiri, awaiting trial. Her lawyers file a new motion every week.'
        : 'Relieved of command. The inquiry has sat twice. No charges — yet.' });
  // alive: rescued, or the chase with the hostage not lost (Uche carried him out — asaba_resolve_chase).
  // Only the deliberate rescue takes the stand (canon: "Tobi (if rescued in M6) gives the testimony").
  const tobiAlive = m.asaba === 'rescue' || (m.asaba === 'chase' && !S.game._asabaHostageLost);
  if(m.asaba === 'rescue') S_.push({ art:'tobi_neutral', name:'TOBI ONUOHA', text:'Tobi read the drive line by line for the prosecution. It took him eleven days. He asked for nothing.' });
  else if(tobiAlive) S_.push({ art:'tobi_neutral', name:'TOBI ONUOHA', text:'Sgt. Uche carried Tobi out of the Asaba smoke. Tobi read the drive line by line for the prosecution from a hospital bed; his doctors kept him out of the witness box. He asked for nothing.' });
  else S_.push({ art:'tobi_afraid', name:'TOBI ONUOHA', text:'Tobi did not live to read the drive. The ledger he was taken for is evidence item fourteen.' });
  if(m.market_runner === 'escaped') S_.push({ art:'kc_evasive', name:'KC', text:'KC was never found. A boy who looked like him was seen in Computer Village, selling data cards.' });
  else if(kcFair) S_.push({ art:'kc_neutral', name:'KC', text:'KC sells data cards in Ikeja again — legally this time. He still won\'t look at a burgundy jacket.' });
  else S_.push({ art:'kc_angry', name:'KC', text:'KC served six months for the SIMs. He remembers the officer who hit him.' });
  if(f.musa_tip || m.checkpoint === 'flip_driver') S_.push({ art:'musa_neutral', name:'MUSA', text:'Musa drives for a cattle cooperative out of Kano. He testified about the Engineer for three hours.' });
  else S_.push({ art:'musa_afraid', name:'MUSA', text:'Musa served eight months. The Engineer was never charged.' });
  S_.push({ art: m.shrine==='force' ? 'paeze_angry' : 'paeze_neutral', name:'PA EZE',
    text: m.shrine==='negotiate' ? 'Pa Eze still tends the shrine. Nobody brings jerry-cans at night anymore.'
        : m.shrine==='force' ? 'Pa Eze has not spoken to an officer since the night the rifles came.'
        : 'Pa Eze still lights the fire. The cache was gone before the warrant came.' });
  S_.push({ art: f.child_gentle ? 'child_relieved' : 'child_afraid', name:'THE GIRL FROM LEKKI',
    text: f.child_gentle ? 'She lives with her aunt in Surulere now. She drew a policeman with a kind face and stuck it on the fridge.' : 'She lives with her aunt in Surulere now. She doesn\'t like the sound of boots.' });
  S_.push({ art:'uche_evasive', name:'SGT. UCHE', text:'Uche turned down a promotion. "Slower," he says. "But it holds."' });
  // the people a charge sheet wrongly named
  try{
    const CC = (typeof CW !== 'undefined' && CW.CASES) || {};
    const wl = _cwWrong('lagos'), wr = _cwWrong('route'), wv = _cwWrong('voice');
    const swap = (name, text)=>{ const s0 = S_.find(x => x.name === name); if(s0) s0.text = text; };
    if(wl === 'kc') swap('KC', m.market_runner === 'escaped' ? 'KC was never found. Your charge sheet called him "the kingpin", and his face is still on a NACECA wanted notice in Computer Village.' : 'KC was held as "the kingpin" on a NACECA charge sheet before Lekki. The charge collapsed in a week. In Ikeja they still call him "the boss", and he hates it.');
    if(wl === 'tunde') S_.push({ art:'', name:'TUNDE', text:'Your informant spent a night in a NACECA cell on your own charge sheet. He is back at the Ikeja market. He does not answer unknown numbers, or NACECA\'s.' });
    if(wl === 'pos') S_.push({ art:'', name:'THE IKEJA POS AGENT', text:'Held overnight as "the ringleader" on your charge sheet. The agent\'s licence was suspended for a year. Nobody apologised.' });
    if(wr === 'tobi') swap('TOBI ONUOHA', m.asaba === 'rescue' ? 'Tobi read the drive line by line for the prosecution — after a morning cuffed to a hospital bed on your charge sheet. He asked for nothing, not even an apology.'
      : tobiAlive ? 'Sgt. Uche carried Tobi out of the Asaba smoke, and your charge sheet held him until noon. He read the drive for the prosecution from a hospital bed anyway; his doctors kept him out of the witness box.'
      : 'Tobi did not live to read the drive. For a week the papers called him the cartel\'s accountant, because of your charge sheet.');
    if(wr === 'agent') S_.push({ art:'', name:'THE ASABA SIM AGENT', text:'Taken from a stall at Asaba Main Market on your charge sheet and released without charge. The stall is still shut.' });
    if(wr === 'musa'){ const mu = S_.find(x => x.name === 'MUSA'); if(mu) mu.text += ' Your charge sheet also named him "the route\'s principal"; it took a month to get that charge dropped.'; }
    if(wv && CC.voice && CC.voice.epilogue && CC.voice.epilogue[wv]){
      const e = CC.voice.epilogue[wv], ex = S_.find(x => x.name === e.name);
      if(ex) ex.text = e.text; else S_.push({ art:e.art, name:e.name, text:e.text });
    }
  }catch(e){}
  S_.push({ art: rep.integrity >= 70 ? 'kelechi_neutral' : rep.integrity <= 40 ? 'kelechi_evasive' : 'kelechi_neutral', name:'AGENT KELECHI',
    text: rep.integrity >= 70 ? 'The new commander offered him a Superintendent\'s badge. He asked for the case files instead.'
        : rep.integrity <= 40 ? 'He kept his badge. Some nights he wonders what it cost, and who else knows.'
        : 'He was back at Lagos HQ on Monday. There was a new name on the commander\'s door.' });
  return S_;
}

function ensureEpilogueScreen(){
  let ov = document.getElementById('screen-epilogue');
  if(ov) return ov;
  ov = document.createElement('div'); ov.className = 'overlay'; ov.id = 'screen-epilogue';
  ov.innerHTML = `<div class="overlay-bg"></div><div class="epi" id="epi"></div><div class="epi-hint">TAP TO CONTINUE</div>`;
  document.getElementById('game-root').appendChild(ov);
  ov.addEventListener('click', ()=>advanceEpilogue());
  document.addEventListener('keydown', e=>{ if(ov.classList.contains('show') && (e.code==='Space'||e.code==='Enter')){ e.preventDefault(); advanceEpilogue(); } });
  return ov;
}
const EPI = { slides:[], i:0 };
function startEpilogue(){
  ensureEpilogueScreen();
  musicForScene('victory');
  EPI.slides = epilogueSlides().map(s=>({kind:'person', ...s}));
  EPI.slides.push({ kind:'card', title:'NACECA', sub:'SEASON 1 — OPERATION SERPENT\'S ROUTE', text:'Thank you for playing.' });
  EPI.slides.push({ kind:'stinger', place:'ABUJA · 03:10', lines:[
    'A phone rings in an office on the ninth floor. The nameplate on the door reads: OFFICE OF THE DIRECTOR-GENERAL — NACECA.',
    '"She\'s finished. The boy talked."',
    '"Then she was careless. Find out who trained that agent — and close Ekosodin before Zonal reads the rest of that drive."',
  ]});
  EPI.slides.push({ kind:'card', title:'SEASON 2', sub:'Someone protected her for twenty years.', text:'' });
  EPI.i = 0;
  S.game.seasonOneComplete = true;
  saveGame(true);
  showHUD(false);
  showOverlay('screen-epilogue');
  renderEpilogue();
}
function renderEpilogue(){
  const s = EPI.slides[EPI.i], el = document.getElementById('epi'); if(!s || !el) return;
  el.classList.remove('in'); void el.offsetWidth; el.classList.add('in');
  if(s.kind === 'person'){
    const src = (typeof PORTRAIT_ART!=='undefined' && PORTRAIT_ART[s.art]) || '';
    el.innerHTML = `<div class="epi-person"><div class="epi-face">${src?`<img src="${src}" alt="${s.name}">`:''}</div>
      <div class="epi-copy"><div class="epi-name">${s.name}</div><div class="epi-text">${s.text}</div></div></div>`;
  } else if(s.kind === 'stinger'){
    el.innerHTML = `<div class="epi-stinger"><div class="epi-place">${s.place}</div>${s.lines.map((l,i)=>`<p style="animation-delay:${0.4+i*1.1}s">${l}</p>`).join('')}</div>`;
  } else {
    el.innerHTML = `<div class="epi-card"><div class="epi-title">${s.title}</div><div class="epi-sub">${s.sub}</div>${s.text?`<div class="epi-text">${s.text}</div>`:''}</div>`;
  }
}
function advanceEpilogue(){
  EPI.i++;
  if(EPI.i >= EPI.slides.length){ showOverlay('screen-title'); musicForScene('title'); if(typeof unlock==='function') unlock('season_one'); return; }
  renderEpilogue();
}
