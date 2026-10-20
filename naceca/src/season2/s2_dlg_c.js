/* =========================================================================
   NACECA · v13_dlg_c.js — Season 2 "Operation Upstream", writer C
   Case 13  The Ninth Floor     (m13_)   ABUJA · NACECA HQ, 09:50
   Case 13½ The Gateman's Book  (m13b_)  ABUJA · MAITAMA, 22:15
   Case 15  The Barge           (m15_)   RIVERS · RIVERSTONE JETTY, 23:30
   Also: the documents m13_docket, m13_docket_kept, m13b_book (and
   m13b_book_photo), the Season 2 epilogue and Season 3 stinger, aftermath
   cards for m13/m13b/m14/m15, hub phone after m13/m13b/m14, source tips for
   GATE/KC/TUNDE, and the "Who protected Adaeze?" accusation data.
   Contract: s2/CASES.md. Data, plus small assemblers (V13.C) that splice
   the optional insert keys into the right place in a conversation.

   Marks: some lines carry `mark` ('adaeze', 'offer', 'wire', 'end', 'dg')
   — the engine ignores them; V13.C uses them as insertion points.
   Phone lines carry `phone:true` (a hint for a call-card portrait).
   ========================================================================= */
(function(){
'use strict';
const V13 = window.V13 = window.V13 || {};

/* ---------------- speakers (exactly as cast in CASES.md) ---------------- */
const KEL = 'AGENT KELECHI', UCHE = 'SGT. UCHE', SYS = 'NACECA SYSTEM', DG = 'DIRECTOR-GENERAL FASHINA',
      KUTI = 'MR. KUTI', OSA = 'COMMANDER OKUNDAYE', HAU = 'BARRISTER DANLADI', SEN = 'SENATOR DOUGLAS-AKPAN',
      BIT = 'SGT. (RTD.) BITRUS', SHAYI = 'BABA SHAYI', GATE = 'GATEMAN', TFC = 'TASK FORCE COMMANDER',
      IBI = 'CHAIRMAN IBINABO', KARO = 'MAMA KARO', TOBI = 'TOBI';
const say = (speaker, text, o) => Object.assign({ speaker, text }, o || {});
const k = (text, o) => Object.assign({ speaker:KEL, portrait:'kelechi', text }, o || {});
const u = (text, o) => Object.assign({ speaker:UCHE, portrait:'sergeant', text }, o || {});

/* the two answers to the Director-General's offer, shared by both versions of the meeting */
const OFFER_CHOICES = [
  { text:"I accept, sir.", tag:'harsh', flag:{ s2_ninth:'bury' }, effect:{ integrity:-12, agencyFavour:+10 }, next:'m13_dg_accept' },
  { text:"The file stays with Zonal, sir.", tag:'lawful', flag:{ s2_ninth:'refuse' }, effect:{ integrity:+6, agencyFavour:-15 }, next:'m13_dg_refuse' },
];
const WIRE_CHOICES = [
  { text:"I'll click it on in the lift, ma.", tag:'savvy', flag:{ s2_wire:true } },
  { text:"No wire. If he talks, he talks to me — and I write it all down the minute I'm out.", tag:'lawful', flag:{ s2_wire:false } },
];
/* the recording meter: draw him out (+17..+25) or spook him (−10) */
const W_ADAEZE = [
  { text:"Everyone says she was untouchable, sir. How does an officer last twenty years like that?", tag:'savvy', trace:25, next:'m13_dg_wire_3' },
  { text:"She told me she answered to someone, sir. She never said who.", tag:'kind', trace:21, next:'m13_dg_wire_3' },
  { text:"She took a call from Abuja every night that week, sir. With the lights off.", tag:'harsh', trace:-10, next:'m13_dg_wire_3_cold' },
];
const W_PEN = [
  { text:"Of course, sir. My mother says a man should sign things properly.", tag:'kind', trace:22, next:'m13_dg_wire_4' },
  { text:"It leaks, sir. I'd hate to spoil your shirt.", tag:'savvy', trace:-10, next:'m13_dg_wire_4_cold' },
  { text:"(Keep it in your pocket.) Sir, about the Senator —", tag:'harsh', trace:-10, next:'m13_dg_wire_4_cold' },
];
const W_SENATOR = [
  { text:"What does a friend like that get in return, sir?", tag:'savvy', trace:24, next:'m13_dg_wire_5' },
  { text:"He must be a hard man to say no to, sir.", tag:'kind', trace:19, next:'m13_dg_wire_5' },
  { text:"Is the 'D.G.O.' in that ledger your office, sir?", tag:'harsh', trace:-10, next:'m13_dg_wire_5_cold' },
];
const W_SILENCE = [
  { text:"(Say nothing. Let him fill the silence.)", tag:'savvy', trace:22, next:'m13_dg_offer_wire' },
  { text:"What do you want from me, sir?", tag:'lawful', trace:17, next:'m13_dg_offer_wire' },
  { text:"Sir, for the record — I won't be bought.", tag:'harsh', trace:-10, next:'m13_dg_offer_wire' },
];
const BITRUS_REASONS = [
  { text:"A student in Benin was locked in a boys' quarters for a flash drive. The money that paid for that comes through this gate.", tag:'kind', next:'m13b_bitrus_osas' },
  { text:"In the Ethiope creeks the fish come up black. The men who sell that oil meet behind this gate.", tag:'kind', next:'m13b_bitrus_creek' },
];
const BITRUS_ASK = [
  { text:"Keep the book safe, Sergeant. When the court calls, bring it and read it out yourself.", tag:'lawful', flag:{ s2_bitrus:'witness' }, next:'m13b_bitrus_witness' },
  { text:"Just let me photograph the pages. You stay out of this.", tag:'kind', flag:{ s2_bitrus:'photo' }, next:'m13b_bitrus_photo' },
];

/* ======================================================================
   DIALOGUE
   ====================================================================== */
Object.assign(DIALOGUE, {

  /* ===================== CASE 13 · THE NINTH FLOOR ===================== */

  // hub, the night before. Choice 0 = wear it, 1 = don't. Okundaye, on the video call from Benin, in every save
  // (V13.C.wireOffer() always returns this key: CN06).
  m13_wire_offer: [
    say(SYS, "22:10. On the video call from Benin, Commander Okundaye nods at the parcel her driver brought you: a black pen, heavier than a pen should be."),
    say(OSA, "Audio recorder. Four hours on one charge. Click once, it records; click again, it stops. That's all the technology you need to understand."),
    say(OSA, "It's your own conversation, so it isn't interception. In court it's computer evidence: whoever pulls the file off it signs a section 84 certificate."),
    say(OSA, "Kuti will take your phone at reception. He won't take a pen. Nobody ever takes a pen.", { mood:'evasive' }),
    say(OSA, "And if he finds it, you're finished by lunch and I'm in Maiduguri by dinner. So decide like a grown man, not a brave one.", { mood:'angry', choices:WIRE_CHOICES }),
    say(OSA, "Then go and sleep. He'll read your file twice tonight. Zonal's file on him is one page long. That's what worries me."),
  ],
  // RETIRED (CN06): Tobi no longer builds the pen or certifies the audio. Unused; kept so old references resolve.
  m13_wire_offer_tobi: [
    say(TOBI, "Sir — sorry, sir — I made you something. It's a pen. It's also a recorder. Four hours, and the battery is in better shape than I am."),
    say(TOBI, "Click once, it records. Click again, it stops. When you come back I pull the file, hash it, and sign the section 84 certificate myself."),
    say(TOBI, "It's your own conversation, so it isn't interception. Commander Okundaye checked with Barrister Danladi. Twice. I asked her to."),
    say(TOBI, "Sir… the last time people found out what I knew, they locked me in an office and poured petrol on the floor. Please don't let him find it.", { mood:'afraid', choices:WIRE_CHOICES }),
    say(TOBI, "Okay. Okay. Whichever one — just come back down from that floor. That's the main thing."),
  ],

  m13_kuti: [
    say(SYS, "NACECA Headquarters, Abuja. 09:50. The ninth floor: hard air-conditioning, new carpet, and a portrait of the Director-General smiling over the sofa."),
    say(KUTI, "Agent Kelechi. Welcome to the ninth floor. The Director-General is in a meeting. Sit."),
    say(KUTI, "Your phone, please. The DG doesn't like phones in the room. It will be quite safe with me. I have a drawer for them. It's full."),
    k("Of course."),
    say(KUTI, "The DG may be some time. He reads every file himself — even the thick ones. Especially the thick ones.", { choices:[
      { text:"Then I'll wait. Water would be kind, thank you.", tag:'kind' },
      { text:"How long is 'some time', Mr. Kuti?", tag:'harsh' },
      { text:"Take your time. I'll admire the portrait.", tag:'savvy' },
    ] }),
    say(KUTI, "As long as the DG needs. I'll fetch you water myself — nobody waits dry on this floor. Don't wander, Agent. The carpet is thick, and the walls listen.", { mood:'evasive' }),
  ],
  m13_kuti_caught: [
    say(KUTI, "That desk is not a waiting area, Agent.", { mood:'angry' }),
    say(KUTI, "The Director-General's papers are the Director-General's. I will have to mention this to him. I mention everything."),
    say(KUTI, "Your water. Drink it — he's ready for you now. He was always going to be ready for you now.", { mood:'evasive' }),
  ],

  // the meeting, no wire. Inserts (V13.C.ninth): Adaeze's fate after mark 'adaeze'; Lekki bribe and registered sources before mark 'offer'.
  m13_dg: [
    say(SYS, "10:41. The Director-General's office: law reports to the ceiling, a draughts game half played, and a highlife record turning with the volume low."),
    say(DG, "Agent Kelechi. Sit, sit. Kuti — the good tea, not the one we give the Board."),
    say(DG, "You like highlife? No — your generation has its own music. Highlife is for people who have lost something. Give it time."),
    say(DG, "I read your file last night. Unilag, Computer Science. Two years in a bank. Then us. And at the Academy, Inspector Effiong Asuquo."),
    say(DG, "Effiong retired to Calabar. He grows plantain now. His pension is processed by this office — I sign it myself, every month. He has never missed one.", { mood:'evasive', choices:[
      { text:"Inspector Asuquo taught me to write everything down, sir.", tag:'lawful', effect:{ integrity:+1 } },
      { text:"That's a lot of reading for one agent, sir.", tag:'savvy', effect:{ intel:+2 } },
      { text:"Is that meant to be a threat, sir?", tag:'harsh', effect:{ agencyFavour:-1 } },
    ] }),
    say(DG, "Effiong said you'd answer like that. The only cadet who read the oath twice. I keep a file on everyone, Kelechi. Most of them are boring."),
    say(DG, "Your Sergeant Uche turned down a promotion from this office. I don't punish a man for saying no to me. I just remember him."),
    say(DG, "And your mother still wants you home for Christmas. Ofe onugbu, isn't it? Go. Bitter leaf is good for the blood.", { mood:'evasive' }),
    k("(Mum's text. He has read my messages.)", { mood:'afraid' }),
    say(DG, "And Adaeze. Twenty years I knew her. A brilliant officer. A careless woman.", { mark:'adaeze' }),
    say(DG, "Senator Douglas-Akpan. You've been reading his name in a ledger. He is a friend of this agency — he funds our forensic lab.", { choices:[
      { text:"Then he can explain the ledger to a judge, sir.", tag:'lawful', effect:{ integrity:+1 } },
      { text:"What does a friend like that get in return, sir?", tag:'savvy', effect:{ intel:+2 } },
      { text:"Friends of the agency don't pay 'C.A.' every month, sir.", tag:'harsh', effect:{ agencyFavour:-1 } },
    ] }),
    say(DG, "Hm. A child may own as many clothes as an elder, Kelechi. He cannot own as many rags. You've seen six weeks of this country. I've seen forty years."),
    say(DG, "Your phone is in Kuti's drawer, so here is something true. Every petition against Adaeze for twenty years, I closed: 'no further action'. Useful people are rare.", { mood:'evasive' }),
    k("(He said it out loud. And nothing in this room heard it but me.)", { mood:'afraid' }),
    say(DG, "Do you play draughts? A piece that reaches the far side is crowned — and then it can move backwards. Nobody needs to be a hero, Kelechi.", { mark:'offer' }),
    k("(Nobody needs to be a hero. The Voice said that. Adaeze said that. She learned it in this room.)", { mood:'afraid' }),
    say(DG, "Superintendent, and command of Lagos Cyber & Financial Crimes — your old unit, your own budget, Uche if you want him. And the Upstream file comes home to headquarters, where files belong.", { choices:OFFER_CHOICES }),
  ],
  m13_dg_accept: [
    say(SYS, "He comes around the desk to shake your hand. His grip is dry and very gentle."),
    say(DG, "Good. Good man. I'll call Effiong myself — he'll be proud. Kuti has your letter at his desk.", { mood:'relieved' }),
    say(DG, "Give him the Upstream file on your way out: the images, the copies, the notes on your phone. Especially the notes on your phone."),
    say(DG, "And Kelechi — the fly that has no one to advise it follows the corpse into the grave. You had someone to advise you today. Remember who.", { mood:'evasive' }),
    say(SYS, "The promotion letter is waiting on Kuti's desk, signed and sealed. It is dated yesterday."),
    k("(Yesterday. He knew what I'd say before I said it.)", { mood:'afraid' }),
  ],
  m13_dg_refuse: [
    say(SYS, "He moves one piece on the draughts board. Then he looks at you as if you were the board."),
    say(DG, "Hm. Effiong said you'd say that too."),
    say(DG, "Then you're suspended, pending an inquiry into Ekosodin: a commander relieved of command without this office's authority, a student's drive opened without mine.", { mood:'evasive' }),
    k("With respect, sir, the file is already in a Zonal register. Inquiries read registers."),
    say(DG, "So do I. Leave your ID card on Kuti's desk. He'll give you a receipt. We are a lawful agency."),
    say(DG, "The child who won't let his mother sleep will not sleep either, Kelechi. Sleep well.", { mood:'angry' }),
  ],

  /* the meeting with the pen recording: the RECORDING meter (`trace`, 0–100). The opening lines carry
     trace; after that every point comes from a choice — drawing him out (+17..+25) or spooking him (−10) —
     so the meter does not depend on how the engine dedupes line traces across `next`.
     No spooks: 104–123 (full) · one spook: 88–93 (contested) · two: ~45–70 · three or more: weak. */
  m13_dg_wire: [
    say(SYS, "10:41. The Director-General's office: a draughts game half played, a highlife record on low — and a pen in your breast pocket, recording."),
    say(DG, "Agent Kelechi. Sit, sit. Kuti — the good tea, not the one we give the Board.", { trace:2 }),
    say(DG, "I read your file last night. Unilag, Computer Science. Two years in a bank. Then us. And at the Academy, Inspector Effiong Asuquo.", { trace:2 }),
    say(DG, "Effiong retired to Calabar. He grows plantain now. His pension is processed by this office — I sign it myself, every month.", { trace:2, mood:'evasive', choices:[
      { text:"Inspector Asuquo always said you never forget a name, sir.", tag:'savvy', trace:24, next:'m13_dg_wire_2' },
      { text:"You must know every officer in the agency, sir.", tag:'kind', trace:19, next:'m13_dg_wire_2' },
      { text:"Is that meant to be a threat, sir?", tag:'harsh', trace:-10, next:'m13_dg_wire_2_cold' },
    ] }),
  ],
  m13_dg_wire_2: [
    say(DG, "Every officer, and their mothers. Yours still wants you home for Christmas — ofe onugbu, isn't it? I keep a file on everyone. Most of them are boring."),
    say(DG, "And Adaeze. Twenty years I knew her. A brilliant officer. A careless woman.", { mark:'adaeze' }),
    say(DG, "Ask, Kelechi. You've been wanting to since you sat down.", { choices:W_ADAEZE }),
  ],
  m13_dg_wire_2_cold: [
    say(DG, "A threat? It's a pension, Kelechi. Young people hear threats the way old people hear thunder — in every cloud.", { mood:'evasive' }),
    say(DG, "And Adaeze. Twenty years I knew her. A brilliant officer. A careless woman.", { mark:'adaeze' }),
    say(DG, "Ask, Kelechi. You've been wanting to since you sat down.", { choices:W_ADAEZE }),
  ],
  m13_dg_wire_3: [
    say(DG, "Untouchable. Every petition against her for twenty years came to this desk, and I wrote 'no further action' on every one. Useful people are rare."),
    say(DG, "That's a handsome pen, for an agent's salary. May I?", { choices:W_PEN }),
  ],
  m13_dg_wire_3_cold: [
    say(DG, "Abuja calls a great many people at night, Agent. Most of them answer with the lights on.", { mood:'evasive' }),
    say(DG, "That's a handsome pen, for an agent's salary. May I?", { choices:W_PEN }),
  ],
  m13_dg_wire_4: [
    say(SYS, "He uncaps it and writes on his notepad in a long, looping hand — K. Fashina — then holds the pen up to the light."),
    say(DG, "Good weight. My father was a schoolmaster in Ijebu-Ode; he said you can judge a man by his pen. Here. Keep it close."),
    say(DG, "Now. Senator Douglas-Akpan. You've been reading his name in a ledger. He is a friend of this agency — he funds our forensic lab.", { choices:W_SENATOR }),
  ],
  m13_dg_wire_4_cold: [
    say(DG, "Hm. A young man who won't let go of his pen. I'll remember that.", { mood:'evasive' }),
    say(DG, "Now. Senator Douglas-Akpan. You've been reading his name in a ledger. He is a friend of this agency — he funds our forensic lab.", { choices:W_SENATOR }),
  ],
  m13_dg_wire_5: [
    say(DG, "Peace, Kelechi. On the second Friday of every month he gets an evening of peace, and a friend who answers the phone. At my age, that's all friendship is."),
    say(DG, "A child may own as many clothes as an elder. He cannot own as many rags.", { choices:W_SILENCE }),
  ],
  m13_dg_wire_5_cold: [
    say(DG, "Initials are cheap, Agent. My own driver signs 'D.G.O.' — Daniel Gbenga Olayemi. Shall we arrest him too?", { mood:'evasive' }),
    say(DG, "A child may own as many clothes as an elder. He cannot own as many rags.", { choices:W_SILENCE }),
  ],
  // every wire path ends here. Inserts (V13.C.ninth): Lekki bribe and registered sources before mark 'offer'.
  m13_dg_offer_wire: [
    say(DG, "Do you play draughts? A piece that reaches the far side is crowned — and then it can move backwards. Nobody needs to be a hero, Kelechi.", { mark:'offer' }),
    k("(Nobody needs to be a hero. The Voice said that. Adaeze said that. She learned it in this room.)", { mood:'afraid' }),
    say(DG, "Superintendent, and command of Lagos Cyber & Financial Crimes — your old unit, your own budget, Uche if you want him. And the Upstream file comes home: the drive, the images, the notes on your phone. Everything.", { choices:OFFER_CHOICES }),
  ],

  // Adaeze's fate (Season 1's verdict as Season 2 reads it: V13.s1fate()), inserted after mark 'adaeze' in either version
  m13_dg_adaeze_proven: [
    say(DG, "Four counts, and not one word from her about anyone else. Loyalty is rare, Kelechi. I notice it. I reward it — even late.", { mood:'evasive' }),
  ],
  m13_dg_adaeze_contested: [
    say(DG, "Remanded in Kirikiri, with a trial listed for January. Trials are long. Witnesses get tired. Exhibits go missing.", { mood:'evasive' }),
  ],
  m13_dg_adaeze_unproven: [
    say(DG, "Relieved of command and never charged. The inquiry into her sits again next month. I chair it.", { mood:'evasive' }),
  ],
  // S1: Kelechi took money from Chief Obi's drawer (moralChoices.arrest === 'bribe'); inserted before mark 'offer'
  m13_dg_bribe: [
    say(DG, "And Chief Obi's drawer in Lekki. Adaeze kept a note of what you took from it. Her files are my files now.", { mood:'evasive' }),
    k("(Lekki. I'd almost taught myself to forget.)", { mood:'afraid' }),
  ],
  // a registered source: the DG reads the register. Inserted before mark 'offer'.
  m13_dg_register_herbs: [
    say(DG, "HERBS. A woman who sells bitter leaf in Sapele — bitter leaf follows you, Kelechi. You registered her on a Tuesday. I read the register on Wednesdays.", { mood:'evasive' }),
    k("(The source register is sealed. Sealed from everyone but him.)", { mood:'afraid' }),
  ],
  m13_dg_register_till: [
    say(DG, "TILL. A boy with a POS terminal and a frightened face. Registered sources are the agency's sources, Kelechi. And the agency is this office.", { mood:'evasive' }),
    k("(Ejiro. I told him nobody would ever know his name.)", { mood:'afraid' }),
  ],
  m13_dg_register_nets: [
    say(DG, "NETS. An old fisherman who doesn't like smoke on his creek. Your register entries are very thorough. Effiong taught you that too.", { mood:'evasive' }),
    k("(Pa Timi's name is in a register on this floor. And now it's in his mouth.)", { mood:'afraid' }),
  ],
  m13_dg_register_tide: [
    say(DG, "TIDE. A union chairman in Port Harcourt who wants her levies stopped. Everybody wants something stopped, Kelechi. I'm the man they ask.", { mood:'evasive' }),
    k("(Ibinabo. He's telling me he can reach every one of them.)", { mood:'afraid' }),
  ],

  // downstairs. m13_end works for any outcome; the code may prefer _bury / _refuse. Wire notes go after mark 'wire'.
  m13_end: [
    say(SYS, "11:58. The car park behind headquarters. Uche is leaning on the car with two bottles of water, one of them already empty."),
    u("Two hours, sir. Kuti came down twice to look at me. I waved both times."),
    k("He knew my trainer's name, Uche. My mother's soup. He knows you turned him down once."),
    u("Then he knows I'd do it again.", { mood:'evasive', mark:'wire' }),
    u("Zainab's bank trail ends at a house in Maitama — No. 19 Kainji Crescent. Nobody lives there, and the lights burn all night. I know a tea seller on that street."),
  ],
  m13_end_bury: [
    say(SYS, "11:58. The car park. Uche looks at the envelope in your hand, then at your face, then at the envelope again."),
    u("Superintendent. Congratulations, sir.", { mood:'evasive' }),
    k("Don't, Uche."),
    u("I'm not doing anything, sir. I'm standing in a car park."),
    u("Did you mean it?", { mood:'evasive', mark:'wire' }),
    k("Ask me on Monday. Tonight, Zainab's bank trail ends at a house in Maitama — No. 19 Kainji Crescent. I want to see who visits it."),
    u("Then I'll drive. That's all I'll say about it."),
  ],
  m13_end_refuse: [
    say(SYS, "11:58. The car park. Uche looks at your empty lanyard for a long time."),
    u("Where's your card, sir?"),
    k("On Kuti's desk. With a receipt. We're a lawful agency."),
    u("Hm. Then tonight you're a civilian with a very good memory, and I'm a sergeant on his day off.", { mark:'wire' }),
    u("Zainab's bank trail ends at a house in Maitama — No. 19 Kainji Crescent. I know a tea seller on that street. Bring cash. He doesn't do transfers."),
  ],
  // what the pen got (inserted after mark 'wire' by V13.C.end13(pct))
  m13_wire_full: [
    k("(I clicked the pen off in the lift. Two hours and eight minutes: Kuti's drawer, his tea, his proverbs, his offer — all of it.)"),
    u("Then it doesn't stay in your pocket, sir, and it doesn't stay in this car. Zonal, tonight. Hashed, sealed, signed for."),
  ],
  m13_wire_partial: [
    k("(The pen has most of it. Not the parts where he went quiet and watched me.)"),
    u("Most is a lot, sir. A good lawyer can build a house on most."),
  ],
  m13_wire_spooked: [
    k("(The pen has his voice. It has nothing he'd mind a court hearing. He saw to that.)", { mood:'angry' }),
    u("Careful men keep a diary somewhere, sir. We find the diary."),
  ],

  /* ===================== CASE 13½ · THE GATEMAN'S BOOK ===================== */

  m13b_shayi: [
    say(SYS, "Maitama, 22:15. Kainji Crescent is high walls and electric wire. Under a neem tree: a kerosene stove, a long bench, and four gatemen arguing about football."),
    say(SHAYI, "Ah — a new face! Welcome, my friend. Shayi with milk, shayi without milk, or shayi with too much milk — the Maitama special?"),
    say(GATE, "Baba, give am bread and egg first. Look the man face — hunger dey there.", { textEn:"Baba, give him bread and egg first. Look at his face — he's hungry.", choices:[
      { text:"Greet them in Hausa — 'Sannu da aiki' — and buy tea for the whole bench.", tag:'kind', next:'m13b_shayi_treat' },
      { text:"Greet them in Hausa, order just tea, and ask who's winning the argument.", tag:'savvy', next:'m13b_shayi_greet' },
      { text:"Skip the tea. Ask straight out who runs No. 19.", tag:'harsh', next:'m13b_shayi_ask' },
    ] }),
  ],
  m13b_shayi_treat: [
    k("Sannu da aiki, Baba! Tea for me — and for everyone on this bench.", { textEn:"Well done with the work, Baba! Tea for me — and for everyone on this bench." }),
    say(SHAYI, "Yawwa! Sannu kadai! This one has manners and money. Move up, Garba — let the man sit.", { mood:'relieved', textEn:"Thank you! And to you too! This one has manners and money. Move up, Garba — let the man sit." }),
    say(GATE, "For this street nobody dey buy tea for maigadi. Oga, you be politician?", { textEn:"On this street nobody buys tea for gatemen. Sir, are you a politician?" }),
    k("Worse. Civil servant."),
    say(GATE, "Ehen! Then make we drink am quick, before your salary finish.", { textEn:"Aha! Then let's drink it quickly, before your salary runs out." }),
    say(GATE, "That No. 19 — light every night, generator dey run like hospital, nobody inside. Only Friday people dey come.", { textEn:"That No. 19 — lights every night, the generator runs like a hospital's, nobody inside. Only Friday people come." }),
    say(SHAYI, "Second Friday. A big black car at eleven, then a small green Peugeot with one man driving himself. In Maitama! A big man who drives himself is hiding from his own driver.", { effect:{ intel:+4 } }),
    say(GATE, "Their maigadi na soldier — Sergeant Bitrus. E no dey drink our tea, e carry him own flask. And e get one book. E dey write every car.", { textEn:"Their gateman is a soldier — Sergeant Bitrus. He won't drink our tea; he brings his own flask. And he has a book. He writes down every car." }),
    say(SHAYI, "Bitrus is a good man. Too correct. If you lie to him, he will write your lie in the book. Go and greet him — and greet him well.",
      { sr:"Bitrus is a good man. Too correct. Every car, every visitor, every word at that gate — he writes it all in his book." }),
  ],
  m13b_shayi_greet: [
    k("Sannu da aiki. Just tea, Baba. So — who's winning the argument?", { textEn:"Well done with the work. Just tea, Baba. So — who's winning the argument?" }),
    say(GATE, "Me! This one say him team go win the league this year. Which year? Since I born, dem never win anything!", { textEn:"Me! This one says his team will win the league this year. Which year? They haven't won anything since I was born!" }),
    say(SHAYI, "Every night the same argument, every night the same tea. Sit. You have the face of a man who works late."),
    say(GATE, "Like Bitrus for No. 19. Every night e dey work, and nobody dey that house.", { textEn:"Like Bitrus at No. 19. He works every night, and nobody lives in that house." }),
    say(GATE, "Only Friday people dey come. Second Friday — black car first, small green car after. Bitrus dey write everything for him book.", { effect:{ intel:+3 }, textEn:"Only Friday people come. The second Friday — a black car first, then a small green one. Bitrus writes everything in his book." }),
    say(SHAYI, "Bitrus won't drink my tea. He brings a flask from home. I have forgiven him. Almost."),
    say(SHAYI, "Be straight with him, my son. Thirty years in the army — Bitrus can smell a lie before you open your mouth.",
      { sr:"Thirty years in the army, my son, and he still writes like a clerk. Every car that stops at that gate goes in his book." }),
  ],
  m13b_shayi_ask: [
    k("Evening. I'm looking for whoever runs No. 19."),
    say(SYS, "The football argument stops. Four gatemen discover that their tea is very interesting."),
    say(SHAYI, "No greeting, straight to No. 19. You're from Lagos, abi?", { mood:'evasive', textEn:"No greeting, straight to No. 19. You're from Lagos, aren't you?" }),
    say(SHAYI, "Sit, drink something, and ask again like a person. …No. 19 has a maigadi — Sergeant Bitrus. He writes everything in a book. He will write you too.", { textEn:"Sit, drink something, and ask again like a person. …No. 19 has a gateman — Sergeant Bitrus. He writes everything in a book. He will write you too." }),
    say(GATE, "Only Friday people go there. Na all we know.", { mood:'evasive', textEn:"Only Friday people go there. That's all we know." }),
  ],

  m13b_bitrus: [
    say(SYS, "No. 19. A steel gate with spear-points, a lit gatehouse window, and a man in a starched shirt drinking from a dented army flask."),
    say(BIT, "Good evening. This is a private residence. State your business.", { choices:[
      { text:"Delivery for the house, sir. I just need to confirm the name on the order.", tag:'savvy', flag:{ s2_bitrus:'cold' }, next:'m13b_bitrus_lie' },
      { text:"I'm NACECA, Sergeant. I need to know who comes to this house.", tag:'lawful', next:'m13b_bitrus_truth' },
      { text:"(Fold a ₦10,000 note into your handshake.) Let's talk, Sergeant. Man to man.", tag:'harsh', flag:{ s2_bitrus:'cold' }, next:'m13b_bitrus_money' },
    ] }),
  ],
  m13b_bitrus_lie: [
    say(BIT, "A delivery. At half past ten at night. With no parcel, no motorbike and no receipt book.", { mood:'angry' }),
    say(BIT, "Thirty-one years in the Nigerian Army, young man. Liberia, Sierra Leone, Darfur. I have been lied to by better liars, in three countries."),
    say(SYS, "He opens a fat ledger on the gatehouse sill, licks his pencil, and writes: 22:31 — 'Delivery man.' No delivery."),
    say(BIT, "Goodnight.", { mood:'angry' }),
  ],
  m13b_bitrus_money: [
    say(BIT, "Put that back in your pocket before I write it in my book.", { mood:'angry' }),
    say(BIT, "My pension is late, my knees are finished, and this flask is older than you. Nobody has bought me yet. You will not be the first."),
    say(BIT, "Goodnight, sir. Go and find somebody who needs to be bought.", { mood:'angry' }),
  ],
  m13b_bitrus_truth: [
    say(BIT, "NACECA."),
    say(SYS, "He studies you over the rim of the flask for a long moment."),
    say(BIT, "Good. At least you said it with your mouth and not with your money."),
    say(BIT, "Don't show me a card — they print those in Wuse for five thousand naira. Give me a reason. Why should an old soldier open his book for you?", { choices:[
      { text:"Because the law requires it, Sergeant.", tag:'lawful', next:'m13b_bitrus_law' },
    ].concat(BITRUS_REASONS) }),
  ],
  m13b_bitrus_law: [
    say(BIT, "The law."),
    say(SYS, "He laughs once, without enjoying it."),
    say(BIT, "The law comes to this house on the second Friday, young man. I open the gate for it, and I salute.", { mood:'evasive' }),
    say(BIT, "Not the law. You. Why?", { choices:BITRUS_REASONS }),
  ],
  m13b_bitrus_osas: [
    say(BIT, "A student."),
    say(SYS, "A long silence. Somewhere down the crescent, a generator coughs and catches."),
    say(BIT, "My grandson is at the university in Jos. Second year, mechanical engineering. He sends me photographs of engines."),
    say(BIT, "Every visitor to this house is in my book — every car, every time, every 'write nothing'. A gate without a book is a hole in a wall."),
    say(BIT, "So. What do you want from me — the book, or the man who wrote it?", { choices:BITRUS_ASK }),
  ],
  m13b_bitrus_creek: [
    say(BIT, "Black fish."),
    say(SYS, "He screws the cap back onto his flask, slowly."),
    say(BIT, "I'm from Vom, on the Plateau. The tin mines left holes full of poison water where my father farmed. The men who dug them came in big cars too."),
    say(BIT, "Every visitor to this house is in my book — every car, every time, every 'write nothing'. A gate without a book is a hole in a wall."),
    say(BIT, "So. What do you want from me — the book, or the man who wrote it?", { choices:BITRUS_ASK }),
  ],
  m13b_bitrus_witness: [
    say(SYS, "He stands up straighter, the way men do when an anthem starts."),
    say(BIT, "Thirty-one years, and nobody has ever asked me to read my own writing in public.", { mood:'relieved' }),
    say(BIT, "I will keep it where even I can't find it without my glasses. When your court calls, I'll come in uniform. It still fits. Mostly."),
    say(BIT, "Read it now, under my lamp. Touch nothing with wet hands."),
  ],
  m13b_bitrus_photo: [
    say(BIT, "Photographs.", { mood:'evasive' }),
    say(BIT, "A photograph of a book is a book with nobody standing behind it. But you're trying to keep an old man out of trouble. I understand."),
    say(BIT, "Quickly, then. Use my lamp, not your flash — the whole crescent can see a flash."),
  ],

  m13b_suv: [
    say(SYS, "22:58. Headlights on Kainji Crescent. A black Prado — no siren, no escort — rolls up to No. 19, and the gate opens before it stops."),
    u("Driver's out to open the back door. Look at his face, sir. That's Godwin Ereba — Riverstone's owner, on paper."),
    k("Second Friday. Right on time."),
  ],
  m13b_end: [
    say(SYS, "23:14. A second car — a plain green Peugeot, one man at the wheel, no driver, no escort. It goes in without slowing down."),
    u("Don't turn your head, sir.", { mood:'evasive' }),
    k("I don't need to. I had tea with him this morning."),
    say(SYS, "In the gatehouse window, an old soldier licks his pencil and writes down the time."),
    u("Zainab called. FRN versus Edafe and two others — fixed for Monday the eleventh of January, nine o'clock, Court 5. She says to iron your shirt."),
    k("Then in January a judge hears what a ledger, a creek and a tank farm have to say."),
  ],

  /* ===================== CASE 15 · THE BARGE ===================== */

  // core brief. Inserts (V13.C.brief15) go before mark 'end': standing, trial result, sources.
  m15_brief: [
    say(SYS, "Port Harcourt waterfront, 23:30. Rain on the Bonny River. Across the water the Riverstone jetty is lit like a stage, and TEKENA 2 is riding low."),
    say(HAU, "The Federal High Court hears our application for an interim forfeiture order at two on Monday afternoon: every account and asset of Riverstone and Maitama Haven."),
    say(HAU, "Somebody in the registry has already told the Senator. So tonight he empties the strongroom onto that barge and sends it down to Bonny before the order lands.", { mood:'evasive' }),
    say(OSA, "And he's coming himself. A man like that trusts nobody with the last of the money — not even Ereba."),
    u("Kuti has called Zonal four times today asking where you are, sir. I told them you'd gone to church."),
    say(OSA, "The warrant's signed — a magistrate in Borokiri at six o'clock, his dinner going cold. The barge, the jetty, the strongroom. By the book, Kelechi. All of it.", { mark:'end' }),
  ],
  m15_brief_ibinabo: [
    say(IBI, "My drivers get four boats for under the old wharf. Their gate na for people wey come by road. We fit carry you by water — quiet quiet.", { textEn:"My drivers have four boats under the old wharf. Their gate is for people who come by road. We can take you in by water — very quietly." }),
  ],
  m15_brief_bitrus: [
    say(BIT, "Sergeant Gyang. At eleven this morning the driver loaded two suitcases at No. 19 — two men to lift each one. The Chairman left Abuja at noon. I have written it down.", { phone:true }),
  ],
  m15_brief_karo: [
    say(KARO, "My son, Lucky boys buy every Ghana-must-go for Sapele market this morning. Twenty-two bags! Who dey buy twenty-two bags?", { phone:true, textEn:"My son, Lucky's boys bought every Ghana-must-go bag in Sapele market this morning. Twenty-two bags! Who buys twenty-two bags?" }),
  ],
  m15_brief_felix: [
    say(HAU, "Felix drew the barge for us from memory. The cash room is aft, behind the engine room — a steel door painted to look like a fuel tank."),
  ],
  // trial result inserts (S.game.s2.trial)
  m15_brief_trial_won: [
    say(HAU, "And Lucky Edafe has been convicted. The court believed the ledger — nobody gets to call Upstream a fairy tale anymore."),
  ],
  m15_brief_trial_lost: [
    say(HAU, "We lost Lucky. The court wouldn't convict on what we couldn't prove, and it was right not to. Tonight every bag gets a number and every number a signature.", { mood:'angry' }),
  ],
  m15_brief_trial_pleas: [
    say(HAU, "The plea agreements held. What they told the court is on the record now — TEKENA 2, Riverstone, Ereba, and whom Ereba drives for."),
  ],
  // Kelechi's standing after the ninth floor
  m15_brief_suspended: [
    say(OSA, "Officially you're suspended, so tonight every arrest is mine and you're a witness with a torch."),
    k("And if he walks past me?"),
    say(OSA, "Section 20 of the ACJA: any private person may arrest a man who commits an offence in his presence. Don't make me need it."),
  ],
  m15_brief_bury: [
    say(OSA, "Superintendent Kelechi. I hear the Lagos office has a view of the lagoon.", { mood:'evasive' }),
    k("The file went to Abuja, ma. I didn't."),
    say(OSA, "We'll see what you are by morning."),
  ],
  // the way in: m15_entry when Ibinabo's boats are there (s2_ibinabo === 'source'), else m15_entry_gate (code sets s2_raid_entry 'gate')
  m15_entry: [
    u("Two ways in, sir. The gate, where the DG's task force has parked itself. Or the water — Ibinabo's boats, in this rain.", { choices:[
      { text:"The water. Let them guard a gate nobody uses.", tag:'savvy', flag:{ s2_raid_entry:'water' } },
      { text:"The gate. We walk in the front with the warrant in our hands.", tag:'lawful', flag:{ s2_raid_entry:'gate' } },
    ] }),
    u("Then we go. Stay close, sir, and keep the warrant dry."),
  ],
  m15_entry_gate: [
    u("No boats tonight, sir. We go in by the gate — warrant first — and see who's waiting for us."),
  ],

  m15_taskforce: [
    say(SYS, "The Riverstone gate. Four police pick-ups across the road, blue lights turning in the rain, and forty men in vests marked SPECIAL TASK FORCE."),
    say(TFC, "ACP Lawal, special task force. By order of the Director-General this operation is suspended. The jetty is under my control. Turn your vehicles around.", { mood:'angry' }),
    say(OSA, "Show me the order, ACP."),
    say(TFC, "It came an hour ago.", { mood:'evasive' }),
    say(SYS, "He holds up his phone. A text message. No letterhead, no signature, no seal."),
    say(OSA, "That's a text message, ACP. This is a warrant, signed by a magistrate at six o'clock. Paper beats phone. Read it.", { choices:[
      { text:"ACP, every one of your men is on camera tonight. Choose your evening.", tag:'savvy', effect:{ heat:+2 } },
      { text:"Stand aside, sir. This is a lawful search.", tag:'lawful', effect:{ integrity:+1 } },
      { text:"Move the trucks, or I'll move them.", tag:'harsh', effect:{ heat:+4, publicTrust:-1 } },
    ] }),
    say(TFC, "Madam, I have forty men.", { mood:'angry' }),
    say(OSA, "And I have a warrant. Your men can count — let them count the signatures. Go, Kelechi, and take the Barrister. I'll keep the ACP company."),
  ],
  m15_taskforce_water: [
    say(SYS, "Ibinabo's boats slide in under the jetty with their engines off, the drivers poling through the rain. At the gate, blue lights turn for nobody."),
    say(TFC, "NACECA team! By order of the Director-General, this operation is suspended! Report to the gate!", { mood:'angry' }),
    say(IBI, "Make him shout. Gate no be river.", { textEn:"Let him shout. A gate isn't a river." }),
    say(OSA, "He has to come round by the road — two minutes, maybe three. Use them, Kelechi."),
    u("Up the ladder, sir. Mind the third rung. It's had a hard life."),
  ],

  m15_cashroom: [
    say(SYS, "Aft, behind the engine room: a steel door painted to look like a fuel tank. Inside, Ghana-must-go bags to the ceiling, naira in shrink-wrap, dollars in bank bands."),
    u("Twenty-two years in uniform, sir, and I've never seen money stacked like firewood."),
    k("Nobody touches it. Photograph, count, seal. Every bag gets a number, and every number gets two signatures."),
  ],

  m15_senator: [
    say(SYS, "On the jetty, under an umbrella held by Godwin Ereba: a tall man in a white etibo and a bowler hat, leaning on a silver-topped walking stick."),
    say(SEN, "Ah — the young man from the newspapers. Agent Kelechi. Come out of the rain. Godwin, give him the umbrella."),
    say(SEN, "Do you know how many classrooms I've built in this state? Forty-two — with fans. Your agency's forensic lab has my name over the door."),
    k("Senator, this barge is under a search warrant. Everything in that cash room is being counted and sealed."),
    say(SEN, "Counted! Campaign funds, my dear — for the people. And whatever you think you're doing tonight, I have immunity. Ask your lawyer.", { mood:'evasive', choices:[
      { text:"Barrister Danladi — would you?", tag:'kind' },
      { text:"Section 308, Senator. Four offices. Yours isn't one of them.", tag:'lawful', effect:{ integrity:+1 } },
    ] }),
    say(HAU, "Section 308 of the Constitution shields four offices, Senator: President, Vice-President, Governor, Deputy Governor. That's the whole list."),
    say(HAU, "Your privilege covers words spoken on the floor of the Senate. It doesn't cover what you load onto a barge."),
    say(SEN, "Then let me say something off the floor. Do you think Adaeze lasted twenty years in your agency on her own charm? Kolawole kept her because I asked him to.", { mood:'angry' }),
    say(SEN, "And he'll keep me. Watch."),
    say(SYS, "Your phone buzzes against your chest. The screen says: DIRECTOR-GENERAL."),
    say(SEN, "That will be for you.", { mood:'relieved' }),
  ],

  m15_dg_call: [
    say(DG, "Kelechi. Don't speak — listen. You're standing on a jetty in the rain, about to make a mistake that will outlive both of us.", { phone:true }),
    say(DG, "Stand down. Let ACP Lawal's men secure the barge. On Monday you're Zonal Commander — Benin, the whole command. Itohan has always wanted to see Maiduguri.", { phone:true }),
    say(DG, "And your uncle in Enugu. The headmaster. One phone call took his whole pension. I know who made that call, Kelechi. I know where the money went.", { phone:true, mood:'evasive' }),
    say(DG, "Monday, you get the name, and the men to go and fetch him. Your uncle sees him in a dock before Easter. Isn't that why you joined?", { phone:true }),
    say(DG, "Or arrest a Senator tonight and watch the Court of Appeal hand him back to me before the rains. Everyone who helped you this season has a name and an address. I have both.", { phone:true, mood:'evasive' }),
    say(SYS, "Uche is watching you from the cash-room door. He says nothing. The Senator holds out his wrists, smiling, as if it's a joke between friends."),
    say(DG, "Nobody needs to be a hero tonight, my son. The pot that cooks the pepper soup must sit in the fire — don't sit in the fire for nothing.", { phone:true, choices:[
      { text:"I'm arresting the Senator, sir.", tag:'lawful', flag:{ s2_end:'truth' }, effect:{ integrity:+8, agencyFavour:-6, publicTrust:+6 }, next:'m15_end_truth' },
      { text:"…Understood, sir. Standing down.", tag:'harsh', flag:{ s2_end:'career' }, effect:{ integrity:-10, agencyFavour:+8 }, next:'m15_end_career' },
    ] }),
  ],
  m15_end_truth: [
    say(DG, "Then God help you, Kelechi. I won't.", { phone:true, mood:'angry' }),
    k("(He knew who robbed my uncle. He's always known. He kept that man too.)", { mood:'angry' }),
    k("Senator Tonye Douglas-Akpan, you're under arrest for money laundering, and for dealing in crude oil without lawful authority."),
    k("You have the right to remain silent, and to a lawyer of your choice before you answer anything. If you can't get one, Legal Aid will provide one."),
    say(SEN, "Legal Aid! Godwin — call my lawyers. All of them. Wake the ones in London.", { mood:'angry' }),
    u("Hands in front, Senator. You're an old man. I'll be gentle."),
    say(SYS, "00:12. The Senator is walked off his own jetty, past forty men of a special task force who have suddenly found somewhere else to be."),
    say(OSA, "The forfeiture order lands on Monday, and the money's already in our inventory. Now we finish it — the one who kept her."),
  ],
  m15_end_career: [
    say(DG, "Good. Good man. Monday, then.", { phone:true, mood:'relieved' }),
    k("Stand down. Everyone. The task force has the jetty."),
    say(SEN, "Sensible boy. Godwin — the umbrella. The young man is getting wet.", { mood:'relieved' }),
    say(SYS, "ACP Lawal's men come up the jetty at a jog. The cash room is 'secured'. Nobody writes down a single number."),
    u("Your car keys, sir. You drive tonight. I'll take a bus.", { mood:'evasive' }),
    say(HAU, "I'll still move the forfeiture application on Monday. There'll be nothing left to forfeit.", { mood:'angry' }),
    say(SYS, "00:40. TEKENA 2 slips her lines and slides down the Bonny River without lights."),
    k("(Zonal Commander by Monday. A name from Enugu. I keep telling myself the price was fair.)", { mood:'afraid' }),
  ],

  // into the accusation screen ("Who protected Adaeze?")
  m15_accuse_lead: [
    say(SYS, "Monday, 08:30. NACECA Headquarters. The lift to the ninth floor."),
    say(HAU, "The warrant application is drafted with a blank where the name goes. Someone protected Adaeze for twenty years. You fill the blank."),
    k("(One name. Three things that prove it. No taking it back.)"),
  ],
  m15_accuse_lead_career: [
    say(SYS, "Monday, 08:30. NACECA Headquarters. On the ninth floor, a photographer is setting up for the new Zonal Commander's badge."),
    say(HAU, "I drafted a warrant application anyway. There's a blank where the name goes. You can fill it, or you can smile for the camera.", { mood:'evasive' }),
    k("(Someone protected Adaeze for twenty years. One name. Three things that prove it.)"),
  ],
  // the DG confronted. Inserts (V13.C.reveal) go after mark 'dg': a wrong accusation, or the career-path exchange.
  m15_reveal_proven: [
    say(SYS, "09:05. The ninth floor. The draughts board is where it was. So is he."),
    say(DG, "Kelechi. You've brought friends.", { mark:'dg' }),
    k("Every petition against her came to this desk, sir. Today one of them came back."),
    say(OSA, "Kolawole Fashina, I have a warrant for your arrest: for taking gratification from Senator Douglas-Akpan, and abusing your office to shield Commander Adaeze."),
    say(DG, "The trouble with a file on everyone, Kelechi, is that someone always opens it. I kept one on you too. Read it someday — it's mostly praise.", { mood:'evasive' }),
    say(SYS, "09:12. The Director-General of NACECA leaves the ninth floor in handcuffs, in the lift he never once had to wait for."),
  ],
  m15_reveal_contested: [
    say(SYS, "09:05. The ninth floor. Two police officers, a warrant, and a Director-General already on the phone to his lawyers."),
    say(DG, "Is this what you brought, Kelechi? It will keep me busy. It won't keep me.", { mood:'evasive', mark:'dg' }),
    k("It'll keep you off this floor while a court decides."),
    say(DG, "Courts are long, Kelechi. And I am a very patient man."),
    say(SYS, "11:40. The Presidency suspends the Director-General pending trial. At four o'clock he is granted bail. He takes the stairs."),
  ],
  m15_reveal_unproven: [
    say(SYS, "09:05. The ninth floor. The tea is already poured — two cups."),
    say(DG, "Sit, Kelechi. You've brought me a story. Stories are for children; courts are for evidence. Effiong taught you the difference, I think.", { mark:'dg' }),
    k("Someone protected her for twenty years, sir."),
    say(DG, "Someone always does. That is what a country is. Drink your tea — it's the good one. I don't give it to everyone.", { mood:'evasive' }),
    say(SYS, "He is still Director-General. The file stays open, and so does his door."),
  ],
  // after mark 'dg' when s2_end === 'career'
  m15_reveal_career_add: [
    say(DG, "You stood down for me on Friday, and on Monday you bring this to my desk?", { mood:'angry' }),
    k("You bought Friday, sir. You never bought Monday."),
  ],
});

/* ======================================================================
   DOCUMENTS — tap the line that proves it
   ====================================================================== */
const DOCKET_HEAD =
`<span class="label">[ OFFICE OF THE DIRECTOR-GENERAL · EXHIBIT MOVEMENT DOCKET ]</span>
<span class="label">[ REF: DGO/EXH/2026/014 · CONFIDENTIAL · ON MR. KUTI'S DESK ]</span>

ITEM     Exhibit 14 · flash drive (O. Ehigie) · sealed evidence bag
FROM     Benin Zonal Command · evidence cage
ORDER    "Transfer to HQ for safe custody" · signed for the DG: A.K.
`;
const BOOK_SCREEN =
`<span class="label">[ VISITOR BOOK · No. 19 KAINJI CRESCENT, MAITAMA · SECURITY POST ]</span>
<span class="label">[ KEPT BY SGT. (RTD.) B. GYANG · "EVERY VISITOR. NO EXCEPTIONS." ]</span>

DATE  DAY   IN     VISITOR · VEHICLE                                 OUT
───────────────────────────────────────────────────────────────
11/09 <span class="red">FRI</span>  22:56  Black Prado ABJ-260XR · "CHAIRMAN" +1 · drv. EREBA    01:42
11/09 <span class="red">FRI</span>  23:11  Hon. K.F. (NACECA) · own car, no driver           01:30
30/09 WED  14:20  Generator service · 2 men · diesel, 400 litres          15:05
09/10 <span class="red">FRI</span>  22:58  Black Prado ABJ-260XR · "CHAIRMAN" +1 · drv. EREBA    01:36
09/10 <span class="red">FRI</span>  23:15  Hon. K.F. (NACECA) · own car, no driver           01:28
13/11 <span class="red">FRI</span>  22:54  Black Prado ABJ-260XR · "CHAIRMAN" +1 · drv. EREBA    01:51
13/11 <span class="red">FRI</span>  23:09  Hon. K.F. (NACECA) · own car, no driver           01:44
23/11 MON  09:10  A. BELLO · electrician · security lights               11:30
27/11 <span class="red">FRI</span>  21:40  Hon. Member (Reps) · wrong house · turned back at gate  21:42
04/12 <span class="red">FRI</span>  11:00  ROSE (cleaner) · monthly                              15:00
09/12 WED  15:40  — DELIVERY · 6 cartons, drinks · signed for by EREBA    15:55

<span class="green">NB</span>  The Honourable signs his own initials and says "write nothing". I write everything. — B.G.`;
const BOOK_OPTIONS = [
  { text:'No. 19 is a party house — drinks, generators and guests at weekends', hint:'One delivery of drinks in three months and no weekends at all. The visits follow the calendar, not a party diary.', correct:false },
  { text:'"CHAIRMAN", driven by Ereba, and K.F. of NACECA meet at No. 19 on the second Friday of every month', hint:'11/09, 09/10, 13/11 — the second Friday each month: the Prado, then K.F. fifteen minutes later, both gone after one in the morning.', correct:true },
  { text:'K.F. owns No. 19 — he signs himself in', hint:'Owners don\'t sign a visitor book. The book shows who comes, not who owns — that is the bank trail\'s job.', correct:false },
  { text:'Every Friday visitor is the same "Honourable"', hint:'The Honourable on 27/11 was a Rep at the wrong house, turned back in two minutes. Only the second Fridays repeat.', correct:false },
];
const BOOK_PROMPT = 'Sgt. Bitrus writes down everyone. Read his book: <b>what does it prove</b> about No. 19?';

Object.assign(PUZZLES, {
  m13_docket: {
    title:'EXHIBIT MOVEMENT DOCKET · NINTH FLOOR',
    screen: DOCKET_HEAD +
`
MOVEMENT
────────────────────────────────────────────
05:14  Released at Benin Zonal to the HQ escort (3 officers)
06:00  Benin → Abuja, scheduled flight · landed 07:02
07:40  Received, ninth floor · Mr. A. Kuti, PA to the DG
07:42  Placed in the DG's personal safe, on the DG's instruction · signed: A.K.
07:55  Lab request FL/311 (image + hash) · <span class="red">CANCELLED</span> by the DG's office

CROSS-CHECKS
────────────────────────────────────────────
HQ exhibit store · reference allocated: <span class="red">none — not logged</span>
Zonal register copy · "not required" — A.K.`,
    prompt:'Exhibit 14 left Benin on the 06:00 flight. <b>Where is it now?</b>',
    options:[
      { text:'In the HQ exhibit store, logged like any other exhibit', hint:'The store never allocated it a reference. It was never logged.', correct:false },
      { text:'At the HQ forensic lab, being imaged and hashed', hint:'The lab request was cancelled by the DG\'s office fifteen minutes after the drive arrived.', correct:false },
      { text:'In the Director-General\'s personal safe', hint:'07:42 — placed in the DG\'s personal safe, on his own instruction, and signed for.', correct:true },
      { text:'Back in Benin — the docket is a cover story', hint:'Released to the escort at 05:14, landed at 07:02, signed for on the ninth floor at 07:40.', correct:false },
    ],
    onCorrect:{ intel:+22, integrity:+2, evidenceId:'transfer_docket', evidenceName:'Exhibit 14 transfer docket', xp:120 },
    onWrong:{ integrity:-1 },
    toastWrongTitle:'NOT THAT LINE',
    toastWrong:'Follow the drive minute by minute. Where does it stop moving?',
  },
  m13_docket_kept: {
    title:'EXHIBIT MOVEMENT DOCKET · NINTH FLOOR',
    screen: DOCKET_HEAD +
`
MOVEMENT
────────────────────────────────────────────
05:10  HQ escort at Benin Zonal · item requested
05:40  Item withheld · Zonal retention order RO/BZ/14 · Cdr. I. Okundaye
07:40  <span class="red">NOT RECEIVED</span> — Zonal retention order · escort returned empty-handed

CLIPPED TO THE DOCKET
────────────────────────────────────────────
Posting order PO/2026/0912 · drafted yesterday, 18:40 · awaiting the DG's signature
Cdr. I. Okundaye · Benin Zonal → Maiduguri Zonal · "with immediate effect"
Reason given: "exigencies of service" · Benin tour served: 14 of 36 months
Filed under: exhibit 14 docket · cross-ref. retention order RO/BZ/14`,
    prompt:'Exhibit 14 never left Benin. A posting order is clipped to its docket. <b>Why is Commander Okundaye being moved?</b>',
    options:[
      { text:'A routine rotation — every commander moves eventually', hint:'Fourteen months into a thirty-six-month tour is not a rotation.', correct:false },
      { text:'Because she kept exhibit 14 in Benin', hint:'The posting is filed under the exhibit 14 docket and cross-referenced to her own retention order.', correct:true },
      { text:'A promotion — Maiduguri is a bigger command', hint:'Same rank, "with immediate effect", for "exigencies of service". That is not how a reward reads.', correct:false },
      { text:'She asked for it', hint:'No request on file. The reason is "exigencies of service" — the phrase that explains nothing.', correct:false },
    ],
    onCorrect:{ intel:+22, integrity:+2, evidenceId:'transfer_docket', evidenceName:'Exhibit 14 docket — Okundaye\'s posting order', xp:120 },
    onWrong:{ integrity:-1 },
    toastWrongTitle:'NOT THAT LINE',
    toastWrong:'Read what the posting is filed under.',
  },
  m13b_book: {
    title:'VISITOR BOOK · No. 19 KAINJI CRESCENT',
    screen: BOOK_SCREEN,
    prompt: BOOK_PROMPT,
    options: BOOK_OPTIONS,
    onCorrect:{ intel:+24, integrity:+2, evidenceId:'visitor_book', evidenceName:'The Maitama visitor book', xp:130 },
    onWrong:{ integrity:-1 },
    toastWrongTitle:'BITRUS FROWNS',
    toastWrong:'Not every Friday. Which Fridays, and who comes on them?',
  },
  // the same pages, photographed (s2_bitrus === 'photo')
  m13b_book_photo: {
    title:'PHOTOS · VISITOR BOOK, No. 19',
    screen: BOOK_SCREEN,
    prompt: BOOK_PROMPT,
    options: BOOK_OPTIONS,
    onCorrect:{ intel:+20, integrity:+1, evidenceId:'visitor_book_photo', evidenceName:'Photos of the visitor book', xp:110 },
    onWrong:{ integrity:-1 },
    toastWrongTitle:'BLURRED',
    toastWrong:'Not every Friday. Which Fridays, and who comes on them?',
  },
});

const BOOK_DOC = {
  ask:'What does Sgt. Bitrus\'s book <b>prove</b> about No. 19? Pick it, then tap the line that proves it.',
  proof:['CHAIRMAN', 'K.F.'], look:['CHAIRMAN', 'K.F.', 'Hon. Member', 'BELLO', 'DELIVERY', 'ROSE'],
};
if(window.V12){
  window.V12.DOCS = window.V12.DOCS || {};
  Object.assign(window.V12.DOCS, {
    m13_docket:{
      ask:'Exhibit 14 left Benin on the 06:00 flight. <b>Where is it now?</b> Pick it, then tap the line that proves it.',
      proof:['personal safe'], look:['personal safe', 'CANCELLED', 'not logged', 'not required', 'Received'],
      fail:{ mode:'continue', note:'Footsteps in the corridor. You photograph the page without reading it properly. It\'s in the file — and the defence will ask how you came by it.', effect:{ integrity:-1 } },
    },
    m13_docket_kept:{
      ask:'A posting order is clipped to the exhibit 14 docket. <b>Why is Commander Okundaye being moved?</b> Pick it, then tap the line that proves it.',
      proof:['Filed under'], look:['Filed under', 'NOT RECEIVED', 'Maiduguri', 'exigencies', 'tour served'],
      fail:{ mode:'continue', note:'Kuti\'s footsteps. You photograph the posting order and go. It\'s in the file, but nothing on your copy says why.', effect:{ integrity:-1 } },
    },
    m13b_book:Object.assign({}, BOOK_DOC, {
      fail:{ mode:'continue', note:'You misread it under the gatehouse lamp. The pages are logged — but the defence will call them a gateman\'s diary.', effect:{ integrity:-1 } },
    }),
    m13b_book_photo:Object.assign({}, BOOK_DOC, {
      fail:{ mode:'continue', note:'Your photographs are logged, blurred where it matters. Without the man who wrote it, the defence will call it gossip.', effect:{ integrity:-1 } },
    }),
  });
}

/* ======================================================================
   SMALL HELPERS
   ====================================================================== */
const ST = () => (typeof S !== 'undefined' && S) ? S : { game:{ moralChoices:{} }, player:{ reputation:{} } };
const G = state => (state && state.game) ? state.game : (state && state.moralChoices) ? state : (ST().game || {});
const MC = state => G(state).moralChoices || {};
const S2 = state => G(state).s2 || {};
const TRIAL = state => S2(state).trial || {};
/* Season 1's verdict as Season 2 reads it (CN13): V13.s1fate() (core), else moralChoices.finale */
const S1FATE = state => { try{ if(typeof V13.s1fate === 'function'){ const f = V13.s1fate(); if(f) return f; } }catch(e){} return MC(state).finale || null; };

/* ======================================================================
   EPILOGUE — where everyone ended up
   ====================================================================== */
V13.epilogueS2 = function(){
  const st = ST(), g = st.game || {}, m = g.moralChoices || {}, s2 = g.s2 || {}, tr = s2.trial || {};
  const rep = (st.player && st.player.reputation) || {};
  const fin = s2.finale || null, end = m.s2_end || null, s1 = S1FATE();
  const has = id => Array.isArray(g.evidence) && g.evidence.some(e => e && e.id === id);
  const q = id => (g.evQ && g.evQ[id]) || 'good';
  const out = [];
  const add = (art, name, text) => out.push({ art, name, text });

  // LUCKY EDAFE
  const statementLost = m.s2_statement === 'car' || m.s2_statement === 'threat';
  add('lucky_neutral', 'LUCKY EDAFE',
    tr.d1 === 'guilty' ? "Convicted of money laundering. In Kuje he changes money for the canteen at a rate he calls 'very Christian'. Nobody has checked his maths."
    : tr.d1 === 'notguilty' ? (statementLost ? "Acquitted. The court threw out his statement, and what was left wasn't enough. He changes money in Cotonou now, and sends no thank-you notes."
                                             : "Acquitted. He walked out of Court 5 into the arms of a lawyer nobody admits paying for. He changes money in Cotonou now.")
    : "Lucky Edafe is still waiting for his trial. He has changed lawyers three times and his story not once.");

  // EJIRO
  add('ejiro_neutral', 'EJIRO',
    m.s2_ejiro === 'source' ? "Ejiro gave evidence for two hours and shook for every minute of it. Terminal T4 closes at nine now, and the till balances to the naira, every night."
    : m.s2_ejiro === 'arrested' ? "Ejiro spent five weeks on remand before the charge against him was withdrawn. He doesn't run a POS terminal anymore. He doesn't run anything that takes cards."
    : "Ejiro closed early that night and never opened T4 again. He drives a keke in Warri. He says a keke never asks him to look away.");

  // MAMA KARO
  add('karo_neutral', 'MAMA KARO',
    m.s2_karo === 'trust' ? "Mama Karo still sells bitter leaf by the jetty. When a stranger asks for 'only bitter leaf', she looks at him for a long time before she sells."
    : m.s2_karo === 'cold' ? "Mama Karo tells everyone about the officer who walked up to her stall and announced himself like a town crier. It is her favourite story."
    : "Mama Karo still sells bitter leaf by the jetty. Thursdays are quieter now. She says it the way you'd say the rain has stopped.");

  // FELIX UGBEKILE
  const felixBitter = m.s2_felix === 'threatened' ? " He has never looked an officer in the eye since." : '';
  add('felix_neutral', 'FELIX UGBEKILE',
    (tr.d2 === 'plea' ? "Felix pleaded guilty to one count and gave evidence for the Republic. In Kuje he keeps the workshop generator running. It has never smoked once."
    : tr.d2 === 'guilty' ? "Convicted on Count 2. He writes long, polite, technical letters to the Ministry about the Ethiope creeks. Nobody has answered one yet."
    : tr.d2 === 'notguilty' ? "Acquitted. The camp never reopened. Felix says he's finished with the creeks; Pa Timi says he'll believe it when the smoke does."
    : m.s2_felix === 'cooperating' ? "Felix kept every promise he made under that tarp. The creek hasn't forgiven him. He hasn't asked it to."
    : "Felix Ugbekile is waiting for his trial. He has drawn the camp's stills for his lawyer from memory, to scale.") + felixBitter);

  // PA TIMI
  const timiBoat = m.s2_timi === 'source' ? " He still won't take a naira for a boat ride." : '';
  add('timi_neutral', 'PA TIMI',
    (m.s2_camp === 'navy' ? "The Navy burned the camp, and the creek burned with it for two days. His nets came up black all season. He says the fire was louder than the crime."
    : m.s2_camp === 'felix_only' ? "The camp boys went home as witnesses. Two of them fish with Pa Timi now. The nets come up grey instead of black. He says grey is a start."
    : m.s2_camp === 'mass' ? "Nine arrests from one camp; most of the boys are still on remand. Their mothers come to his landing to ask why. He tells them. It doesn't help."
    : "Pa Timi still fishes below the second bend. Some mornings the nets come up clean, and he sits with them a while before he says anything.") + timiBoat);

  // SOTONYE JUMBO
  const sotoChildren = m.s2_sotonye === 'pressured' ? " She hasn't forgiven the officer who mentioned her children." : '';
  add('sotonye_neutral', 'SOTONYE JUMBO',
    (tr.d3 === 'plea' ? "Sotonye pleaded to one count and testified for two days. Now she writes compliance manuals in Onne. Every page has a log."
    : tr.d3 === 'guilty' ? "Convicted on Count 3. She kept that USB to protect herself. In the end it was the only honest thing in Tank 3."
    : tr.d3 === 'notguilty' ? "Acquitted. She keeps a copy of everything she has ever signed, in two different places."
    : m.s2_sotonye === 'witness' ? "Sotonye is the prosecution's best witness, and she knows it. She is no longer afraid of the Senator. She is still afraid of his driver."
    : m.s2_sotonye === 'arrested' ? "Sotonye stopped talking the day she was cuffed in front of her staff. Her lawyer does all the talking now."
    : "Sotonye Jumbo still has the USB. Nobody has asked her for it twice.") + sotoChildren);

  // CHAIRMAN IBINABO
  add('ibinabo_neutral', 'CHAIRMAN IBINABO',
    m.s2_ibinabo === 'source' ? (m.s2_raid_entry === 'water' ? "The 'levies' stopped. Her drivers painted a line on every boat — WE CARRIED THE RAID. Nobody on the waterfront has asked them for a levy since."
                                                             : "The 'levies' stopped. Her drivers painted a line on every boat — NO LEVY · ASK IBINABO. Nobody has asked.")
    : m.s2_ibinabo === 'cold' ? "The levies stopped for a month. Then new men came with new receipts. Chairman Ibinabo pays, and remembers who leaned on her."
    : "Chairman Ibinabo still runs the union shed by the jetty. The night barges have stopped, she says — like a woman who is counting.");

  // SGT. (RTD.) BITRUS GYANG
  add('bitrus_neutral', 'SGT. (RTD.) BITRUS GYANG',
    m.s2_bitrus === 'witness' ? "He read his own book aloud in court — every date, every plate, every 'write nothing'. The defence asked him one question, then sat down."
    : m.s2_bitrus === 'photo' ? "The owner's agent 'audited' his book and it never came back. Bitrus keeps a new one now — and a photocopy of the new one, at home."
    : "Nobody ever asked Bitrus about his book. He still keeps it. One entry from a Friday in December reads only: 'NACECA. Came the wrong way.'");

  // BARRISTER ZAINAB DANLADI
  add('hauwa_neutral', 'BARRISTER ZAINAB DANLADI',
    fin === 'proven' ? "The Attorney-General's office asked Zainab Danladi to lead the prosecution of her own Director-General. She said yes before they finished the sentence."
    : fin === 'contested' ? "She leads the prosecution in FRN v. Fashina. The defence has filed eleven motions. She has answered eleven."
    : end === 'career' ? "She went back to the legal office on the eighth floor, one floor below him. She hasn't spoken to Kelechi since the jetty."
    : "She went back to the legal office on the eighth floor, one floor below him. She keeps a copy of everything at home now.");

  // COMMANDER ITOHAN OKUNDAYE
  add('osagie_neutral', 'COMMANDER ITOHAN OKUNDAYE',
    m.s2_original === 'kept' ? (fin === 'proven' ? "The Maiduguri posting was withdrawn the morning the DG was arrested. She didn't unpack her boxes in Benin for a month, just in case."
                                                 : "She went to Maiduguri. In her third week her new command arrested two customs officers. She texts Kelechi once a month: 'Still here.'")
    : fin === 'proven' ? "Named acting Director-General until a substantive appointment. On her first morning she had the draughts board carried out of the office."
    : fin === 'contested' ? "Benin Zonal is still hers. She signs every exhibit register herself now, and checks the seals twice."
    : "Still Benin Zonal Commander. The DG's office has 'reviewed her posting' four times. She framed the fourth letter.");

  // TOBI ONUOHA: alive iff rescued, or carried out in the chase with the hostage not lost (CN05).
  // He reads and decodes; Mr. Igbinosa certifies (CN06). A dead Tobi gets no slide.
  const tobiAlive = V13.tobiAlive ? V13.tobiAlive() : (mm => mm.asaba === 'rescue' || (mm.asaba === 'chase' && !g._asabaHostageLost))(m);
  const tobiTestifies = V13.tobiTestifies ? V13.tobiTestifies() : m.asaba === 'rescue';
  if(tobiAlive){
    add('tobi_neutral', 'TOBI ONUOHA', tobiTestifies
      ? "Tobi decoded every line of UPSTREAM for the prosecution, from SPL-WSM-T4 to D.G.O. He keeps the codes in a notebook, in pencil, in case the computers lie."
      : "Sgt. Uche carried Tobi out of Asaba, and this season he read UPSTREAM line by line for Barrister Danladi from a desk at Zonal. His doctors still keep him out of the witness box. He asked for nothing.");
  }

  // SGT. UCHE
  add(end === 'career' ? 'uche_evasive' : 'uche_neutral', 'SGT. UCHE',
    end === 'career' ? "Uche asked for a transfer out of Benin Zonal the week Kelechi became its Commander. He didn't say why. He didn't have to."
    : end === 'truth' ? "Uche turned down another promotion. 'Slower,' he says. 'But it held.'"
    : "Uche still drives. He still won't guess for you. 'Early, not late, sir.'");

  // DIRECTOR-GENERAL KOLAWOLE FASHINA
  add('dg_neutral', 'DIRECTOR-GENERAL KOLAWOLE FASHINA',
    fin === 'proven' ? "Arraigned at the FCT High Court for abuse of office and taking gratification. In Kuje he asked for his records. They gave him a radio."
    : fin === 'contested' ? "Suspended by the Presidency and out on bail, his trial listed for March. He has been seen at the draughts tables in Area 11, winning."
    : "Still Director-General. At Easter, Kelechi's mother received a hamper from 'a friend of your son'. Inside: a bottle of wine and a folder. She didn't open the folder.");

  // SENATOR TONYE DOUGLAS-AKPAN
  add('senator_neutral', 'SENATOR TONYE DOUGLAS-AKPAN',
    end === 'truth' ? (fin === 'proven' ? "Charged at the Federal High Court with money laundering and dealing in crude oil without authority. A trust runs his foundation's schools now. The fans still work."
                                        : "Charged, bailed, and still a Senator; his case moves one adjournment at a time. He cut a ribbon in Bonny last month. The applause was thinner.")
    : end === 'career' ? "He flew out on Saturday 'for medical checks' and hasn't come back. The Senate still pays his salary. His foundation still opens classrooms on television."
    : "Still a Senator. Still opening classrooms. Still busy on the second Friday of every month.");

  // COMMANDER ADAEZE
  add(fin === 'proven' ? 'adaeze_afraid' : fin === 'contested' ? 'adaeze_evasive' : 'adaeze_angry', 'COMMANDER ADAEZE',
    fin === 'proven' ? "When the DG's photograph ran on the front page, Adaeze asked for a pen. Her statement is eleven pages long. The first line is his name."
    : fin === 'contested' ? "She still says nothing. Her lawyers stopped coming the week the DG was suspended. She has started reading the newspapers."
    : s1 === 'proven' ? "Serving her sentence. She has still never said who she answered to. Nobody has made her."
    : s1 === 'contested' ? "Still on remand, her trial listed again for May. Witnesses are getting tired. Exhibits are getting lost."
    : s1 === 'unproven' ? "Still uncharged. The inquiry into her has sat a fourth time. The chairman hasn't changed."
    : "Commander Adaeze has said nothing about the twenty years. Nobody has made her.");

  // AGENT KELECHI
  let kText, kArt = 'kelechi_neutral';
  if(end === 'truth' && m.s2_ninth === 'bury') kText = "He took the DG's badge on a Friday and arrested the DG's Senator a week later. The defence calls it betrayal. Kelechi calls it the order of events.";
  else if(end === 'truth' && fin === 'proven') kText = (m.s2_wire === true ? "He went back to Benin Zonal on Monday. The pen is in his desk drawer. He has never clicked it again."
                                                                            : "He went back to Benin Zonal on Monday. When the acting DG offered him Lagos, he asked for the case files instead.");
  else if(end === 'truth' && fin === 'contested') kText = "He is a witness in two trials now. He reads the transcripts at night. He is learning to sleep anyway.";
  else if(end === 'truth'){ kText = m.s2_ninth === 'refuse' ? "The Ekosodin inquiry sits on Thursday. Kelechi will be there. He's bringing a pen." : "He works one floor below a man he couldn't prove. He is patient now, too."; kArt = 'kelechi_evasive'; }
  else if(end === 'career' && fin === 'proven'){ kText = "He stood down on Friday and brought the DG down on Monday. He never got the badge. The Senator got away. Some days that feels like a trade. Most days it doesn't."; kArt = 'kelechi_evasive'; }
  else if(end === 'career'){ kText = "Zonal Commander, Benin, by Monday — as promised. So was the name from Enugu. He made that arrest himself. His uncle cried on the phone. Kelechi never told him the price."; kArt = 'kelechi_evasive'; }
  else if((rep.integrity || 0) >= 70) kText = "He went back to work on Monday. He still writes everything down.";
  else if(rep.integrity != null && rep.integrity <= 40){ kText = "He kept his badge. Some nights he wonders what it cost, and who else keeps a file on it."; kArt = 'kelechi_evasive'; }
  else kText = "He was back at his desk on Monday. He checks the name on the ninth floor's door every morning.";
  add(kArt, 'AGENT KELECHI', kText);

  return out;
};

/* ======================================================================
   SEASON 3 STINGER
   ====================================================================== */
/* CN11: a getter, read at render time (s2_case15.js). Musa drives the cooperative truck only if he
   talked in Season 1 (finale.js: flags.musa_tip or checkpoint 'flip_driver'); otherwise he served eight
   months, and the cooperative's newest driver takes the cartons. Assigning V13.STINGER_S2 overrides it. */
const STINGER_PLACE = 'KANO · 05:40', STINGER_CARD = { title:'SEASON 3', sub:'Someone banks for all of them.' };
const STINGER_LINE2 = 'A man in a pressed white kaftan is waiting by the cab. "Twelve cartons for Lagos, Malam. Printer paper." He pays for the space in new notes, still in their bank bands.';
const STINGER_LINE4 = '"Don\'t worry, Malam. The Senator was only a customer. We are the bank."';
const musaTalked = ()=>{
  try{ const sn = V13.s1snap && V13.s1snap(); if(sn && typeof sn.musaTalked === 'boolean') return sn.musaTalked; }catch(e){}
  const g = ST().game || {};
  return !!(g.flags || {}).musa_tip || (g.moralChoices || {}).checkpoint === 'flip_driver';
};
let stingerOverride = null;
Object.defineProperty(V13, 'STINGER_S2', { configurable:true, enumerable:true,
  get(){
    if(stingerOverride) return stingerOverride;
    const talked = musaTalked();
    return { place:STINGER_PLACE, card:Object.assign({}, STINGER_CARD), lines: talked ? [
      'Dawn at the cooperative yard on the Zaria road. Musa ties down the tarp on his new truck — blue, the cooperative\'s colour — and checks every knot twice, the way he does now.',
      STINGER_LINE2,
      'Musa lifts the corner of one carton. It isn\'t paper. The man doesn\'t stop smiling.',
      STINGER_LINE4,
    ] : [
      'Dawn at the cooperative yard on the Zaria road. The cooperative\'s newest driver ties down the tarp on a new truck — blue, the cooperative\'s colour — and checks every knot twice.',
      STINGER_LINE2,
      'The driver lifts the corner of one carton. It isn\'t paper. The man doesn\'t stop smiling.',
      STINGER_LINE4,
    ] };
  },
  set(v){ stingerOverride = v || null; },
});

/* ======================================================================
   AFTERMATH — the front page, a real-world safety tip, the next case
   ====================================================================== */
V13.AFTER = Object.assign(V13.AFTER || {}, {
  m13:{
    headline:(state)=>{
      const m = MC(state);
      if(m.s2_ninth === 'refuse') return { pub:'THE LAGOS LEDGER', head:'NACECA Suspends Ekosodin Officer Days Before Crude-Theft Trial',
        ded:'The agency cites "an inquiry into the Ekosodin operation". Defence lawyers in the Sapele case call the timing "remarkable".' };
      if(m.s2_ninth === 'bury') return { pub:'NATIONAL DISPATCH', head:'Ekosodin Officer Promoted to Head Lagos Cyber & Financial Crimes',
        ded:'The Director-General praised "a rare young talent". The Upstream inquiry "moves to headquarters for coordination", the agency says.' };
      return { pub:'WAVE24 NEWS', head:'NACECA Chief Meets Officer at Centre of Sapele Crude Probe',
        ded:'Neither side would comment on the meeting on the ninth floor. It lasted more than an hour.' };
    },
    tip:'Government jobs, postings and promotions are never for sale. Anyone who asks you to pay for a "slot" or a quick promotion is running a scam — or inviting you into a crime. Report them.',
    next:'Next — Maitama, 22:15: tea with the gatemen of Kainji Crescent, and a house where the lights burn for nobody.',
  },
  m13b:{
    headline:(state)=>{
      const m = MC(state);
      if(m.s2_bitrus === 'cold') return { pub:'THE DAILY GONG', head:'Maitama Gatemen "Not for Sale", Says Retired Sergeant',
        ded:'"A gate without a book is a hole in a wall," says a veteran of three peacekeeping missions who guards an empty house on Kainji Crescent.' };
      return { pub:'NATIONAL DISPATCH', head:'Maitama\'s Empty Mansions: Lights On, Nobody Home',
        ded:'An FCT survey counts hundreds of unoccupied luxury houses held through companies whose directors cannot be found.' };
    },
    tip:'Before you buy land or a house, search the owning company at the Corporate Affairs Commission — directors, shareholders and persons with significant control. If nobody behind it can be found, walk away.',
    next:'Next — the Federal High Court, Abuja, Court 5: FRN v. Edafe & 2 Ors. The Republic tries the men you caught.',
  },
  m14:{
    headline:(state)=>{
      const tr = TRIAL(state);
      const pleas = [tr.d2, tr.d3].filter(x => x === 'plea').length;
      if(tr.d1 === 'guilty') return { pub:'THE LAGOS LEDGER', head:'Sapele Changer Convicted of Laundering Crude-Theft Cash',
        ded:(pleas === 2 ? 'His co-defendants, a camp manager and a tank-farm manager, pleaded guilty and gave evidence for the prosecution.'
           : pleas === 1 ? 'One co-defendant pleaded guilty and gave evidence for the prosecution.'
           : 'All three defendants fought the charges to the end.') + ' A Senator\'s lawyers watched from the back row.' };
      if(tr.d1 === 'notguilty') return { pub:'NATIONAL DISPATCH', head:'Court Frees Sapele Changer, Faults NACECA\'s Evidence',
        ded:(pleas ? 'Co-defendants who pleaded guilty will still be sentenced. ' : '') + 'NACECA says it will "study the judgment carefully".' };
      return { pub:'WAVE24 NEWS', head:'Crude-Theft Trial Opens at Federal High Court, Abuja',
        ded:'Three defendants, one ledger, and a Senator whose name keeps coming up in Court 5.' };
    },
    tip:'Never let anyone use your bank account, BVN, SIM or POS terminal "just for one transfer". Money mules are prosecuted for laundering, even for a small cut.',
    next:'Next — the Bonny River, 23:30: the last of the cash, and the man who owns it.',
  },
  m15:{
    headline:(state)=>{
      const m = MC(state), fin = S2(state).finale || null, end = m.s2_end || null;
      if(end === 'truth' && fin === 'proven') return { pub:'THE LAGOS LEDGER', head:'Senator Held on Bonny Jetty; NACECA Director-General Arrested',
        ded:'Investigators say an oil-theft network paid for twenty years of protection inside the anti-corruption agency. Cash from the barge TEKENA 2 is still being counted.' };
      if(end === 'truth' && fin === 'contested') return { pub:'NATIONAL DISPATCH', head:'Senator Arrested With Barge of Cash; NACECA DG Suspended',
        ded:'The Director-General denies wrongdoing and is on bail. The Senator\'s lawyers call the jetty arrest "theatre".' };
      if(end === 'truth') return { pub:'THE WATERFRONT HERALD', head:'Senator Douglas-Akpan Arrested on Riverstone Jetty',
        ded:'Cash seized from the barge TEKENA 2. In Abuja, NACECA\'s Director-General praised "the officers involved" and declined further comment.' };
      if(end === 'career' && fin === 'proven') return { pub:'THE DAILY GONG', head:'NACECA Director-General Arrested — Senator Abroad',
        ded:'Senator Douglas-Akpan flew out on Saturday "for medical checks". A barge raid in Port Harcourt was called off at midnight.' };
      if(end === 'career' && fin === 'contested') return { pub:'WAVE24 NEWS', head:'NACECA DG Suspended Pending Trial; Port Harcourt Raid "Stood Down"',
        ded:'A special task force secured the Riverstone jetty overnight. No cash was recovered.' };
      if(end === 'career') return { pub:'THE WATERFRONT HERALD', head:'Task Force "Secures" Riverstone Jetty; NACECA Raid Called Off',
        ded:'Boat drivers say a barge left without lights after midnight. NACECA announces a new Zonal Commander for Benin.' };
      return { pub:'DELTA CHRONICLE', head:'Creek Communities Ask: Who Bought the Stolen Crude?',
        ded:'From Sapele to the Bonny River, the Upstream case has named the sellers. The buyers are another matter.' };
    },
    tip:'"Cheap" diesel from illegal refineries wrecks engines and generators, poisons the creeks it comes from and funds crude theft. Buy from licensed stations and keep the receipt.',
    next:'That\'s Season 2. In Kano, at dawn, a cooperative truck is about to carry something that isn\'t printer paper.',
  },
});

/* ======================================================================
   HUB PHONE — between cases. cond is a JS expression over S.
   ====================================================================== */
V13.PHONE = Object.assign(V13.PHONE || {}, {
  after_m13:[
    { who:'MUM', text:"Kelechi, a very polite man called from your office in Abuja. He said they are 'updating your next of kin'. He knew your father's name and our street. I told him nothing else. Did I do well?" },
    { who:'UCHE', cond:"S.game.moralChoices.s2_ninth !== 'bury'", text:"Card or no card, I'm driving tonight. A silver Camry has been parked across from our hotel since noon. Wave if you like. I did." },
    { who:'UCHE', cond:"S.game.moralChoices.s2_ninth === 'bury'", text:"Superintendent. I'll still drive tonight, sir. That's all I'll say about it." },
    // CN06: Mr. Igbinosa pulls and certifies the audio in every save (the Tobi text is dropped)
    { who:'OSAGIE', cond:"S.game.moralChoices.s2_wire === true", text:"Igbinosa has the pen. Hashed and sealed before he'd taken his cap off. He says the DG's voice is 'very clear, unfortunately for him'." },
    { who:'OSAGIE', cond:"S.game.moralChoices.s2_original === 'kept'", text:"My posting order was signed at noon. Maiduguri, 'with immediate effect'. I asked for seven days to hand over. They gave me three. Use them well." },
    { who:'PA TIMI', cond:"S.game.moralChoices.s2_timi === 'source'", text:"My grandson is typing for me. The nets came up grey this morning. Not black — grey. I am telling you because you will understand." },
    { who:'HAUWA', text:"Maitama Haven Properties Ltd: two directors. One died in 2019. The other is ninety-one and lives in a village with no road. Annual returns filed on time, every year. Somebody loves that company." },
  ],
  after_m13b:[
    { who:'BITRUS', cond:"S.game.moralChoices.s2_bitrus === 'witness'", text:"Sgt. (rtd.) Gyang. Last night's entries are complete. 22:58, the Prado. 23:14, the green Peugeot, the Honourable driving himself. The book is where even I cannot find it without my glasses." },
    { who:'BITRUS', cond:"S.game.moralChoices.s2_bitrus === 'photo'", text:"This morning a man from the owner's agent came to 'audit' my book. He took it and gave me a new one. Your photographs are all that is left of the old one. I have started writing in the new." },
    { who:'BITRUS', cond:"S.game.moralChoices.s2_bitrus === 'cold'", text:"You are in my book also, young man. 22:31. I have not crossed you out." },
    { who:'HAUWA', text:"Trial fixed: Monday 11 January, 9 a.m., Federal High Court Abuja, Court 5. The 1st defendant has briefed Femi Olaniran-Cole, SAN. He is very good. Iron your shirt, and answer only what you're asked." },
    { who:'MUM', text:"The polite man called again. I told him you are a good boy and hung up. Your uncle says if they call a third time he will report them to 'the BVN people'. Hm." },
    { who:'UCHE', text:"Baba Shayi says his tea is still the best in Maitama and that you didn't finish your egg. He's offended on behalf of the egg." },
    { who:'KC', cond:"S.game.moralChoices.market_runner === 'caught' && S.game.moralChoices.choice !== 'force' && !(typeof _cwWrong==='function' && _cwWrong('lagos')==='kc')", text:"Oga, na KC. My guy for Benin phone market talk say that man wey wear NACECA lanyard don come again, dey ask the SIM boys who be the agent wey dey work Sapele. Dem no know say I know you.", textEn:"Sir, it's KC. My guy at the Benin phone market says the man with the NACECA lanyard came again, asking the SIM boys who the agent working Sapele is. They don't know I know you." },
  ],
  after_m14:[
    { who:'MUSA', cond:"!!(S.game.flags||{}).musa_tip || (S.game.moralChoices||{}).checkpoint === 'flip_driver'", text:"Oga Kelechi! Na Musa, from Kano. Cooperative don give me new truck — blue one. One man come yesterday wan rent space for back. Cash, no papers. I tell am no. E smile say another driver go say yes.", textEn:"Officer Kelechi! It's Musa, from Kano. The cooperative gave me a new truck — a blue one. A man came yesterday wanting to rent space in the back. Cash, no papers. I said no. He smiled and said another driver will say yes." },
    { who:'HAUWA', cond:"!!(S.game.s2 && S.game.s2.trial) && S.game.s2.trial.d1 === 'guilty'", text:"Conviction entered on Count 1. The Senator's lawyers sat in the back row all three days, taking notes on you. Tonight we give them something worth writing down." },
    { who:'HAUWA', cond:"!!(S.game.s2 && S.game.s2.trial) && S.game.s2.trial.d1 === 'notguilty'", text:"I've read the judgment twice. It's fair. We weren't careful enough, and the court said so. That ends tonight — every bag numbered, every number signed." },
    { who:'OSAGIE', text:"The Senator's people are moving cash tonight, before the freeze order lands. Port Harcourt waterfront, 23:30. Wear something you can swim in." },
    { who:'UCHE', text:"Packed: two torches, a dry bag for the warrant, and a flask of my wife's pepper soup. She says the soup is for you. I'm not to touch it." },
    { who:'EJIRO', cond:"S.game.moralChoices.s2_ejiro === 'source'", text:"Oga, after court two men follow me reach my house. I no sleep. But I talk true for that court. My mama say make I tell you thank you.", textEn:"Sir, after court two men followed me home. I didn't sleep. But I told the truth in that court. My mother says to tell you thank you." },
    { who:'MUM', text:"Your face was on the television outside the court! You looked thin. Are you eating? Your uncle says you looked like a lawyer. He meant it nicely." },
  ],
});

/* ======================================================================
   SOURCE TIPS — GATE (Bitrus), KC, TUNDE. true:false = planted once exposed.
   ====================================================================== */
V13.TIPS = V13.TIPS || {};
['GATE', 'KC', 'TUNDE'].forEach(c => { if(!Array.isArray(V13.TIPS[c])) V13.TIPS[c] = []; });
V13.TIPS.GATE.push(
  { after:'m13b', true:true, text:"Sgt. Gyang. On Friday the Chairman told his driver: 'Port Harcourt, before that court finishes.' I heard it through the gatehouse window. I wrote it down." },
  { after:'m13b', true:false, text:"Sgt. Gyang. The Honourable has stopped coming. The owner's agent says the house is to be sold. There is nothing more to see here." },
  { after:'m14', true:true, text:"Sgt. Gyang. At 11:00 today the driver loaded two suitcases at No. 19 — two men to lift each one — and drove towards the airport." },
  { after:'m14', true:false, text:"Sgt. Gyang. The driver says the Chairman has flown to London for medical treatment. He will not be back this month." }
);
V13.TIPS.KC.push(
  { after:'m9', true:true, text:"Oga, na KC. My guy for Benin phone market talk say one man wey wear NACECA lanyard buy ten SIM there — cash, no NIN. E no resemble person wey dey buy SIM for himself.", textEn:"Sir, it's KC. My guy at the Benin phone market says a man wearing a NACECA lanyard bought ten SIMs there — cash, no NIN. He didn't look like someone buying SIMs for himself." },
  { after:'m10', true:true, text:"Oga, my guy for Benin phone market talk say Lucky boys dey buy SIM there too — five, six at once. Dem dey register am with other people NIN. Na so dem take open all those account.", textEn:"Sir, my guy at the Benin phone market says Lucky's boys buy SIMs there too — five or six at once, registered with other people's NINs. That's how they opened all those accounts." },
  { after:'m12', true:true, text:"Oga, my guy for Benin phone market talk say the lanyard man don come back. E dey ask the SIM boys who be the agent wey dey Sapele. Dem no know say I know you. Shine your eye.", textEn:"Sir, my guy at the Benin phone market says the lanyard man came back, asking the SIM boys who the agent working Sapele is. They don't know I know you. Keep your eyes open." },
  { after:'m12', true:false, text:"Oga, I hear say the barge people don carry everything go Calabar. Port Harcourt don close.", textEn:"Sir, I hear the barge people have moved everything to Calabar. Port Harcourt is finished." },
  { after:'m14', true:true, text:"Oga, Sapele boys dey buy Ghana-must-go and big padlock since morning. Dem talk say na 'last load'.", textEn:"Sir, the Sapele boys have been buying Ghana-must-go bags and big padlocks since morning. They say it's the 'last load'." },
  { after:'m14', true:false, text:"Oga, my uncle hear for motor park say Senator money don cross go Cotonou since last week. Nothing remain for Port Harcourt.", textEn:"Sir, my uncle heard at the motor park that the Senator's money crossed to Cotonou last week. Nothing is left in Port Harcourt." }
);
V13.TIPS.TUNDE.push(
  { after:'m10', true:true, text:"Oga, Tunde here. Lagos bloggers dey collect fifty thousand each to write say the Sapele arrest na 'political witch-hunt'. The money dey come from one Port Harcourt foundation account.", textEn:"Sir, it's Tunde. Lagos bloggers are being paid fifty thousand each to call the Sapele arrest a 'political witch-hunt'. The money comes from a Port Harcourt foundation's account." },
  { after:'m11', true:true, text:"Oga, the BDC boys for Lagos Island talk say one Sapele changer dey sell naira bundle with Delta bank band every Monday. Big bundle.", textEn:"Sir, the bureau de change boys on Lagos Island say a Sapele changer sells naira bundles in Delta bank bands every Monday. Big bundles." },
  { after:'m13', true:true, text:"Oga, Abuja people dey ask for Ikeja who be your people. Dem ask about me too. I don change my SIM. This na my new number.", textEn:"Sir, people from Abuja have been asking around Ikeja who your people are. They asked about me too. I've changed my SIM. This is my new number." },
  { after:'m13', true:false, text:"Oga, the Senator money don move go one church for Warri. Na pastor dey keep am now. Forget Port Harcourt.", textEn:"Sir, the Senator's money has moved to a church in Warri. A pastor keeps it now. Forget Port Harcourt." },
  { after:'m14', true:true, text:"Oga, tanker drivers for Apapa dey talk: Riverstone don cancel all their trucks this week. Dem say na 'boat only'.", textEn:"Sir, the tanker drivers at Apapa say Riverstone has cancelled all its trucks this week. They say it's 'boat only'." }
);

/* ======================================================================
   THE ACCUSATION — "Who protected Adaeze?"
   ====================================================================== */
V13.S2_CANDIDATES = [
  { id:'dg',      name:'DG Kolawole Fashina',    role:'Director-General, NACECA',        art:'dg_neutral' },
  { id:'senator', name:'Sen. Douglas-Akpan',     role:'Senator; oil-services magnate',   art:'senator_neutral' },
  { id:'kuti',    name:'Mr. Kuti',               role:'The DG\'s personal assistant',     art:'kuti_neutral' },
  { id:'osagie',  name:'Cdr. Itohan Okundaye',   role:'Benin Zonal Commander',           art:'osagie_neutral' },
  { id:'danladi', name:'Barr. Zainab Danladi',   role:'NACECA prosecutor',               art:'hauwa_neutral' },
];

/* what ties the Director-General to protecting Adaeze, given what this player actually holds */
V13.S2_STRONG = function(){
  const g = ST().game || {}, m = g.moralChoices || {}, tr = (g.s2 || {}).trial || {};
  const has = id => Array.isArray(g.evidence) && g.evidence.some(e => e && e.id === id);
  const q = id => (g.evQ && g.evQ[id]) || 'good';
  const ok = id => has(id) && q(id) !== 'weak';
  const out = {};
  const book = ok('visitor_book') ? 'visitor_book' : null;
  const photos = !book && ok('visitor_book_photo') && (ok('ereba_photo') || ok('dg_recording'));
  const atHouse = !!book || photos;
  const sotonyeSwore = tr.d3 === 'plea';

  if(ok('dg_recording') && m.s2_wire === true)
    out.dg_recording = q('dg_recording') === 'good'
      ? 'His own voice: "no further action" on every petition against her — then a badge to bury the file.'
      : 'His voice offering a badge to bury the file. The defence will fight the gaps.';
  if(ok('transfer_docket'))
    out.transfer_docket = m.s2_original === 'kept'
      ? 'Okundaye\'s posting is filed under the exhibit 14 docket — punishment for keeping the drive. His office files everything as "DGO".'
      : 'Exhibit 14 — the drive that names "C.A." — went into his personal safe, on his order. His office files everything as "DGO".';
  if(book) out.visitor_book = m.s2_bitrus === 'witness'
      ? '"Hon. K.F. (NACECA)" meets "CHAIRMAN" every second Friday — and the man who wrote it will swear to it.'
      : '"Hon. K.F. (NACECA)" meets the Senator\'s "CHAIRMAN" at an empty house every second Friday.';
  if(photos) out.visitor_book_photo = 'Photos of the book: "Hon. K.F." and "CHAIRMAN" every second Friday. The original is gone; the dates still match.';
  if(ok('ereba_photo') && atHouse) out.ereba_photo = 'The book says "drv. EREBA". Your camera says the same, on the second Friday.';
  if(ok('upstream_ledger') && !(tr.d1 === 'notguilty' && q('upstream_ledger') !== 'good') && (atHouse || ok('dg_recording') || sotonyeSwore)){
    out.upstream_ledger = (sotonyeSwore
      ? '"D.G.O." is paid every quarter by R.M.S. — and Sotonye swore in court that R.M.S. is Riverstone.'
      : '"D.G.O." is paid every quarter, from the same R.M.S. account that paid Adaeze\'s "C.A.".')
      + (tr.d1 === 'guilty' ? ' A court has already believed this ledger.' : '');
  }
  if(ok('bank_trail') && atHouse) out.bank_trail = 'Riverstone\'s money lands in Maitama Haven — the house where he spends his second Fridays.';
  if(ok('senator_words') && m.s2_end === 'truth') out.senator_words = 'The Senator, under arrest, on camera: "Kolawole kept her because I asked him to."';
  return out;
};

/* why a piece of evidence does not prove it (when it isn't in S2_STRONG) */
V13.S2_WHY_NOT = {
  drive_image:'A true copy of Osas\'s drive. What it says about "D.G.O." is the ledger\'s job.',
  upstream_ledger:'"D.G.O." is three letters. Without the house, the safe or his voice, a defence lawyer reads it as anything.',
  evidence_register:'It proves who touched exhibit 14 in Benin. Not who wanted it in Abuja.',
  pos_t4_log:'It proves Lucky cashed out in Sapele. The DG never stood at a POS kiosk.',
  bvn_link:'One BVN, four accounts. That convicts a changer, not a Director-General.',
  cash_bundles:'Cash in a sack has no surname.',
  lucky_statement:'Lucky never met anyone above Riverstone. He said so in every version.',
  fuel_samples:'It proves what the camp cooked. Not who it paid.',
  waybill_book:'False waybills hide the crude. They don\'t name its protectors.',
  felix_phone:'"GODWIN — R.M.S." leads to the Senator\'s driver — one floor short of the ninth.',
  barge_track:'It follows TEKENA 2, not the money\'s last stop.',
  loading_log:'It convicts Tank 3. It never mentions Abuja.',
  tank3_sample:'Diesel from a kpo-fire still. Chemistry, not protection.',
  cac_record:'It proves Ereba fronts Riverstone for the Senator. The DG isn\'t on it.',
  bank_trail:'It proves the money reached an empty house. Not who sat in it.',
  gate_register:'Tankers out of Riverstone. Nothing about who kept Adaeze in.',
  transfer_docket:'A page from a PA\'s desk, misread in a hurry. The defence will ask how you came by it.',
  dg_recording:'Too little of it is his voice saying anything a court can use.',
  visitor_book:'Misread under a gatehouse lamp. The defence will call it a gateman\'s diary.',
  visitor_book_photo:'Photos of a book that has since vanished, with nobody to swear to them. The defence will call it gossip.',
  ereba_photo:'It puts the Senator\'s driver at a gate. Not the Director-General.',
  barge_cash:'Cash on a barge proves the Senator had money. Not who sheltered Adaeze.',
  senator_words:'Without an arrest it\'s a rich man\'s boast on a jetty. He\'ll say it was a joke.',
};

/* the Director-General, when the accusation names the wrong person (insert after mark 'dg') */
V13.S2_WRONG = {
  senator:'You were watching the man with the money, Kelechi. Money is loud. Protection is quiet.',
  kuti:'Kuti? Kuti signs what I tell him to sign. You came for the pen and left the hand.',
  osagie:'Itohan Okundaye kept your drive in Benin when I asked for it. You accused the one officer who stood in my way.',
  danladi:'Zainab Danladi prosecuted your case with her own hands. You accused your own lawyer.',
};

/* ======================================================================
   V13.C — assemblers. Each returns the DIALOGUE key to start.
   They never mutate the base keys: they build *_run copies.
   ====================================================================== */
const PRISTINE = {};
const base = key => { if(!PRISTINE[key]) PRISTINE[key] = (DIALOGUE[key] || []).slice(); return PRISTINE[key].slice(); };
const insertAt = (lines, mark, extra, after) => {
  if(!extra || !extra.length) return lines;
  const i = lines.findIndex(l => l && l.mark === mark);
  if(i >= 0) lines.splice(after ? i + 1 : i, 0, ...extra);
  return lines;
};
const NINTH_WIRE = ['m13_dg_wire', 'm13_dg_wire_2', 'm13_dg_wire_2_cold', 'm13_dg_wire_3', 'm13_dg_wire_3_cold',
                    'm13_dg_wire_4', 'm13_dg_wire_4_cold', 'm13_dg_wire_5', 'm13_dg_wire_5_cold', 'm13_dg_offer_wire'];
V13.C = {
  /* the hub, the night before: Commander Okundaye's pen, in every save (CN06) */
  wireOffer(){ return 'm13_wire_offer'; },
  /* the docket on Kuti's desk */
  docket(){ return MC().s2_original === 'kept' ? 'm13_docket_kept' : 'm13_docket'; },
  /* the ninth-floor meeting. registered: source codenames the DG can read, e.g. ['HERBS','TIDE'] (max 2 used) */
  ninth(registered){
    const m = MC(), f1 = S1FATE();
    const fate = f1 && DIALOGUE['m13_dg_adaeze_' + f1] ? DIALOGUE['m13_dg_adaeze_' + f1] : [];
    const pre = [];
    if(m.arrest === 'bribe') pre.push(...DIALOGUE.m13_dg_bribe);
    (registered || []).slice(0, 2).forEach(c => { const key = 'm13_dg_register_' + String(c).toLowerCase(); if(DIALOGUE[key]) pre.push(...DIALOGUE[key]); });
    if(m.s2_wire !== true){
      const L = base('m13_dg');
      insertAt(L, 'adaeze', fate, true); insertAt(L, 'offer', pre, false);
      DIALOGUE.m13_dg_run = L; return 'm13_dg_run';
    }
    for(const key of NINTH_WIRE){
      const L = base(key).map(l => !l.choices ? l : Object.assign({}, l, {
        choices:l.choices.map(c => (c.next && NINTH_WIRE.includes(c.next)) ? Object.assign({}, c, { next:c.next + '_run' }) : c) }));
      if(key === 'm13_dg_wire_2' || key === 'm13_dg_wire_2_cold') insertAt(L, 'adaeze', fate, true);
      if(key === 'm13_dg_offer_wire') insertAt(L, 'offer', pre, false);
      DIALOGUE[key + '_run'] = L;
    }
    return 'm13_dg_wire_run';
  },
  /* the recording meter → evidence quality for dg_recording */
  recordingQuality(pct){ return pct >= 100 ? 'good' : pct >= 60 ? 'contested' : 'weak'; },
  /* downstairs; pct = the RECORDING meter (only used with the wire) */
  end13(pct){
    const m = MC();
    const key = m.s2_ninth === 'bury' ? 'm13_end_bury' : m.s2_ninth === 'refuse' ? 'm13_end_refuse' : 'm13_end';
    const L = base(key);
    if(m.s2_wire === true && typeof pct === 'number'){
      const w = V13.C.recordingQuality(pct);
      insertAt(L, 'wire', DIALOGUE[w === 'good' ? 'm13_wire_full' : w === 'contested' ? 'm13_wire_partial' : 'm13_wire_spooked'], true);
    }
    DIALOGUE.m13_end_run = L; return 'm13_end_run';
  },
  /* the visitor book: photographed pages when Bitrus chose not to stand behind them */
  book(){ return MC().s2_bitrus === 'photo' ? 'm13b_book_photo' : 'm13b_book'; },
  /* the barge brief. src overrides which sources speak: { ibinabo, bitrus, karo, felix } */
  brief15(src){
    const m = MC(), tr = TRIAL();
    const s = Object.assign({ ibinabo:m.s2_ibinabo === 'source', bitrus:m.s2_bitrus === 'witness' || m.s2_bitrus === 'photo',
                              karo:m.s2_karo === 'trust', felix:m.s2_felix === 'cooperating' }, src || {});
    const add = [];
    if(m.s2_ninth === 'refuse') add.push(...DIALOGUE.m15_brief_suspended);
    else if(m.s2_ninth === 'bury') add.push(...DIALOGUE.m15_brief_bury);
    if(tr.d1 === 'guilty') add.push(...DIALOGUE.m15_brief_trial_won);
    else if(tr.d1 === 'notguilty') add.push(...DIALOGUE.m15_brief_trial_lost);
    if(tr.d2 === 'plea' || tr.d3 === 'plea') add.push(...DIALOGUE.m15_brief_trial_pleas);
    if(s.bitrus) add.push(...DIALOGUE.m15_brief_bitrus);
    if(s.karo) add.push(...DIALOGUE.m15_brief_karo);
    if(s.felix) add.push(...DIALOGUE.m15_brief_felix);
    if(s.ibinabo) add.push(...DIALOGUE.m15_brief_ibinabo);
    if(m.s2_barge === 'seized') add.push(say(HAU, "TEKENA 2 — the barge we seized in the creek. A judge released her to Riverstone on a bond. Tonight we find out what the bond was for.", { mood:'evasive' }));
    const L = insertAt(base('m15_brief'), 'end', add, false);
    DIALOGUE.m15_brief_run = L; return 'm15_brief_run';
  },
  entry15(boats){ return (boats != null ? boats : MC().s2_ibinabo === 'source') ? 'm15_entry' : 'm15_entry_gate'; },
  taskforce15(){ return MC().s2_raid_entry === 'water' ? 'm15_taskforce_water' : 'm15_taskforce'; },
  accuseLead(){ return MC().s2_end === 'career' ? 'm15_accuse_lead_career' : 'm15_accuse_lead'; },
  /* the DG confronted. outcome: 'proven'|'contested'|'unproven'; accused: a S2_CANDIDATES id */
  reveal(outcome, accused){
    const o = ['proven', 'contested', 'unproven'].includes(outcome) ? outcome : 'unproven';
    const add = [];
    if(accused && accused !== 'dg' && V13.S2_WRONG[accused]) add.push(say(DG, V13.S2_WRONG[accused], { mood:'evasive' }));
    if(MC().s2_end === 'career') add.push(...DIALOGUE.m15_reveal_career_add);
    DIALOGUE.m15_reveal_run = insertAt(base('m15_reveal_' + o), 'dg', add, true);
    return 'm15_reveal_run';
  },
};

})();
