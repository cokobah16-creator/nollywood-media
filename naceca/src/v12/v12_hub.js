/* =========================================================================
   NACECA · v12 Phase 2 — HQ between cases
   After each case Kelechi comes back to a desk: Lagos HQ after Ikeja, the
   NACECA field office in Benin after the Edo and Delta cases. Uche is
   there, and Inspector Chidi in Benin. The phone has messages from the
   people the last case touched, and some of them need an answer. The news
   board shows what the city made of it. The Commander sends you to the
   next case — in person in Lagos, on a video call from Benin.
   ========================================================================= */
(function(){
'use strict';
const V12 = window.V12;
const MC = ()=>S.game.moralChoices || {};
const FL = ()=>S.game.flags || {};
const W = V12.who;

/* ---------------- the hubs ---------------- */
const HUBS = {
  h2:{ after:'m2', next:'m3', title:['LAGOS HQ', 'THAT EVENING · 19:40'], region:'Lagos', sub:'NACECA HQ · 19:40', city:'lagos', look:'evening',
       nextCard:['LEKKI · OLD GRA', 'TONIGHT · 21:30'], objective:'Report to Commander Adaeze' },
  h4:{ after:'m4', next:'m5', title:['NACECA FIELD OFFICE', 'BENIN CITY · 20:15'], region:'Edo', sub:'Field Office · Benin · 20:15', city:'benin', look:'night',
       nextCard:['OZALLA FOREST', 'FIRST LIGHT'], objective:'Call Commander Adaeze' },
  h5:{ after:'m5', next:'m6', title:['NACECA FIELD OFFICE', 'BENIN CITY · 13:10'], region:'Edo', sub:'Field Office · Benin · 13:10', city:'benin', look:'day',
       nextCard:['ASABA', 'RIVERSIDE · THAT NIGHT'], objective:'Call Commander Adaeze' },
  h6:{ after:'m6', next:'m7', title:['NACECA FIELD OFFICE', 'BENIN CITY · 23:05'], region:'Edo', sub:'Field Office · Benin · 23:05', city:'benin', look:'late',
       nextCard:['UGBOWO', 'THE NEXT EVENING'], objective:'Call Commander Adaeze' },
  h7:{ after:'m7', next:'t7', title:['NACECA FIELD OFFICE', 'BENIN CITY · 17:50'], region:'Edo', sub:'Field Office · Benin · 17:50', city:'benin', look:'dusk',
       nextCard:['UGBOWO JUNCTION', 'THE FILLING STATION · 20:40'], objective:'Call Commander Adaeze' },
};
V12.HUBS = HUBS;
V12.HUB_AFTER = { m2:'h2', m4:'h4', m5:'h5', m6:'h6', m7:'h7' };
V12.HUB_BEFORE = { m3:'h2', m5:'h4', m6:'h5', m7:'h6', t7:'h7' };
for(const h in HUBS) ENV_FOR[h] = 'hq';
V12.isHub = id => !!HUBS[id];
const hubDone = h => !!V12.mem().hubs[h];
/* runtime state for the office in play: never on S (saves are JSON) */
const RT = { hub:null };

/* ---------------- what Uche says ---------------- */
function trustLine(){
  const t = V12.ucheTier();
  if(t === 'high') return 'For what it\'s worth, sir — you work the way I\'d want my son to work.';
  if(t === 'low') return 'Sir, with respect. In this unit, how we get the answer is part of the answer. I\'ve buried officers who forgot that.';
  return 'You\'re learning the road. So am I, every week.';
}
function ucheLines(h){
  const L = [], m = MC(), say = (text, mood)=>L.push({ speaker:'SGT. UCHE', portrait:'sergeant', mood, text });
  if(h === 'h2'){
    const kc = W.kc();
    say(kc === 'flipped' ? 'You signed KC up instead of cuffing him. Most new officers want the arrest on their sheet. You wanted the next name.'
      : kc === 'detained' ? 'KC is in holding. His mother came to the front desk at six. I gave her water and a chair.'
      : kc === 'forced' ? 'That boy KC. The whole market saw what happened to him. So did I.' : 'KC went through Computer Village like water. Tunde says he\'ll surface.', kc === 'forced' ? 'evasive' : undefined);
    if(W.bisi()) say('And a trader from Ikeja sent puff-puff for "the officer who knows fake alerts". It\'s on your desk. I ate two.');
    say('Lekki is tonight. Whatever you got on that table — bring it. I would rather plan than pray.');
  }
  if(h === 'h4'){
    const mu = W.musa();
    say(mu === 'flip_driver' ? 'Musa is wearing a wire for us now. A brave man, or a frightened one. Sometimes it\'s the same man.'
      : mu === 'tail_driver' ? 'Musa drove on with a tail behind him. If he leads us anywhere, we\'ll know by morning.'
      : mu === 'arrest_driver' ? 'Musa is in the cell downstairs. He keeps asking who will feed his cattle.' : 'The ledger from the truck is a route map. Somebody planned this road for years.');
    say(trustLine(), V12.ucheTier() === 'low' ? 'evasive' : undefined);
    say('Inspector Chidi wants a word. He doesn\'t say that often.');
  }
  if(h === 'h5'){
    const sh = W.shrine();
    say(sh === 'negotiate' ? 'Pa Eze opened that gate himself. My grandmother would have liked you.'
      : sh === 'force' ? 'The Ozalla elders have petitioned the Governor. They\'re calling us "the boots on the sacred ground". It will follow us.'
      : sh === 'leave' ? 'We walked away from a cache. I hope the State Order arrives before they move it.' : 'The shrine is quiet now. The cache isn\'t.', sh === 'force' ? 'angry' : undefined);
    if(V12.street('tapper') === 'respect') say('That old tapper you greeted on the path — Papa Ikenna. His grandson came with a message: the cars went back toward the Niger bridge. Asaba, sir.');
    say(trustLine());
  }
  if(h === 'h6'){
    const tb = W.tobi(), lost = !!S.game._asabaHostageLost;
    say(tb === 'rescue' ? 'Tobi is at St. Theresa\'s. He keeps asking for "the officer who came back for him".'
      : tb === 'chase' && !lost ? 'You took the fixer and I took the accountant. Don\'t make me run like that again, sir. My knees are forty-six.'
      : tb === 'chase' ? 'Tobi\'s family came for him this evening. I couldn\'t look at his mother.' : 'We lost both of them. I keep smelling the smoke.', (tb === 'chase' && lost) || tb === 'failed' ? 'afraid' : undefined);
    say(trustLine());
  }
  if(h === 'h7'){
    const tw = W.tower();
    say(tw === 'hold' ? 'We held the tower. Osaro\'s cabinet logged everything — the Voice\'s handset sleeps in Ekosodin.'
      : (tw === 'extract' || tw === 'cut_extract') ? 'We got the civilians out. The trace is half a picture, but the half we have points at Ekosodin.'
      : 'We called in backup and kept the tower. It cost us time. The trace still says Ekosodin.');
    say(W.musaTalked() ? 'Musa said the Engineer waits at the filling station before Ugbowo junction. A black jeep. Tonight we sit on it. When he moves, we follow.'
      : 'The fuel receipt from Asaba and the tower logs say the same thing: a filling station before Ugbowo junction, every night. Tonight we sit on it.');
    say(V12.ucheTier() === 'low' ? 'I\'ll drive. But you tell me early, and you tell me straight. I won\'t guess for you.' : 'I drive, you talk. Closer, back off, which way he turns. Early, not late.');
  }
  return L;
}
function chidiLines(h){
  const L = [], say = (text, mood)=>L.push({ speaker:'AKS LIAISON — INSP. CHIDI', portrait:'sergeant', mood, text });
  if(h === 'h4'){
    const lv = V12.street('levy');
    if(lv === 'reported') say('Your "levy" boy — yellow shirt, Bajaj. We picked up two of them at the junction with three hundred fake revenue cards. My men are tired of being called thieves for what those boys do.');
    else if(lv === 'warned') say('The truck drivers are calling you "the small officer who knows". Careful. Fame on this road is not always friendly.');
    else if(lv === 'ignored') say('There are boys on the bypass selling fake "levy" cards to drivers. If you see one, point him at me.');
    say('Good work on the truck. That ledger is a route, and routes have owners. Your Commander will want to call you herself.');
  }
  if(h === 'h5') say('Asaba is Delta State. Different command, different politics. My men will come with you, but at the bridge we become guests.');
  if(h === 'h6'){
    say('AKS has a new file. A UNIBEN student, taken at the campus gate on Friday. The mother has called every office in this city.', 'evasive');
    say(W.heardOsas() ? 'She asked for you by name, Kelechi. She says her son left a message at your Lagos office.' : 'She says her son once called NACECA about his work. Nobody wrote it down.');
  }
  if(h === 'h7') say('Tonight I have two men in an unmarked saloon a kilometre behind you. If you lose him, call. If he makes you, call faster.');
  return L;
}
function cmdLines(h){
  const L = [], who = HUBS[h].city === 'lagos' ? 'COMMANDER ADAEZE' : 'COMMANDER ADAEZE · VIDEO CALL';
  const say = (text, mood)=>L.push({ speaker:who, portrait:'commander', mood, text });
  if(h === 'h2'){
    say('Agent. Uche tells me you would rather plan than pray. Good.');
    say('Lekki at half past nine. I want Obi in a cell and his laptop on a desk by morning. Whatever is in that house goes on paper.');
  }
  if(h === 'h4'){
    say('Kelechi. The bypass ledger names a drop at a shrine in Ozalla Forest. The custodian is a Pa Eze. Go at first light, with Uche.');
    if(W.musa() === 'flip_driver') say('And Agent — a cooperator is a responsibility. Don\'t make him promises you can\'t keep.', 'evasive');
    else say('Tread carefully at that shrine. The papers are watching you now.');
  }
  if(h === 'h5'){
    say('The shrine ledger points to a warehouse on the Asaba riverside. A fixer the cartel calls Ifeanyi, and a hostage — an accountant, Tobi Onuoha.');
    say('Go tonight. Bring them both out if you can. If you can\'t, choose fast.');
  }
  if(h === 'h6'){
    say('Benin Zonal is shouting about a dead telecom tower in Ugbowo and a missing student. It\'s their case, but they asked for us. Take Uche. Keep it quiet.', 'evasive');
    if(W.heardOsas()) L.push({ speaker:'AGENT KELECHI', portrait:'kelechi', text:'Ma — the student. Osas Ehigie. He left a voicemail at HQ. About a payroll.' }, { speaker:who, portrait:'commander', text:'…Then you had better find him, hadn\'t you.' });
  }
  if(h === 'h7'){
    say('You know where he is. Bring him home, Kelechi. Quietly.');
    say('Nobody needs to be a hero.');
  }
  return L;
}

/* ---------------- the phone ---------------- */
const PEOPLE_ON_PHONE = {
  mum:{ name:'Mum', ini:'M', col:'#c8743a' }, tunde:{ name:'Tunde', ini:'T', col:'#5db86a' }, bisi:{ name:'Mama Bisi', ini:'B', col:'#d8a64a' },
  fraud:{ name:'NACECA Fraud Desk', ini:'FD', col:'#4a8ad8' }, musa:{ name:'Musa', ini:'Mu', col:'#a08a6a' }, musawife:{ name:'Hauwa (Musa\'s wife)', ini:'H', col:'#a08a6a' },
  kc:{ name:'KC', ini:'KC', col:'#e07d4a' }, sani:{ name:'Alhaji Sani', ini:'AS', col:'#1a78b8' }, chinedu:{ name:'Chinedu (Pa Eze\'s grandson)', ini:'C', col:'#c84a3a' },
  tobi:{ name:'Tobi Onuoha', ini:'TO', col:'#7a8aa3' }, tobisis:{ name:'Ngozi Onuoha', ini:'NO', col:'#7a8aa3' }, ehigie:{ name:'Mrs. Ehigie', ini:'E', col:'#b05a8a' },
  efe:{ name:'Efe', ini:'Ef', col:'#c9bd9b' }, unknown:{ name:'Unknown number', ini:'?', col:'#e84a5c' },
};
function phoneFor(h){
  const T = [], add = (who, msgs, reply, onRead)=>T.push({ who, msgs, reply, onRead });
  const them = text => ({ f:'them', text }), sys = text => ({ f:'sys', text });
  const m = MC();
  if(h === 'h2'){
    add('mum', [them('Kelechi, you didn\'t call yesterday. Your uncle in Enugu heard you are with NACECA now. He said to tell you: "Make them pay for every pensioner." Eat something o.')]);
    const kc = W.kc();
    add('tunde', [them(kc === 'flipped' ? 'Oga, KC don dey talk well well. Thank you say you no break the boy. Market people dey talk say you get sense.'
      : kc === 'detained' ? 'Oga, KC dey station. Him mama come market dey cry. I hope say na correct thing we do.'
      : kc === 'forced' ? 'Oga… market people dey talk say you slap the boy. Nobody go talk to me again for that market. I go dey quiet for some time.'
      : 'That boy KC don run Benin, I hear. E go show again. Dem always show again.')]);
    if(W.bisi()) add('bisi', [them('This is Bisi from Ikeja market. God bless you officer. I for don give that boy my whole week goods. I send puff-puff with your sergeant.')]);
    if(V12.street('ponzi') === 'flagged') add('fraud', [them('Got your flyer: "Grace Divine Cooperative", Allen Avenue, 30% a month. Opening a file. Thanks for the walk-in.')]);
  }
  if(h === 'h4'){
    add('mum', [them('Kelechi, my bank sent a message: "Your BVN will be blocked within 24 hours. Call 0809 *** 0174 to update." Should I call them?')],
      { id:'mum_bvn', opts:[
        { v:'warned', text:'Don\'t call, Mummy. Your bank will never ask you to update your BVN by text. Forward it to me.', then:[ them('Okay. I have forwarded it. You sound like my father.') ] },
        { v:'later', text:'I\'m on duty. I\'ll call you later.', then:[ them('Okay. God keep you.') ] } ] });
    if(W.musa() === 'flip_driver') add('musa', [them('Oga, na Musa. Since afternoon dem dey call my wife phone. Dem say make I remember say I get children. Wetin I go do?')],
      { id:'musa_protect', opts:[
        { v:'car', text:'I\'m sending a patrol car to sit outside your house tonight.', eff:{ agencyFavour:-2 }, then:[ them('Thank you oga. Thank you. My wife fit sleep.') ] },
        { v:'advice', text:'Keep your head down and don\'t answer unknown numbers. I\'ll check on you tomorrow.', then:[ them('…Okay oga.') ] } ] });
    if(W.musa() === 'arrest_driver') add('musawife', [them('Officer, my husband Musa is in your cell. He is not a bad man. He drives. Please let them give him food.')]);
    if(W.kcFair()) add('kc', [them('Oga na KC. I dey Benin with my uncle now. The SIM man for Computer Village dey send carton go Asaba every week. Dem dey write "IFE" for the box.')], null, 'kc_asaba');
    if(V12.street('levy') === 'warned') add('sani', [them('Officer, all the drivers for the queue no dey pay anybody now without receipt. The boy no come back again.')]);
  }
  if(h === 'h5'){
    const bvn = V12.reply('mum_bvn');
    add('mum', bvn === 'warned' ? [them('I asked the bank. They said they never send that kind of message. Your uncle says thank you for looking after us.')]
      : [them('Kelechi, I called that number. They asked for the code the bank sent me. I didn\'t give it — your voice was in my head — but I gave my date of birth. Was that bad?'), { f:'me', text:'Mummy, I\'ll call the bank and block the card. You did well not to send the code.' }, them('Okay. Pray for me, I pray for you.')]);
    if(W.musa() === 'flip_driver'){
      if(V12.reply('musa_protect') === 'car') add('musa', [them('Oga, police car dey my gate since night. My wife sleep. My children go school. I go talk anywhere you want.')]);
      else add('musa', [them('Oga… dem beat my brother for Sapele yesterday. Dem say next time na me. I no fit talk again. Abeg forget my statement.')], null, 'musa_recant');
    }
    if(W.shrine() === 'negotiate') add('chinedu', [them('Good afternoon sir. I am Chinedu, Pa Eze\'s grandson. Grandpa says: "The river does not forget who greeted it." He says the men who used the shrine came from the direction of the Niger bridge.')], null, 'paeze_hint');
    if(FL().kc_asaba) add('kc', [them('Oga, the carton for Asaba don stop this week. Something dey happen for that side.')]);
  }
  if(h === 'h6'){
    const tb = W.tobi(), lost = !!S.game._asabaHostageLost;
    if(tb === 'rescue' || (tb === 'chase' && !lost)) add('tobi', [them('Officer Kelechi? This is Tobi Onuoha. The nurse gave me your number. Thank you. I kept their books for six months before I understood what I was keeping. If you ever find their payroll files, I can read them. I set up the ledger codes myself.')]);
    else add('tobisis', [them('My brother Tobi was buried today. They say you were there that night. I don\'t know what to say to you. Just catch them.')]);
    const msgs = [them('Good evening. I am Mrs. Ehigie. My son, Osas Ehigie, a UNIBEN student, was taken at the campus gate on Friday. His friends say he called NACECA last week about something at his work. Please. Nobody is helping me.')];
    if(W.heardOsas()) msgs.push(sys('You saved his voicemail at Lagos HQ: "a name on one of the payrolls… your agency."'));
    add('ehigie', msgs, { id:'ehigie_first', opts:[
      { v:'help', text:'I\'m going to help you, ma. I\'ll call you tonight.', eff:{ publicTrust:+2 }, then:[ them('God bless you. Please. Please.') ] },
      { v:'details', text:'Send me everything: his number, where he worked, who he worked with.', then:[ them('His work is Crestfield Payroll Services, Sapele Road. His number is switched off since Friday. His friend Efe also did the job.') ] } ] });
    add('mum', [them('I saw Asaba on the news. Were you there? Call me when you can. Just one ring, so I know.')]);
  }
  if(h === 'h7'){
    add('ehigie', [them(W.promised() ? 'You promised me at that gate, officer. Tonight. I am holding you to it.' : 'You did not promise me anything at that gate. Thank you for that. Just bring him home.')]);
    add('unknown', [them('Stop digging, Agent Kelechi. Nobody needs to be a hero.')], { id:'voice_text', opts:[
      { v:'who', text:'Who is this?', then:[ sys('Message not delivered. The number is switched off.') ] },
      { v:'silent', text:'(Don\'t answer. Forward it to the trace desk.)', eff:{ intel:+3 }, then:[ sys('Forwarded. Registered to a SIM bought in Ekosodin, nine days ago, with a dead man\'s ID.') ] } ] });
    if(V12.street('mule') === 'witness') add('efe', [them('Officer, it\'s Efe. I found Osas\'s notes in my laptop bag. One payroll line says "C.A. — LAGOS — MONTHLY". That\'s all he wrote. Please find him.')]);
    if(W.musa() === 'flip_driver' && V12.reply('musa_protect') === 'car') add('musa', [them('Oga, that Engineer dey come the filling station before Ugbowo junction every night by 8:40. Black jeep. Plate start with BEN.')], null, 'musa_hilux');
    add('mum', [them('Ugbowo is in the news. Is that near you? Please. Come home for Christmas. I will make ofe onugbu.')]);
  }
  return T;
}
/* side effects of reading certain messages, once */
const ON_READ = {
  kc_asaba:()=>{ S.game.flags.kc_asaba = true; applyEffect({ intel:+6 }); },
  musa_recant:()=>{ V12.applyMusaConsequence(); toast('STATEMENT WITHDRAWN', 'Musa\'s statement is now contested', 2600); },
  paeze_hint:()=>{ applyEffect({ intel:+4 }); },
  musa_hilux:()=>{ S.game.flags.musa_hilux = true; },
};

/* the phone keeps its history across hubs */
function deliver(h){
  const mem = V12.mem(), P = mem.phone;
  if(mem.hubs[h + '_delivered']) return;
  for(const t of phoneFor(h)){
    const th = P[t.who] = P[t.who] || { msgs:[], unread:0 };
    for(const m of t.msgs) th.msgs.push(Object.assign({ at:h }, m));
    th.unread += t.msgs.filter(m => m.f === 'them').length;
    th.last = h;
    if(t.reply && V12.reply(t.reply.id) == null) th.pending = t.reply;
    if(t.onRead) th.onRead = t.onRead;
  }
  mem.hubs[h + '_delivered'] = 1;
}

function unreadCount(){ const P = V12.mem().phone; return Object.values(P).reduce((a, t)=>a + (t.unread || 0) + (t.pending ? 1 : 0), 0); }

V12.openPhone = function(onClose){
  let ov = document.getElementById('screen-phone');
  if(!ov){ ov = V12.el('div', 'overlay', ''); ov.id = 'screen-phone'; document.getElementById('game-root').appendChild(ov); }
  const P = V12.mem().phone;
  let cur = null;
  const order = ()=>Object.keys(P).sort((a, b)=>((P[b].unread || 0) + (P[b].pending ? 1 : 0)) - ((P[a].unread || 0) + (P[a].pending ? 1 : 0)) || (HUB_ORDER.indexOf(P[b].last) - HUB_ORDER.indexOf(P[a].last)));
  const avatar = id => { const p = PEOPLE_ON_PHONE[id] || { ini:'?', col:'#5a6a82' }; return `<span class="ph-av" style="background:${p.col}">${V12.esc(p.ini)}</span>`; };
  const nameOf = id => (PEOPLE_ON_PHONE[id] || { name:id }).name;
  const draw = ()=>{
    const list = order().map(id => { const t = P[id], lastMsg = t.msgs[t.msgs.length - 1] || { text:'' }, n = (t.unread || 0) + (t.pending ? 1 : 0);
      return `<button class="ph-row ${cur === id ? 'on' : ''}" data-id="${id}">${avatar(id)}<span class="ph-meta"><b>${V12.esc(nameOf(id))}</b><span>${V12.esc(lastMsg.text).slice(0, 70)}</span></span>${n ? `<i class="ph-dot">${n}</i>` : ''}</button>`; }).join('');
    let conv = '<div class="ph-empty">Pick a conversation.</div>';
    if(cur){
      const t = P[cur];
      const bub = t.msgs.map(m => { const fresh = m._fresh; m._fresh = false; return `<div class="ph-b ${m.f}${fresh ? ' fresh' : ''}">${V12.esc(m.text)}</div>`; }).join('');
      const rep = t.pending ? `<div class="ph-reply"><div class="ph-rh">REPLY</div>${t.pending.opts.map((o, i)=>`<button class="ph-opt" data-i="${i}">${V12.esc(o.text)}</button>`).join('')}</div>` : '';
      conv = `<div class="ph-ch"><button class="ph-back" aria-label="Back">‹</button>${avatar(cur)}<b>${V12.esc(nameOf(cur))}</b></div><div class="ph-msgs" id="ph-msgs">${bub}</div>${rep}`;
    }
    ov.innerHTML = `<div class="overlay-bg"></div><div class="ph-frame ${cur ? 'reading' : ''}">
      <div class="ph-top"><span>${V12.esc((HUBS[S.game.currentMission] || {}).sub || 'PHONE')}</span><button class="ph-x" aria-label="Close">✕</button></div>
      <div class="ph-body"><div class="ph-list">${list || '<div class="ph-empty">No messages.</div>'}</div><div class="ph-conv">${conv}</div></div></div>`;
    ov.querySelector('.ph-x').onclick = close;
    ov.querySelectorAll('.ph-row').forEach(b => b.onclick = ()=>{ open(b.dataset.id); });
    const back = ov.querySelector('.ph-back'); if(back) back.onclick = ()=>{ cur = null; draw(); };
    ov.querySelectorAll('.ph-opt').forEach(b => b.onclick = ()=>answer(+b.dataset.i));
    const box = ov.querySelector('#ph-msgs'); if(box) box.scrollTop = box.scrollHeight;
  };
  const open = id => {
    cur = id; const t = P[id];
    if(t.unread){ t.unread = 0; if(t.onRead && !V12.mem().seen['read:' + t.onRead + ':' + t.last]){ V12.mem().seen['read:' + t.onRead + ':' + t.last] = 1; try{ ON_READ[t.onRead](); }catch(e){} } }
    if(typeof sfxClick === 'function') sfxClick();
    draw(); refreshLabel();
  };
  const answer = i => {
    const t = P[cur], o = t.pending && t.pending.opts[i]; if(!o) return;
    t.msgs.push({ f:'me', text:o.text, at:S.game.currentMission, _fresh:true });
    V12.reply(t.pending.id, o.v);
    if(o.eff) applyEffect(o.eff);
    t.pending = null; draw();
    (o.then || []).forEach((m, k)=>setTimeout(()=>{ t.msgs.push(Object.assign({ at:S.game.currentMission, _fresh:true }, m)); if(typeof sfxBlip === 'function') sfxBlip(); if(ov.classList.contains('show')) draw(); }, 700 + k*900));
    refreshLabel();
  };
  const close = ()=>{ showOverlay(null); if(typeof onClose === 'function') onClose(); };
  showOverlay('screen-phone');
  const first = order().find(id => P[id].unread || P[id].pending);
  if(first && window.innerWidth > 700) open(first); else draw();
};
const HUB_ORDER = ['h2', 'h4', 'h5', 'h6', 'h7'];

/* ---------------- the news board ---------------- */
function ticker(){
  const r = S.player.reputation, out = [], heat = V12.heat();
  out.push(r.publicTrust >= 65 ? 'WAVE24 PHONE-IN · "This new NACECA officer is different. He didn\'t even raise his voice."'
    : r.publicTrust >= 40 ? 'WAVE24 PHONE-IN · "They arrest, they release. We are watching them too."'
    : 'WAVE24 PHONE-IN · "Another officer, another headline. Who is checking NACECA?"');
  if(heat >= 60) out.push('ON THE STREET · Somebody is asking where the young NACECA officer sleeps.');
  else if(heat >= 40) out.push('ON THE STREET · The boys in Computer Village have started to say his name.');
  const pz = V12.street('ponzi');
  if(V12.started('m5') && pz){
    out.push(pz === 'flagged' ? 'BUSINESS · "Grace Divine" cooperative collapses — NACECA had opened a file weeks ago'
      : pz === 'warned' ? 'BUSINESS · Ikeja traders pulled out of "Grace Divine" before its collapse, after an officer\'s warning'
      : 'BUSINESS · Ikeja traders lose ₦40 million as "Grace Divine" cooperative collapses');
  }
  if(V12.street('levy') === 'ignored') out.push('EDO · Fake "levy" collectors fleece truck drivers on the Benin Bypass');
  if(V12.street('levy') === 'reported') out.push('EDO · AKS arrests two over fake transport-levy cards on the Benin Bypass');
  return out;
}
/* small items from the street, for days with no front page */
function smallClips(){
  const out = [], kc = W.kc(), pz = V12.street('ponzi'), lv = V12.street('levy'), tp = V12.street('tapper');
  if(kc) out.push(kc === 'forced' ? { pub:'WAVE24 NEWS', head:'Video: officer slaps teenager at Computer Village', ded:'NACECA says it is "reviewing the footage". Traders say the boy was running SIM cards for a fake-alert gang.' }
    : kc === 'escaped' ? { pub:'THE DAILY GONG', head:'Phone-scam runner gives NACECA patrol the slip in Ikeja', ded:'The teenager vanished into Computer Village. Traders say the fake-alert crew is "back by Monday".' }
    : { pub:'THE ISLAND HERALD', head:'Ikeja traders say fake-alert gang has gone quiet', ded:'"An officer came and did not shout," says one trader. "He just asked the right questions."' });
  if(pz === 'flagged') out.push({ pub:'THE LAGOS LEDGER', head:'NACECA opens file on "Grace Divine" cooperative', ded:'The Allen Avenue scheme promised members thirty percent a month.' });
  if(lv === 'reported') out.push({ pub:'NATIONAL DISPATCH', head:'Two held over fake "union levy" cards on Benin Bypass', ded:'Drivers had paid five thousand naira per truck to men with hologram stickers.' });
  if(tp === 'respect') out.push({ pub:'THE DAILY GONG', head:'Ozalla elders: "The officer who greeted us is welcome"', ded:'A palm-wine tapper says he told NACECA about night vehicles with Asaba plates.' });
  return out;
}
V12.openNews = function(onClose){
  let ov = document.getElementById('screen-news');
  if(!ov){ ov = V12.el('div', 'overlay', ''); ov.id = 'screen-news'; document.getElementById('game-root').appendChild(ov); }
  const arc = (S.game.archive || []).slice().sort((a, b)=>b.at - a.at).concat(smallClips());
  const main = arc[0], rest = arc.slice(1, 4);
  const clip = (a, big)=>a ? `<article class="nb-clip ${big ? 'big' : ''}" style="--r:${big ? -0.6 : (Math.random()*4 - 2).toFixed(1)}deg">
      <div class="nb-pub">${V12.esc(a.pub || '')}</div><h3>${V12.esc(a.head || '')}</h3><p>${V12.esc(a.ded || '')}</p>${a.grade ? `<span class="nb-g g-${a.grade}">${a.grade}</span>` : ''}</article>` : '';
  ov.innerHTML = `<div class="overlay-bg"></div><div class="nb-frame">
    <div class="nb-head"><div><div class="plan-k">THE NEWS BOARD</div><div class="plan-t">WHAT THE CITY MADE OF IT</div></div><button class="ph-x nb-x" aria-label="Close">✕</button></div>
    <div class="nb-board">${main ? clip(main, true) : '<p class="ops-p">No front pages yet.</p>'}<div class="nb-rest">${rest.map(a => clip(a, false)).join('')}</div></div>
    <div class="nb-ticker">${ticker().map(t => `<span>${V12.esc(t)}</span>`).join('')}</div>
    <div class="nb-foot">${main ? '<button class="btn" id="nb-share">SHARE THIS FRONT PAGE</button>' : ''}<button class="btn primary" id="nb-done">BACK TO THE OFFICE</button></div></div>`;
  const close = ()=>{ showOverlay(null); if(typeof onClose === 'function') onClose(); };
  ov.querySelector('.nb-x').onclick = close; ov.querySelector('#nb-done').onclick = close;
  const sh = ov.querySelector('#nb-share');
  if(sh && main) sh.onclick = ()=>{ const m = MISSIONS.find(x => x.id === main.mid) || {}; V12.shareHeadline({ pub:main.pub, head:main.head, ded:main.ded, grade:main.grade, region:m.region }); };
  showOverlay('screen-news');
};

/* ---------------- dressing the office ---------------- */
function retint(look){
  const sc = ENGINE.scene; if(!sc) return;
  const P = { evening:{ k:0.85, col:'#ffd9b0', bg:'#070a12' }, night:{ k:0.62, col:'#d8ecff', bg:'#04060c' }, day:{ k:1.0, col:'#fff1dc', bg:'#0b1220' },
              late:{ k:0.5, col:'#c8d8ff', bg:'#03050a' }, dusk:{ k:0.78, col:'#ffc890', bg:'#080a12' } }[look] || { k:1, col:'#ffffff', bg:'#05080f' };
  const tint = new THREE.Color(P.col);
  sc.traverse(o => {
    if(o.isLight){ o.intensity *= o.isAmbientLight || o.isHemisphereLight ? Math.max(0.6, P.k) : P.k; if(o.color && !o.isHemisphereLight) o.color.lerp(tint, 0.35); }
    const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    for(const m of ms){ if(m && m.lightMap && m.lightMapIntensity != null && !m._v12hub){ m._v12hub = true; m.lightMapIntensity *= P.k; } }
  });
  sc.background = new THREE.Color(P.bg); if(sc.fog) sc.fog.color = new THREE.Color(P.bg);
}
function plaque(text){
  const c = document.createElement('canvas'); c.width = 512; c.height = 128; const x = c.getContext('2d');
  x.fillStyle = '#0b1426'; x.fillRect(0, 0, 512, 128); x.strokeStyle = '#d8a64a'; x.lineWidth = 6; x.strokeRect(8, 8, 496, 112);
  x.fillStyle = '#f0c878'; x.font = '700 34px Oswald, "Arial Narrow", sans-serif'; x.textAlign = 'center'; x.fillText(text, 256, 77, 470);
  const tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.6), new THREE.MeshBasicMaterial({ map:tex }));
  return m;
}
function makeChidi(){
  if(typeof PEOPLE === 'undefined' || !PEOPLE.make || !ART.ready) return buildNPCMesh('#5a3826', '#5a6a3a', '#2a2a1a', '#0a0a08', { hair:'cap', capColor:'#7a1a1a', longSleeve:true });
  return PEOPLE.make('npc', { body:'M', skin:'#4a2c1e', hair:'#0c0a09', beard:'#120d0b', torso:'#4e5a34', armA:'#4e5a34', armB:'#4e5a34', armC:'#4e5a34',
    hips:'#2c3020', thigh:'#2c3020', shin:'#2c3020', shoe:'#111111', gear:['Gear_Beret'], beret:'#6a1418', scale:1.02 });
}
function dressHub(h){
  const H = HUBS[h], sc = ENGINE.scene; if(!sc) return;
  retint(H.look);
  const npcMesh = n => (n && n.isObject3D) ? n : (n && n.mesh);
  const old = ENGINE.interactables || [];
  const pick = re => old.find(i => re.test(i.label || ''));
  const table = pick(/^Approach Commander/), phone = pick(/^Read your phone/), board = pick(/^Check the case board/), door = pick(/^Deploy to/);
  const cmd = (ENGINE.npcs || []).map(npcMesh).find(m => m && m.userData && m.userData._proxy && Math.abs(m.position.z + 8) < 1.2)
           || (ENGINE.npcs || []).map(npcMesh).find(m => m && m.position && Math.abs(m.position.z + 8) < 0.8);
  // Benin: the Commander is in Lagos; a video call on the wall screen instead
  let callAnchor = cmd;
  if(H.city === 'benin'){
    if(cmd){ cmd.visible = false; }
    callAnchor = new THREE.Object3D(); callAnchor.position.set(0, 1.4, -8.4); sc.add(callAnchor);
    const p = plaque('NACECA · BENIN');
    if(board && board.mesh){
      // above the case board, on the same wall
      board.mesh.updateMatrixWorld(true);
      const wp = new THREE.Vector3(), wq = new THREE.Quaternion(); board.mesh.getWorldPosition(wp); board.mesh.getWorldQuaternion(wq);
      const n = new THREE.Vector3(0, 0, 1).applyQuaternion(wq);
      p.position.copy(wp).add(new THREE.Vector3(0, 1.15, 0)).addScaledVector(n, 0.04); p.quaternion.copy(wq);
    } else { p.position.set(-11.68, 2.25, 5.2); p.rotation.y = Math.PI/2; }
    sc.add(p);
    // fewer people this far from Lagos: one analyst stays
    (ENGINE.extraSkinned || []).slice(1).forEach(ch => { if(ch.parent) ch.parent.remove(ch); });
    ENGINE.extraSkinned = (ENGINE.extraSkinned || []).slice(0, 1);
  }
  // Uche on his feet by the table
  let uche;
  if(typeof PEOPLE !== 'undefined' && PEOPLE.make && ART.ready){
    uche = PEOPLE.make('uche'); uche.position.set(-4.3, 0, 2.7); uche.rotation.y = 2.2; sc.add(uche);
    uche.userData.anim.play(PEOPLE.clips && PEOPLE.clips.folded ? 'folded' : 'idle', { fade:0 }); ENGINE.extraSkinned.push(uche);
  } else { uche = buildNPCMesh('#5a3818', '#1a2a18', '#1a2a18', '#0a0a08', { hair:'crop', beard:true, longSleeve:true }); uche.position.set(-4.3, 0, 2.7); uche.rotation.y = 2.2; sc.add(uche); ENGINE.npcs.push(uche); }
  if(typeof addObstacle === 'function') addObstacle(-4.3, 2.7, 0.7, 0.7);
  let chidi = null;
  if(H.city === 'benin'){
    chidi = makeChidi(); chidi.position.set(4.6, 0, -2.9); chidi.rotation.y = -1.0; sc.add(chidi);
    if(chidi.userData && chidi.userData.anim){ chidi.userData.anim.play('idle', { fade:0 }); ENGINE.extraSkinned.push(chidi); } else ENGINE.npcs.push(chidi);
    if(typeof addObstacle === 'function') addObstacle(4.6, -2.9, 0.7, 0.7);
  }
  ENGINE.interactables = [];
  const st = RT.hub = { h, uche:false, chidi:false, phone:false, news:false };
  const itUche = { mesh:uche, label:'Talk to Uche', verb:'talk', range:2.6, labelY:1.6, onInteract:()=>{
    if(st.uche){ toast('SGT. UCHE', h === 'h7' ? '"Eight-forty. Eat first."' : '"Go on, sir. I\'m not going anywhere."', 1800); return; }
    DIALOGUE.hub_uche_run = ucheLines(h);
    startDialogue('hub_uche_run', ()=>{ st.uche = true; itUche._used = true; completeObjective('hb_uche'); });
  }};
  ENGINE.interactables.push(itUche);
  if(chidi){ const itChidi = { mesh:chidi, label:'Talk to Inspector Chidi', verb:'talk', range:2.6, labelY:1.6, optional:h !== 'h4', onInteract:()=>{
    if(st.chidi){ toast('INSP. CHIDI', '"Go well, Kelechi."', 1600); return; }
    DIALOGUE.hub_chidi_run = chidiLines(h);
    startDialogue('hub_chidi_run', ()=>{ st.chidi = true; itChidi._used = true; completeObjective('hb_chidi'); });
  }}; ENGINE.interactables.push(itChidi); }
  const phoneMesh = phone ? phone.mesh : (table && table.mesh);
  const phoneIt = { mesh:phoneMesh, label:'Check your phone', verb:'inspect', range:2.6, onInteract:()=>{
    V12.openPhone(()=>{ refreshLabel(); if(!unreadCount()){ st.phone = true; phoneIt._used = true; completeObjective('hb_phone'); } else phoneIt._used = false; });
  }};
  if(phoneMesh) ENGINE.interactables.push(phoneIt);
  st.phoneIt = phoneIt;
  if(board){ const itNews = { mesh:board.mesh, label:'Read the news board', verb:'inspect', range:3.2, onInteract:()=>{
    V12.openNews(()=>{ st.news = true; itNews._used = true; completeObjective('hb_news'); });
  }}; ENGINE.interactables.push(itNews); }
  if(table) ENGINE.interactables.push({ mesh:table.mesh, label:'Work the operations table', verb:'inspect', range:3.4, optional:true, onInteract:()=>V12.openOps() });
  if(callAnchor) ENGINE.interactables.push({ mesh:callAnchor, label:H.objective, verb:'talk', range:H.city === 'benin' ? 3.6 : 2.6, onInteract:()=>{
    if(!(st.uche && st.phone)){ toast('NOT YET', 'Uche and your phone first.', 1800); return; }
    DIALOGUE.hub_cmd_run = cmdLines(h);
    if(H.city === 'benin') V12.videoCall(true);
    startDialogue('hub_cmd_run', ()=>{ V12.videoCall(false); completeObjective('hb_cmd'); endHub(h); });
  }});
  if(door && H.city === 'lagos'){ /* the street door is not the way out tonight */ }
  if(ENGINE.player){ ENGINE.player.position.set(0, 0, 6.6); ENGINE.player.rotation.y = Math.PI; ENGINE.cameraYaw = ENGINE.playerYaw = Math.PI; }
  S.game.currentRegion = H.region; S.game.currentSubregion = H.sub; refreshHUD();
  refreshLabel();
}
function refreshLabel(){
  const st = RT.hub; if(!st || !st.phoneIt) return;
  const n = unreadCount();
  st.phoneIt.label = n ? `Check your phone (${n} new)` : 'Check your phone';
}

