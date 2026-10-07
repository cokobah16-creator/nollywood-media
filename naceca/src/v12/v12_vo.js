/* =========================================================================
   NACECA · v12 voice — the 40 lines worth recording first
   Each entry is matched by speaker and words, in dialogue or on the radio.
   To switch voices on: put the recordings next to the game as vo/vo01.mp3 …
   vo/vo40.mp3. On a web host the game finds them by itself; elsewhere set
   V12.VO_AUTO = true (or list single files in V12.VO_FILES). Missing files
   are skipped silently.
   ========================================================================= */
(function(){
'use strict';
const V12 = window.V12;
V12.VO_AUTO = V12.VO_AUTO || false;
V12.VO_BASE = V12.VO_BASE || 'vo/';
V12.VO_FILES = V12.VO_FILES || {};
// drop the recordings into vo/ next to the game and they switch on by themselves
try{
  if(!V12.VO_AUTO && /^https?:$/.test(location.protocol)){
    fetch(V12.VO_BASE + 'vo01.mp3', { method:'HEAD', cache:'no-store' })
      .then(r => { if(r.ok && !/text\/html/.test(r.headers.get('content-type') || '')) V12.VO_AUTO = true; }).catch(()=>{});
  }
}catch(e){}

const L = (id, who, text, dir)=>({ id, who, text, dir });
V12.VO = [
  L('vo01','COMMANDER ADAEZE',"You're late. He's already moving.",'Radio, rain behind her. Clipped, controlled. A superior who is never surprised.'),
  L('vo02','COMMANDER ADAEZE',"Blue shirt. Brown folder. Other side of the road. Don't stare at him.",'Radio. Each item its own beat.'),
  L('vo03','COMMANDER ADAEZE',"Keep twenty metres. If he turns around, disappear.",'Radio. Teaching, not warm.'),
  L('vo04','MAN IN BLUE',"The girl moves tonight.",'Overheard, low, casual about something terrible.'),
  L('vo05','MAN IN BLUE',"No. Engineer changed it.",'Overheard. Irritated.'),
  L('vo06','COMMANDER ADAEZE',"Tell me what you see.",'Radio. Quiet. She wants details.'),
  L('vo07','MAN IN BLUE',"Who's that?",'Sharp, alarmed. He has seen Kelechi.'),
  L('vo08','COMMANDER ADAEZE',"Agent Kelechi. Welcome to NACECA. I won't waste your morning — we have a live case.",'In person. Brisk authority. First impression of the boss.'),
  L('vo09','COMMANDER ADAEZE',"I don't need cowboys, Kelechi. I need control.",'The line the finale quotes back. Flat, certain.'),
  L('vo10','INFORMANT — TUNDE',"Oga Kelechi! You came. The boy I told you about — that one in the orange shirt by the phone-charging stand. He's been moving SIMs for a syndicate.",'Lagos market energy, half-whisper, nervous to be seen.'),
  L('vo11','TEEN SUSPECT — KC',"Officer abeg! I no know wetin dey for that phone. Na person give me to hold am for am. I just dey hustle small data card sales!",'Pidgin. Breathless after the chase. A frightened teenager.'),
  L('vo12','TEEN SUSPECT — KC',"If you carry me go station… my mama dey sick. Abeg. I fit help you. I sabi the guy wey dey send the phishing message dem.",'Pidgin. Pleading, then a flicker of a deal.'),
  L('vo13','SUSPECT — "CHIEF" OBI',"My friend! Officer! Take am easy now. We fit reason this thing. Whatever number dey your head — I fit double am. Cash. Inside that drawer.",'Pidgin. Big man, all charm, sweating underneath.'),
  L('vo14','CHILD',"Aunty… I want my daddy. Why you people get gun? I no do anything…",'A child of about eight. Scared, small voice.'),
  L('vo15','CHILD',"...Okay. Your face get kindness. I go follow you.",'Calmer. Trusting.'),
  L('vo16','COMMANDER ADAEZE · ON THE PHONE',"No. Nobody needs to be a hero, sir. It will be handled quietly. My way.",'Overheard through a door, phone call to Abuja. THE planted phrase: say it exactly as the Voice will.'),
  L('vo17','CALLER · VOICEMAIL',"Hello? Is this NACECA? My name is Osas — Osas Ehigie. I'm a student at UNIBEN. I do data entry for a payroll firm in Benin.",'Phone voicemail, young man, polite, scared of what he found.'),
  L('vo18','CALLER · VOICEMAIL',"There's a name on one of the payrolls that — [static] — your agency. I don't want to say it on the phone. Please call me back. Please.",'Voicemail. Break up on [static]. The second "please" quieter.'),
  L('vo19','SGT. UCHE',"Jollof from the canteen. Cold, but it's jollof. Sit down before you fall down, sir.",'Late night, tired, fond. The warmest line in the game.'),
  L('vo20','TRUCK DRIVER — MUSA',"Officer abeg na correct papers I get o. I dey carry cattle from Kano to Sapele. Five years I dey do this road. No problem at all.",'Pidgin with a northern accent. Rehearsed, too fast.'),
  L('vo21','TRUCK DRIVER — MUSA',"Dem call am 'Engineer'. Him dey wait for the filling station before Ugbowo junction. And na woman dey give am order — dem dey call her 'Madam'. I fit show you the place. Abeg, tell them say I talk.",'Pidgin. Broken, relieved to be telling it.'),
  L('vo22','SGT. UCHE',"You can chase. You can rescue. Cannot do both. I'll take whichever you don't. But sir — I'm slower than you. The one you take, you take.",'Pre-breach whisper. Steady.'),
  L('vo23','MRS. EHIGIE',"Officer. Officer, please. They call me from seven. They let him say 'Mummy', then the voice says, 'Mama Osas, nobody needs to be a hero.' Then they take the phone. Three days now.",'A mother at the end of her strength. Quote the Voice flatly — she has heard it every night.'),
  L('vo24','MRS. EHIGIE',"...Hm. God go follow you, my son.",'Pidgin. A blessing given against her better judgement.'),
  L('vo25','SGT. UCHE',"Kelechi! East fence — three shooters, maybe four. They were waiting for the lights. I have the gate; I cannot hold the fence and the gate.",'Under fire. Shouting over gunfire.'),
  L('vo26','SGT. UCHE',"Then you choose, sir. Now.",'Under fire. Hard.'),
  L('vo27','THE VOICE',"Mama Osas. Have you found the money — or have you found the police? Nobody needs to be a hero.",'Phone line. Calm, amused, female but kept neutral (light processing until the reveal).'),
  L('vo28','THE VOICE',"…You still don't recognise my voice, do you? Good night, Agent.",'Phone. Enjoying it.'),
  L('vo29','OSAS EHIGIE',"It's not a gang. They keep saying 'Madam'. Madam wants the drive. Madam says the agency will never come here.",'Just freed. Shaking, fast.'),
  L('vo30','OSAS EHIGIE',"I hid it in my shoe. Payroll copies — a fixer, a chief, a man they call the Engineer. And the same initials at the top of every page. 'C.A.'",'Pride breaking through the fear on the last two words.'),
  L('vo31','THE VOICE',"Put the drive on the ground, Kelechi. Gently. Nobody needs to be a hero tonight.",'In the yard, unprocessed for the first time: it is Adaeze.'),
  L('vo32','AGENT KELECHI',"…Commander?",'Kelechi. Disbelief.'),
  L('vo33','AGENT KELECHI',"Commander. I wondered when you'd come yourself.",'Kelechi. He knew. Cold.'),
  L('vo34','COMMANDER ADAEZE',"I told you on your first day. I don't need cowboys. I need control.",'Mirror of vo09, same rhythm.'),
  L('vo35','COMMANDER ADAEZE',"Obi. The Engineer. Ifeanyi. Every one of them was a source. I kept them close so I could keep them in line. Do you know how many kidnappings never happened because I knew who to call?",'Justifying. She believes it.'),
  L('vo36','COMMANDER ADAEZE',"Give me the drive. Walk out with me. Tomorrow you're a Superintendent, and tonight never happened.",'The offer. Soft, almost kind.'),
  L('vo37','COMMANDER ADAEZE',"You think this ends with me? You have no idea who I answer to.",'Cuffed. Contempt.'),
  L('vo38','AGENT KELECHI',"Then you can tell the court. It starts with you.",'Kelechi. Quiet, final.'),
  L('vo39','SGT. UCHE',"Hands where I can see them, ma.",'Uche, arresting the woman who signed his transfer. Strained.'),
  L('vo40','COMMANDER ADAEZE',"A frightened boy and a hunch, Kelechi. That is all you have.",'If the case doesn\'t hold. Dismissive.'),
];
const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().slice(0, 64);
const BY = new Map(V12.VO.map(v => [norm(v.text), v]));
const missing = new Set();
let cur = null;
V12.voFor = text => BY.get(norm(text)) || null;
V12.playVO = text => {
  const v = V12.voFor(text); if(!v) return;
  const url = V12.VO_FILES[v.id] || (V12.VO_AUTO ? V12.VO_BASE + v.id + '.mp3' : null);
  if(!url || missing.has(url)) return;
  try{
    if(cur){ cur.pause(); cur = null; }
    const a = new Audio(url); a.volume = Math.max(0, Math.min(1, ((typeof SETTINGS !== 'undefined' && SETTINGS.voice != null) ? SETTINGS.voice : 90) / 100));
    a.onerror = ()=>missing.add(url);
    a.play().catch(()=>{}); cur = a;
  }catch(e){}
};
V12.stopVO = ()=>{ if(cur){ try{ cur.pause(); }catch(e){} cur = null; } };
V12.wrap('renderDialogueLine', orig => function(){
  V12.stopVO();
  const r = orig.apply(this, arguments);
  try{ const line = DLG.script && DLG.script[DLG.idx]; if(line) V12.playVO(V12.lineText ? V12.lineText(line) : line.text); }catch(e){}
  return r;
});
V12.wrap('endDialogue', orig => function(){ V12.stopVO(); return orig.apply(this, arguments); });
V12.wrap('_radioNext', orig => function(){
  const r = orig.apply(this, arguments);
  try{ const t = document.querySelector('#radio-sub .rs-text'); if(t && RADIO.busy) V12.playVO(t.textContent); }catch(e){}
  return r;
});
// the HQ choice branches all end on the same recorded line
DIALOGUE.hq_harsh = [ { speaker:'COMMANDER ADAEZE', mood:'angry', text:"Careful. Don't make me regret signing your posting." }, { speaker:'COMMANDER ADAEZE', text:"I don't need cowboys, Kelechi. I need control." } ];
for(const k of ['hq_lawful','hq_savvy']){ const a = DIALOGUE[k]; const last = a[a.length - 1]; if(last && /cowboys/.test(last.text)) last.text = "I don't need cowboys, Kelechi. I need control."; }

})();