/* a call from Lagos fills the video wall */
V12.videoCall = function(on){
  let el = document.getElementById('v12-call');
  if(!on){ if(el) el.classList.remove('show'); return; }
  if(!el){ el = V12.el('div', '', `<div class="vc-dot"></div><span>VIDEO CALL · LAGOS HQ · ENCRYPTED</span>`); el.id = 'v12-call'; document.getElementById('game-root').appendChild(el); }
  el.classList.add('show');
};

function endHub(h){
  const H = HUBS[h];
  V12.mem().hubs[h] = Date.now();
  RT.hub = null;
  V12.log('mission_end', { m:h });
  if(typeof saveGame === 'function') saveGame(true);
  showHUD(false); ENGINE.movementEnabled = false; stopAmbient();
  titleCard(H.nextCard, 2600, ()=>{ V12._fromHub = H.next; loadMission(H.next); });
}

/* ---------------- hub missions ---------------- */
/* the office comes before the next case, however the next case is reached:
   the aftermath button, Continue, the mission select, or a case's own exit */
V12.wrap('loadMission', orig => function(id){
  if(!HUBS[id]){
    const h = V12.HUB_BEFORE[id];
    if(h && !hubDone(h) && (S.game.completedMissions || []).includes(HUBS[h].after)) id = h;
    else return orig.apply(this, arguments);
  }
  S.game.currentMission = id; S.game.alertLevel = 0;
  showHUD(false); ENGINE.movementEnabled = false; showOverlay(null);
  titleCard(HUBS[id].title, 2600, ()=>beginMission(id));
});
V12.wrap('beginMissionCore', orig => function(id){
  if(!HUBS[id]) return orig.apply(this, arguments);
  const H = HUBS[id];
  S.game._opEv = [];
  S.game._opStart = { arrests:S.game.arrests||0, civ:S.game.civiliansRescued||0, force:S.game.forceUsed||0, intel:S.game.intelScore||0, xp:S.player.xp||0, rep:Object.assign({}, S.player.reputation) };
  S.game._opBumps = 0;
  if(typeof fadeIn === 'function') fadeIn();
  if(typeof resetGuidance === 'function') resetGuidance();
  S.game.currentMission = id; S.game.flags = S.game.flags || {};
  showOverlay(null); showHUD(true); ENGINE.movementEnabled = true;
  setMissionTitle(H.city === 'lagos' ? 'Lagos HQ' : 'Field Office · Benin');
  const objs = [{ id:'hb_uche', text:'Talk to Uche' }];
  if(H.city === 'benin' && id === 'h4') objs.push({ id:'hb_chidi', text:'Inspector Chidi wants a word' });
  objs.push({ id:'hb_phone', text:'Check your phone' }, { id:'hb_news', text:'Read the news board' }, { id:'hb_cmd', text:H.objective });
  setObjectives(objs);
  setEvidenceMax(0);
  deliver(id);
  buildSceneHQ();
  try{ dressHub(id); }catch(e){ console.warn('[v12] hub dress', e); }
  startAmbient('hq');
  if(typeof playMusic === 'function') playMusic('investigation', { volume:0.26 });
  V12.log('mission_start', { m:id });
});

/* after the aftermath, the office comes before the next case */
const cont = document.getElementById('btn-aftermath-continue');
if(cont) cont.addEventListener('click', e => {
  const h = V12.HUB_AFTER[S.game.currentMission];
  if(h && !hubDone(h) && S.game.completedMissions.includes(S.game.currentMission)){
    e.stopImmediatePropagation();
    showOverlay(null); showHUD(false);
    loadMission(h);
  }
});
/* the aftermath says where you're going next */
V12.wrap('nextMissionPreview', orig => function(){
  const h = orig.apply(this, arguments), cur = S.game.currentMission, hub = V12.HUB_AFTER[cur];
  if(!hub || hubDone(hub)) return h;
  const where = HUBS[hub].city === 'lagos' ? 'Lagos HQ' : 'the NACECA field office in Benin City';
  if(cur === 'm7') return `Next — <b>${where}</b>, then <b>The Engineer's Car</b> (Case 07½): Uche drives, you call the tail. Then the finale.` + (h.includes('seal an accusation') ? h.slice(h.indexOf('<div')) : '');
  return `Next — <b>${where}</b>: your phone, the papers, and who remembers what you did. Then: ` + h;
});
/* a save made inside the office reopens the office */
V12.hubDone = hubDone;
V12.deliverPhone = deliver;
V12.unreadCount = unreadCount;

})();
