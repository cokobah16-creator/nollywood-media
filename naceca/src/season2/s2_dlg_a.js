/* =========================================================================
   NACECA · v13_dlg_a.js — Season 2 "Operation Upstream", Cases 09 and 10
   Case 09 · The Evidence Room — Benin Zonal Command, one night
   Case 10 · The Night Market — Sapele Waterside, Thursday
   Dialogue, documents (PUZZLES + V12.DOCS), aftermath, hub phone, source tips.
   Contract: s2/CASES.md. Plain data only — the game code decides when.

   Fixed facts other writers should keep:
   - Exhibit 14: black 16 GB USB drive, bag seal BZ-0447, booked in at 02:40 on
     the night of Ekosodin. Signed out (if signed) at 23:04 by Kelechi.
   - SHA-256 of exhibit 14 / EX14.E01: 1e1d6d411699…99a2d003fd49.
   - The ledger: hidden folder \PAYROLL\_old\u.xlsx, sheet UPSTREAM, last saved
     12 Sep 2026. TEKENA 2 sails every other Tuesday (≈640,000 L AGO);
     SPL-WSM-T4 cash-out two days later, a Thursday (≈ ₦9.5m); C.A. ₦4.8m on
     the 10th of each month; D.G.O. ₦24m a quarter, on a second Friday
     (12 Jun, 11 Sep). R.M.S. is the payer of both.
   - SPL-WSM-T4 is the market's POS permit for kiosk 4 (Ejiro's). The kiosk has
     four machines registered as four agents (his mother, sister, cousin, him),
     each under the ₦1.2m daily agent cap. Lucky makes four ₦1,195,000
     withdrawals on four cards (four names, one BVN: EDAFE, LUCKY O.).
     He arrives with cash from earlier stops; ₦9.6m (96 bundles) is seized.
   ========================================================================= */
(function(){
'use strict';
const V13 = window.V13 = window.V13 || {};
const V12 = window.V12 = window.V12 || {};
V12.DOCS = V12.DOCS || {};

/* moral choices from whatever the caller passes: S, S.game, or nothing */
function MC(st){
  try{
    if(st && st.game && st.game.moralChoices) return st.game.moralChoices;
    if(st && st.moralChoices) return st.moralChoices;
    if(typeof S !== 'undefined' && S && S.game && S.game.moralChoices) return S.game.moralChoices;
  }catch(e){}
  return {};
}

/* ======================================================================
   CASE 09 · THE EVIDENCE ROOM — EDO · BENIN ZONAL COMMAND, 21:40
   ====================================================================== */
Object.assign(DIALOGUE, {

  m9_intro: [
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Benin Zonal, twenty-one forty. Power's out on the whole street — generators everywhere, and that one building with every window lit." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Abuja's order came at six, sir. Exhibit 14 on the six o'clock flight. Eight hours from now, Osas Ehigie's drive belongs to somebody else." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Six weeks of nothing, then a plane at dawn. Somebody in Abuja is frightened." },
  ],

  /* ---------- the Zonal Commander ---------- */
  m9_osagie: [
    { speaker:'COMMANDER OSAGIE',
      text:"Agent Kelechi. Sergeant. Sit — those chairs are older than both of you, but they hold." },
    { speaker:'COMMANDER OSAGIE',
      text:"I've read your sealed report on Ekosodin. Twice. The second time, I locked the door first." },
    { speaker:'COMMANDER OSAGIE',
      text:"Adaeze is the court's business now. That drive is mine. Six weeks in Sergeant Ikpe's cage, and nobody in Abuja asked about it once." },
    { speaker:'COMMANDER OSAGIE', mood:'evasive',
      text:"Then this, at six this evening: 'Exhibit 14 to be conveyed to Headquarters by the 06:00 flight.' Signed for the Director-General — by his PA, a Mr. Kuti." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Not by the DG himself." },
    { speaker:'COMMANDER OSAGIE',
      text:"An order signed 'for' him is still an order. At six, it goes. Until then it's an exhibit in my custody, in an open Zonal case. You have the night." },
    { speaker:'COMMANDER OSAGIE',
      text:"Do it by the book, or don't do it in my building.",
      choices:[
        { text:"By the book, ma. Every seal, every signature, every minute written down.", tag:'lawful', effect:{ integrity:+1 }, next:'m9_osagie_book' },
        { text:"Who is Mr. Kuti, ma — and how often does he sign 'for' the DG?", tag:'savvy', effect:{ intel:+2 }, next:'m9_osagie_kuti' },
        { text:"With respect, ma — if that drive gets on a plane, we never see it again.", tag:'harsh', next:'m9_osagie_blunt' },
      ] },
  ],
  /* the same meeting when Adaeze was never charged (moralChoices.finale === 'unproven') */
  m9_osagie_unproven: [
    { speaker:'COMMANDER OSAGIE',
      text:"Agent Kelechi. Sergeant. Sit — those chairs are older than both of you, but they hold." },
    { speaker:'COMMANDER OSAGIE',
      text:"I've read your sealed report on Ekosodin. Twice. The second time, I locked the door first." },
    { speaker:'COMMANDER OSAGIE', mood:'angry',
      text:"Six weeks. Adaeze sits in her house in Ikoyi on full pay. The inquiry has met twice. Twice. Nobody has charged her with so much as a parking offence." },
    { speaker:'COMMANDER OSAGIE', mood:'angry',
      text:"And at six this evening Abuja asks for the one exhibit that could: 'Exhibit 14 to the 06:00 flight.' Signed for the Director-General — by his PA, a Mr. Kuti." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Not by the DG himself." },
    { speaker:'COMMANDER OSAGIE',
      text:"An order signed 'for' him is still an order. At six, it goes. Until then it's an exhibit in my custody, in an open Zonal case. You have the night." },
    { speaker:'COMMANDER OSAGIE',
      text:"Do it by the book, or don't do it in my building.",
      choices:[
        { text:"By the book, ma. Every seal, every signature, every minute written down.", tag:'lawful', effect:{ integrity:+1 }, next:'m9_osagie_book' },
        { text:"Who is Mr. Kuti, ma — and how often does he sign 'for' the DG?", tag:'savvy', effect:{ intel:+2 }, next:'m9_osagie_kuti' },
        { text:"With respect, ma — if that drive gets on a plane, we never see it again.", tag:'harsh', next:'m9_osagie_blunt' },
      ] },
  ],
  m9_osagie_book: [
    { speaker:'COMMANDER OSAGIE',
      text:"Good. Sergeant Ikpe has the cage; forensics is on the second floor. I have the Governor's people at seven, so I'm going home to sleep for four hours." },
    { speaker:'COMMANDER OSAGIE',
      text:"Use my office for the paperwork. If the phone on that desk rings tonight, Agent, write down every word." },
  ],
  m9_osagie_kuti: [
    { speaker:'COMMANDER OSAGIE', mood:'evasive',
      text:"Kuti signs everything. Postings, leave letters, condolence cards. The DG hasn't put his own name on paper in two years." },
    { speaker:'COMMANDER OSAGIE',
      text:"That's a very busy man or a very careful one. Use my office tonight. If the phone on that desk rings, write down every word." },
  ],
  m9_osagie_blunt: [
    { speaker:'COMMANDER OSAGIE', mood:'angry',
      text:"Then make sure whatever is on it is on paper in my building before it leaves. Lawfully. I won't lose one case to save another." },
    { speaker:'COMMANDER OSAGIE',
      text:"Ikpe has the cage. Use my office. And Agent — if the phone on that desk rings tonight, write down every word." },
  ],

  /* ---------- the evidence cage ---------- */
  m9_ikpe: [
    { speaker:'SGT. IKPE',
      text:"Agent. Sergeant. Twenty-two years I've kept this cage. Machetes, cocaine, a church bell somebody stole in 2009. Nothing has ever walked out on its own." },
    { speaker:'SGT. IKPE', mood:'evasive',
      text:"But this afternoon somebody from Abuja rang to ask what time I lock up. In twenty-two years, Abuja has never asked me what time I do anything." },
    { speaker:'SGT. IKPE',
      text:"Exhibit 14. Flash drive, black, sixteen gig. Bag seal BZ-0447, intact. Booked in at 02:40 on the night of Ekosodin." },
    { speaker:'SGT. IKPE',
      text:"The register, Agent. How do you want it?",
      choices:[
        { text:"Sign it out — time, name, seal number.", tag:'lawful',
          effect:{ integrity:+2 }, flag:{ s2_custody:'signed' }, next:'m9_ikpe_signed' },
        { text:"Sergeant, tonight this never left the cage.", tag:'harsh',
          effect:{ integrity:-3, agencyFavour:-1 }, flag:{ s2_custody:'unsigned' }, next:'m9_ikpe_unsigned' },
      ] },
  ],
  m9_ikpe_signed: [
    { speaker:'SGT. IKPE', mood:'relieved',
      text:"Twenty-three-oh-four. Exhibit 14, seal BZ-0447 intact. Out to Agent Kelechi for forensic examination, on the Zonal Commander's authority." },
    { speaker:'SGT. IKPE',
      text:"My father was a court clerk in Warri. He used to say paper remembers what people forget. Sign there, Agent. And there." },
  ],
  m9_ikpe_unsigned: [
    { speaker:'SGT. IKPE', mood:'afraid',
      text:"…Agent. This book has never told a lie. The day it does, it isn't a register anymore. It's a story." },
    { speaker:'SGT. IKPE', mood:'evasive',
      text:"I won't write it. But if anybody asks me under oath, I won't lie for you either. I'll just say the book was quiet that night." },
    { speaker:'SGT. UCHE', portrait:'sergeant', mood:'evasive',
      text:"Sir. That's a gap a defence lawyer can drive a lorry through." },
  ],

  /* ---------- the forensic bench: Tobi (alive if asaba === 'rescue') ---------- */
  m9_forensic_tobi: [
    { speaker:'TOBI',
      text:"Kelechi! — Agent. Agent Kelechi. Sorry. They said you were coming, and I've cleaned this bench three times." },
    { speaker:'TOBI', mood:'evasive',
      text:"I'm fine. I sleep with the light on, that's all. Okay. Exhibit 14. There are three ways to do this." },
    { speaker:'TOBI',
      text:"One: a write-blocker. The drive can be read, never written. I image it, hash the drive and the image, and sign a section 84 certificate. Forty minutes." },
    { speaker:'TOBI',
      text:"Two: I plug it straight into this laptop. Five minutes. But every file's access date will say tonight — and the defence will say we put the files there." },
    { speaker:'TOBI',
      text:"Three: you photograph the screen while I scroll. Fast. But a photo of a screen only proves there was a screen." },
    { speaker:'TOBI',
      text:"It's eleven-fifteen. Whatever you choose, I'll do it. I owe you a great deal more than forty minutes.",
      choices:[
        { text:"Write-blocker and a full image. We do this properly.", tag:'lawful',
          effect:{ integrity:+2 }, flag:{ s2_method:'image' }, next:'m9_forensic_tobi_image' },
        { text:"Plug it in now. If someone comes for it before six, I want it read.", tag:'harsh',
          effect:{ integrity:-2 }, flag:{ s2_method:'direct' }, next:'m9_forensic_tobi_direct' },
        { text:"Scroll. I'll photograph every screen — nobody can put my phone on a plane.", tag:'savvy',
          effect:{ integrity:-1 }, flag:{ s2_method:'photo' }, next:'m9_forensic_tobi_photo' },
      ] },
  ],
  m9_forensic_tobi_image: [
    { speaker:'TOBI', mood:'relieved',
      text:"Properly. Yes. Good. — There: green light on the blocker. Read-only. It couldn't change a byte now if it wanted to." },
    { speaker:'TOBI',
      text:"Forty minutes. There's tea in the flask. It's terrible. I made it." },
  ],
  m9_forensic_tobi_direct: [
    { speaker:'TOBI', mood:'afraid',
      text:"…Okay. It's in. Every access date on it says tonight now. I'm writing the time down, so nobody can say we hid it." },
    { speaker:'TOBI', mood:'evasive',
      text:"If the defence asks me about this, I'll tell them the truth, Kelechi. I'm sorry. I have to." },
  ],
  m9_forensic_tobi_photo: [
    { speaker:'TOBI',
      text:"Okay. I'll scroll slowly. Hold the phone straight — defence lawyers love a blurry photo." },
    { speaker:'TOBI', mood:'evasive',
      text:"It isn't the drive, you know. It's pictures of pictures. But it's something nobody can put on a plane." },
  ],

  /* ---------- the forensic bench: Mr. Igbinosa (when Tobi did not survive) ---------- */
  m9_forensic_igbinosa: [
    { speaker:'MR. IGBINOSA',
      text:"Agent. Sit. Don't touch anything blue — the blue things on this bench cost more than my car." },
    { speaker:'MR. IGBINOSA',
      text:"There are three ways to read a drive. Two of them are fast. In nineteen years, nobody has ever accused me of fast." },
    { speaker:'MR. IGBINOSA',
      text:"One. A write-blocker: the drive may speak, but nobody may speak to it. I image it, hash both, and sign a section 84 certificate. Forty minutes." },
    { speaker:'MR. IGBINOSA',
      text:"Two. You push it into a laptop like a schoolboy with a music stick. Every access date says tonight, and defence counsel kisses you on both cheeks." },
    { speaker:'MR. IGBINOSA',
      text:"Three. You photograph the screen with your phone. Then you have photographs. Of a screen." },
    { speaker:'MR. IGBINOSA',
      text:"Your exhibit, Agent. Your choice. I'm paid the same either way.",
      choices:[
        { text:"Write-blocker and a full image. We do this properly.", tag:'lawful',
          effect:{ integrity:+2 }, flag:{ s2_method:'image' }, next:'m9_forensic_igbinosa_image' },
        { text:"Plug it in now. If someone comes for it before six, I want it read.", tag:'harsh',
          effect:{ integrity:-2 }, flag:{ s2_method:'direct' }, next:'m9_forensic_igbinosa_direct' },
        { text:"Scroll. I'll photograph every screen — nobody can put my phone on a plane.", tag:'savvy',
          effect:{ integrity:-1 }, flag:{ s2_method:'photo' }, next:'m9_forensic_igbinosa_photo' },
      ] },
  ],
  m9_forensic_igbinosa_image: [
    { speaker:'MR. IGBINOSA',
      text:"Correct. You may have tea. It is not good tea, but it is correct tea." },
    { speaker:'MR. IGBINOSA',
      text:"Forty minutes. The truth takes forty minutes. A lie takes five, and then it takes years." },
  ],
  m9_forensic_igbinosa_direct: [
    { speaker:'MR. IGBINOSA', mood:'evasive',
      text:"As you wish. — Twenty-three-seventeen. I'll put it in my notes, so the defence doesn't have to dig for it. They'll be grateful." },
    { speaker:'MR. IGBINOSA',
      text:"When they ask me in court, Agent, I'll answer. Slowly." },
  ],
  m9_forensic_igbinosa_photo: [
    { speaker:'MR. IGBINOSA',
      text:"Photographs. My late uncle photographed his television once, to prove he saw a goal. Nobody believed him either." },
    { speaker:'MR. IGBINOSA',
      text:"Hold the phone straight. I'll scroll." },
  ],

  /* ---------- the section 84 certificate (method 'image' only) ---------- */
  m9_cert_tobi: [
    { speaker:'TOBI',
      text:"Section 84 certificate. 'The workstation was in regular use and operating properly throughout. EX14.E01 is a true copy of exhibit 14.' Both hashes, in full." },
    { speaker:'TOBI', mood:'afraid',
      text:"My hand is shaking. The last time I signed anything, it was their books. In a warehouse in Asaba." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"This time your name is on the right side of the page." },
    { speaker:'TOBI', mood:'relieved',
      text:"Tobi Onuoha, 00:10. And I copied the hash wrong on my worksheet — two digits swapped. I've struck it through and initialled it. Better I say it than they find it." },
  ],
  m9_cert_igbinosa: [
    { speaker:'MR. IGBINOSA',
      text:"Section 84, subsection 4. 'I, Efosa Igbinosa, responsible for the operation of Workstation 2, certify that the computer was operating properly at all material times…'" },
    { speaker:'MR. IGBINOSA',
      text:"'…and that the image EX14.E01 is a true copy.' Every word of it true. That is why I can write it slowly." },
    { speaker:'MR. IGBINOSA',
      text:"Nineteen years, and not one of my certificates thrown out. Defence counsel in this state know my handwriting better than my wife does." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Then let's give them more of it to read." },
  ],

  /* ---------- after the ledger (optional: play after the m9_ledger document, before m9_dgo) ---------- */
  m9_ledger_tobi: [
    { speaker:'TOBI', mood:'afraid',
      text:"SPL-WSM-T4. Town, place, terminal — Sapele, Waterside Market, kiosk four. I used to write codes exactly like that for Ifeanyi's books." },
    { speaker:'TOBI',
      text:"Whoever built this learned from the same people I did. And Kelechi — a barge carries fifty times what Sapele cashes out. The rest has a bank account somewhere." },
  ],
  m9_ledger_igbinosa: [
    { speaker:'MR. IGBINOSA',
      text:"SPL: Sapele. WSM: Waterside Market. T4: kiosk four. My wife buys crayfish there. Thursday nights, she says, the POS boys run out of cash by ten." },
    { speaker:'MR. IGBINOSA',
      text:"Nine and a half million a run, in cash. A barge carries fifty times that. The rest is somewhere with a bank account, Agent. Money likes a roof." },
  ],

  /* ---------- D.G.O. ---------- */
  m9_dgo: [
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"C.A.: four point eight million on the tenth of every month. Just under the five-million cash limit. She was careful even with her bribes." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"D.G.O. isn't careful. Twenty-four million a quarter — on a second Friday, both times. Whoever that is doesn't need to be careful." },
    { speaker:'SGT. UCHE', portrait:'sergeant', mood:'evasive',
      text:"'Delta Gas Operations.' 'Divine Grace Oil' — my cousin in Onitsha has a shop called that. Sells palm oil." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Uche." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"I can read, sir. I'm just not saying it out loud in a government building at two in the morning." },
  ],

  /* ---------- 02:30, the Commander's desk phone ---------- */
  m9_call_kuti: [
    { speaker:'NACECA SYSTEM',
      text:"02:30. The phone on Commander Osagie's desk lights up. The display reads: NACECA HQ · DG OFFICE." },
    { speaker:'MR. KUTI',
      text:"Commander Osagie? …No. You'd be Agent Kelechi. How nice. Kuti, from the Director-General's office. Forgive the hour — the Director-General doesn't sleep, so neither do I." },
    { speaker:'MR. KUTI',
      text:"A small thing, for the transfer paperwork. Since exhibit 14 was sealed, has anyone accessed it? Anyone at all?",
      choices:[
        { text:"It has, sir. By me, tonight — on the Zonal Commander's authority.", tag:'lawful',
          effect:{ integrity:+3, agencyFavour:-2 }, flag:{ s2_abuja_call:'truth' }, next:'m9_call_kuti_truth' },
        { text:"Sealed, sir. Untouched.", tag:'harsh',
          effect:{ integrity:-4 }, flag:{ s2_abuja_call:'lie' }, next:'m9_call_kuti_lie' },
        { text:"You'll want Commander Osagie for that, sir.", tag:'savvy',
          flag:{ s2_abuja_call:'deflect' }, next:'m9_call_kuti_deflect' },
      ] },
  ],
  m9_call_kuti_truth: [
    { speaker:'MR. KUTI',
      text:"By you. Tonight. …Thank you, Agent. Candour is so rare at this hour." },
    { speaker:'MR. KUTI',
      text:"The Director-General will want to hear what you were looking for. I'm sure you'll tell him yourself. In person. Goodnight." },
  ],
  m9_call_kuti_lie: [
    { speaker:'MR. KUTI',
      text:"Sealed. Untouched. That's exactly what I hoped to hear, Agent." },
    { speaker:'MR. KUTI',
      text:"Sleep well. The escort will be with you before you know it." },
  ],
  /* the code plays this right after m9_call_kuti_lie when s2_custody === 'signed' */
  m9_call_kuti_caught: [
    { speaker:'NACECA SYSTEM',
      text:"The line doesn't go dead. You hear a page turn." },
    { speaker:'MR. KUTI',
      text:"Oh — one more thing. The register says otherwise, Agent. Twenty-three-oh-four, in your own hand. Goodnight." },
  ],
  m9_call_kuti_deflect: [
    { speaker:'MR. KUTI',
      text:"Of course. I'll try her at home. …Her daughters start school at seven-thirty, don't they? I won't keep her long." },
    { speaker:'NACECA SYSTEM',
      text:"The line goes dead. Somewhere in Benin, a phone is about to wake a Zonal Commander." },
  ],

  /* ---------- 05:10, the escort — Osagie will NOT back a retention order ---------- */
  m9_transfer: [
    { speaker:'NACECA SYSTEM',
      text:"05:10. Headlights in the yard, fifty minutes early: two pickups with Abuja plates. The Commander's office is dark." },
    { speaker:'ESCORT INSPECTOR',
      text:"Good morning, sir. Inspector Danjuma, HQ transfer team. Exhibit 14, the original, for the six o'clock. Mr. Kuti said you'd be expecting us." },
    { speaker:'ESCORT INSPECTOR', mood:'evasive',
      text:"I'm told there's no need for any copies, sir. Just the original." },
    { speaker:'SGT. UCHE', portrait:'sergeant', mood:'evasive',
      text:"They came early so nobody senior would be here to argue, sir. Nobody is.",
      choices:[
        { text:"Sign the register for it, Inspector. Time, name, seal number.", tag:'lawful',
          effect:{ agencyFavour:+3, integrity:+1 }, flag:{ s2_original:'handed' }, next:'m9_transfer_handed' },
        { text:"Take it. Safe flight, Inspector.", tag:'savvy',
          effect:{ agencyFavour:+3 }, flag:{ s2_original:'handed' }, next:'m9_transfer_handed' },
      ] },
  ],
  /* ---------- 05:10, the escort — Osagie backs him with a retention order ---------- */
  m9_transfer_backed: [
    { speaker:'NACECA SYSTEM',
      text:"05:10. Headlights in the yard, fifty minutes early. Commander Osagie is already on the steps, in yesterday's uniform." },
    { speaker:'ESCORT INSPECTOR',
      text:"Good morning, madam. Inspector Danjuma, HQ transfer team. Exhibit 14, the original, for the six o'clock flight." },
    { speaker:'COMMANDER OSAGIE',
      text:"Good morning, Inspector. Before you sign anything — a Zonal retention order. An exhibit in an active Zonal investigation stays in Benin." },
    { speaker:'ESCORT INSPECTOR', mood:'evasive',
      text:"Madam… my order is signed for the Director-General." },
    { speaker:'COMMANDER OSAGIE',
      text:"Yours is signed 'for' him. Mine is signed by me. Agent — it's your exhibit tonight. Say it so the Inspector can write it down.",
      choices:[
        { text:"Hand it over, ma. The order stands.", tag:'savvy',
          effect:{ agencyFavour:+3 }, flag:{ s2_original:'handed' }, next:'m9_transfer_handed' },
        { text:"It stays in Benin, Inspector. Under the Commander's retention order.", tag:'lawful',
          effect:{ agencyFavour:-4, integrity:+2 }, flag:{ s2_original:'kept' }, next:'m9_transfer_kept' },
      ] },
  ],
  m9_transfer_handed: [
    { speaker:'NACECA SYSTEM',
      text:"Sergeant Ikpe brings the bag up from the cage. The Inspector writes BZ-0447 on the transfer form in block capitals and doesn't look at anyone." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Did you see his hands, sir? He didn't want to be holding it either." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Whatever happens to that bag now, we know what was in it." },
  ],
  m9_transfer_kept: [
    { speaker:'NACECA SYSTEM',
      text:"The Inspector reads the order twice, photographs it, and makes a call from the yard. He leaves with an empty bag." },
    { speaker:'COMMANDER OSAGIE', mood:'evasive',
      text:"They'll answer this with a posting. Maiduguri, if I know them. I hear it's lovely in the harmattan." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Ma, I'm sorry—" },
    { speaker:'COMMANDER OSAGIE',
      text:"Don't be. I signed it. You only said it out loud." },
  ],

  /* ---------- dawn on the steps ---------- */
  m9_end: [
    { speaker:'NACECA SYSTEM',
      text:"06:02. Benin wakes up: okadas on Sapele Road, a radio playing highlife, the six o'clock flight climbing out towards Abuja." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"One night. One ledger. One phone call from the ninth floor. I've had quieter years, sir." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"SPL-WSM-T4. Sapele, waterside market, terminal four — it has to be. And every T4 cash-out in that book lands on a Thursday." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"It's Wednesday, sir. If that barge kept her Tuesdays, Sapele pays out tomorrow night." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Then tomorrow night we're in Sapele." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Plain clothes, sir. Something you haven't ironed. I'll be checking." },
  ],
});

/* ======================================================================
   CASE 10 · THE NIGHT MARKET — DELTA · SAPELE WATERSIDE NIGHT MARKET, 20:30
   ====================================================================== */
Object.assign(DIALOGUE, {

  /* m10_intro works for every save; m10_intro_tobi / m10_intro_igbinosa are
     the same scene with a personal text — use them if you pick by asaba */
  m10_intro: [
    { speaker:'NACECA SYSTEM',
      text:"Thursday, 20:30. Sapele Waterside Night Market: generators, frying fish, and a gospel song fighting a highlife song from two speakers." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"The parrot shirt. Good. Nobody has ever suspected a man in parrots — but untuck it, sir. Nobody in Sapele tucks in after six." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Buy something. Eat something. And don't stare at the POS. In a market only two kinds of people stare at money: thieves and police." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"And sergeants?" },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Sergeants are invisible, sir. It's our gift." },
    { speaker:'TEXT · ZONAL FORENSICS',
      text:"SPL-WSM-T4 = market permit for kiosk 4, Sapele Waterside — blue board, beside an herb stall. Thursdays it pays out more than the bank on the corner. Be careful." },
  ],
  m10_intro_tobi: [
    { speaker:'NACECA SYSTEM',
      text:"Thursday, 20:30. Sapele Waterside Night Market: generators, frying fish, and a gospel song fighting a highlife song from two speakers." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"The parrot shirt. Good. Nobody has ever suspected a man in parrots — but untuck it, sir. Nobody in Sapele tucks in after six." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Buy something. Eat something. And don't stare at the POS. In a market only two kinds of people stare at money: thieves and police." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"And sergeants?" },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Sergeants are invisible, sir. It's our gift." },
    { speaker:'TEXT · TOBI',
      text:"SPL-WSM-T4 is the market's permit for kiosk 4 — blue board, next to an herb stall. Thursdays it pays out more than a bank branch. Please be careful. Please. — T." },
  ],
  m10_intro_igbinosa: [
    { speaker:'NACECA SYSTEM',
      text:"Thursday, 20:30. Sapele Waterside Night Market: generators, frying fish, and a gospel song fighting a highlife song from two speakers." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"The parrot shirt. Good. Nobody has ever suspected a man in parrots — but untuck it, sir. Nobody in Sapele tucks in after six." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Buy something. Eat something. And don't stare at the POS. In a market only two kinds of people stare at money: thieves and police." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"And sergeants?" },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Sergeants are invisible, sir. It's our gift." },
    { speaker:'TEXT · MR. IGBINOSA',
      text:"T4 is kiosk 4: blue board, beside the herb stall. My wife says the bole at the far end of the market is excellent. Do not get shot before you try it. — Igbinosa" },
  ],

  /* ---------- Mama Karo's stall ---------- */
  m10_karo: [
    { speaker:'MAMA KARO',
      text:"Three times you've passed my stall, young man. Your eyes have priced everything on it except the woman selling it.",
      choices:[
        { text:"Migwo, Mama.", tag:'kind', next:'m10_karo_trust' },
        { text:"Good evening, madam. NACECA.", tag:'lawful', next:'m10_karo_cold' },
        { text:"How much for the bitter leaf?", tag:'savvy', next:'m10_karo_customer' },
      ] },
  ],
  m10_karo_trust: [
    { speaker:'MAMA KARO', mood:'relieved',
      text:"Vrendo, my son! Vrendo. Ah — who taught a Lagos boy to greet like he was born on this river?" },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"A sergeant in a parked car, ma. He made me practise it four times." },
    { speaker:'MAMA KARO',
      text:"A sergeant. So you're police. Don't worry — my bitter leaf has kept bigger secrets than yours." },
    { speaker:'MAMA KARO',
      text:"Forty years at this stall. Bitter leaf, uda, scent leaf, the root my mother gave for fever before Sapele had one pharmacy. Nobody has left my stall worse than they came." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"The blue kiosk beside you, ma. T4. Who runs it?" },
    { speaker:'MAMA KARO', mood:'evasive',
      text:"My sister's son. Ejiro. A good boy — too good. He has never learnt how to say no to anybody." },
    { speaker:'MAMA KARO', mood:'afraid',
      text:"Every Thursday a changer comes with sacks. Big voice, gold watch, 'Lucky' this, 'Lucky' that. Since that man started coming, Ejiro doesn't sleep.",
      choices:[
        { text:"Then let me be the one who helps him sleep again, Mama.", tag:'kind',
          effect:{ publicTrust:+3 }, flag:{ s2_karo:'trust' }, next:'m10_karo_trust_yes' },
        { text:"If Ejiro is helping a launderer, ma, he'll answer for it.", tag:'harsh',
          flag:{ s2_karo:'neutral' }, next:'m10_karo_trust_no' },
      ] },
  ],
  m10_karo_trust_yes: [
    { speaker:'MAMA KARO',
      text:"We shall see, my son. Words are cheap in a market. Bitter leaf is five hundred." },
  ],
  m10_karo_trust_no: [
    { speaker:'MAMA KARO', mood:'angry',
      text:"Hm. So the greeting was a key, not a greeting. Buy your bitter leaf, officer." },
  ],
  m10_karo_cold: [
    { speaker:'MAMA KARO', mood:'angry',
      text:"NACECA. This is a market, officer, not a police station. Here, people say good evening before they say their office." },
    { speaker:'MAMA KARO', mood:'angry',
      text:"Forty years I've sold here. I've paid every levy, every ticket, every 'settlement' your colleagues invented. What do you want with an old woman's leaves?" },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Only a few questions about the kiosk beside you, ma." },
    { speaker:'MAMA KARO', mood:'evasive',
      text:"I sell herbs. I don't count other people's money.",
      choices:[
        { text:"Forgive me, ma. I came into your market the wrong way.", tag:'kind',
          effect:{ publicTrust:+1 }, flag:{ s2_karo:'neutral' }, next:'m10_karo_cold_soft' },
        { text:"Then I'll find out without you.", tag:'harsh',
          effect:{ publicTrust:-2, heat:+2 }, flag:{ s2_karo:'cold' }, next:'m10_karo_cold_hard' },
      ] },
  ],
  m10_karo_cold_soft: [
    { speaker:'MAMA KARO',
      text:"Hm. At least somebody taught you to apologise. The blue one, T4, is the one by my stall. That's all I know, and all I'll ever know." },
  ],
  m10_karo_cold_hard: [
    { speaker:'MAMA KARO', mood:'angry',
      text:"Find it, then. And walk quietly, officer — the whole lane is watching you not look at the POS." },
  ],
  m10_karo_customer: [
    { speaker:'MAMA KARO',
      text:"Five hundred a bunch. Washed, eight hundred — I squeeze the bitterness out for you, like a good mother-in-law." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Washed, then. Two bunches." },
    { speaker:'MAMA KARO', mood:'evasive',
      text:"You don't cook. A man who cooks banga asks me for oburunbebe stick in the same breath." },
    { speaker:'MAMA KARO',
      text:"And you keep looking at that blue kiosk like it owes you money." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Which one is T4, ma?" },
    { speaker:'MAMA KARO',
      text:"The one by my stall. Everybody knows that. One thousand six hundred — your change is four hundred.",
      choices:[
        { text:"Keep the change, Mama. I'll be back for the oburunbebe stick.", tag:'savvy',
          flag:{ s2_karo:'neutral' }, next:'m10_karo_customer_end' },
        { text:"NACECA, ma. Who uses that kiosk on Thursdays?", tag:'harsh',
          effect:{ publicTrust:-1 }, flag:{ s2_karo:'cold' }, next:'m10_karo_customer_badge' },
      ] },
  ],
  m10_karo_customer_end: [
    { speaker:'MAMA KARO',
      text:"Come back with a real question next time, and maybe you'll get a real answer." },
  ],
  m10_karo_customer_badge: [
    { speaker:'MAMA KARO', mood:'angry',
      text:"Ah. So the bitter leaf was a costume. Take your leaves, officer. My answers are not for sale." },
  ],
  /* trust only — choice 0 = accept (source HERBS), choice 1 = decline */
  m10_karo_source: [
    { speaker:'MAMA KARO',
      text:"Listen to me. My eyes are old, but from six in the evening till midnight they're open, and nothing moves on this lane that this stall doesn't see." },
    { speaker:'MAMA KARO',
      text:"If you need me, come and buy bitter leaf. Only bitter leaf. Buy anything else, and I don't know you.",
      choices:[
        { text:"Bitter leaf, then. Every time.", tag:'kind', next:'m10_karo_source_yes' },
        { text:"No, Mama. I won't put you in this.", tag:'lawful', next:'m10_karo_source_no' },
      ] },
  ],
  m10_karo_source_yes: [
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"In my notebook you'll be 'Herbs'. No name, no stall, no lane." },
    { speaker:'MAMA KARO', mood:'relieved',
      text:"Herbs. My late husband called me worse. Go, my son. Your sergeant is pretending to buy a phone charger for the third time." },
  ],
  m10_karo_source_no: [
    { speaker:'MAMA KARO',
      text:"Hm. A police officer who says no to free eyes. My mother would have liked you." },
    { speaker:'MAMA KARO',
      text:"The offer stays on the stall like my leaves, my son. It doesn't spoil quickly." },
  ],

  /* ---------- the four POS kiosks ---------- */
  m10_sticker_t1: [
    { speaker:'NACECA SYSTEM',
      text:"Yellow board. The market permit on the post reads SPL-WSM-T1. Not the kiosk in the ledger." },
  ],
  m10_sticker_t2: [
    { speaker:'NACECA SYSTEM',
      text:"Green board, a queue of three. Permit SPL-WSM-T2. Close — but the ledger says T4." },
  ],
  m10_sticker_t3: [
    { speaker:'NACECA SYSTEM',
      text:"Red board, shutter half down. The permit's been scratched, but the end still reads …-T3. Not this one." },
  ],
  m10_sticker_t4: [
    { speaker:'NACECA SYSTEM',
      text:"Blue board, beside the herb stall. Permit SPL-WSM-T4 — the code from the ledger." },
    { speaker:'NACECA SYSTEM',
      text:"Four POS machines on one table, four providers' colours. The boy behind them can't be more than twenty-two. A name is painted on the cash box: EJIRO." },
  ],

  /* ---------- the market: two innocent decoys and dinner ---------- */
  m10_esusu: [
    { speaker:'MAMA ESUSU · THRIFT COLLECTOR', portrait:'street:esusu',
      text:"Two hundred, five hundred, one thousand… Mama Oke, your card! You miss Tuesday o — I no go carry your matter for my head!",
      textEn:"Two hundred, five hundred, one thousand… Mama Oke, your card! You missed Tuesday — I won't carry your problem for you!" },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"That's a lot of cash for one bag, ma." },
    { speaker:'MAMA ESUSU · THRIFT COLLECTOR', portrait:'street:esusu',
      text:"Na market women money. Every day dem save small small; month end, each woman collect her own. My fee na one day contribution. I dey deposit am for T1 every night.",
      textEn:"It's the market women's money. Every day they save a little; at month's end each woman collects her own. My fee is one day's contribution. I deposit it at T1 every night." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"(Every naira with a name beside it — and it goes into the bank, not out of it.)" },
  ],
  m10_fuel: [
    { speaker:'OGAGA · FUEL SELLER', portrait:'street:fuel',
      text:"Kero! Two-stroke! Petrol for engine! …Oga, you get boat? No? Then why you dey look my money like say e owe you?",
      textEn:"Kerosene! Two-stroke! Petrol for engines! …Sir, have you got a boat? No? Then why are you looking at my money like it owes you?" },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Thick bundle, for kerosene." },
    { speaker:'OGAGA · FUEL SELLER', portrait:'street:fuel',
      text:"Every boat for this waterside dey buy from me, cash. I dey pay depot cash. See receipt — stamp and signature. My papa sell for this same spot before me.",
      textEn:"Every boat on this waterside buys from me, in cash. I pay the depot in cash. Look at the receipts — stamped and signed. My father sold on this same spot before me." },
    { speaker:'OGAGA · FUEL SELLER', portrait:'street:fuel',
      text:"Kpo-fire? Me? That one dey kill engine. Shake am, e go foam like palm wine, then sand go settle for bottom. Ask any boatman.",
      textEn:"Bush-refined fuel? Me? That stuff kills engines. Shake it and it foams like palm wine, then grit settles at the bottom. Ask any boatman." },
  ],
  m10_buka: [
    { speaker:'MAMA EFE · BUKA', portrait:'street:buka',
      text:"Bole and fish? Pepper soup? You get the face of man wey never chop since morning.",
      textEn:"Roast plantain and fish? Pepper soup? You've got the face of a man who hasn't eaten since morning." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Bole and fish, two. And pepper soup for my friend by the charging stand — he's shy." },
    { speaker:'MAMA EFE · BUKA', portrait:'street:buka',
      text:"Shy man no dey watch POS like hawk. Seven thousand five hundred. Siddon, make dem no think say una be police.",
      textEn:"A shy man doesn't watch the POS like a hawk. Seven thousand five hundred. Sit down, so nobody thinks you're police." },
  ],

  /* ---------- he comes ---------- */
  m10_lucky_arrives: [
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Road side. Blue kaftan, gold watch, two rice sacks on a wheelbarrow boy's head. He's greeting the whole market like he's running for councillor." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Straight for the blue kiosk. Don't look up, sir. Look at your phone like you're losing at football." },
  ],
  m10_obs_cashouts: [
    { speaker:'NACECA SYSTEM',
      text:"Four withdrawals, back to back — each one just under the limit." },
  ],
  m10_obs_cards: [
    { speaker:'NACECA SYSTEM',
      text:"A different card every time — and a different name on each." },
  ],
  m10_obs_boat: [
    { speaker:'NACECA SYSTEM',
      text:"He hands two bags to a boatman at the jetty. The rice sack stays on his shoulder." },
  ],
});

Object.assign(DIALOGUE, {

  /* ---------- T4, after the cash-outs: Lucky waits on the jetty steps ---------- */
  m10_ejiro: [
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"He's sitting on the jetty steps with the sack, waiting on a boat. You've got minutes, sir, not an hour." },
    { speaker:'EJIRO', mood:'afraid',
      text:"Oga, abeg — I no sabi am like that. Him dey come Thursday, him swipe, I count. Him dey give me forty thousand. Na all.",
      textEn:"Sir, please — I don't really know him. He comes on Thursdays, he swipes, I count. He gives me forty thousand. That's all." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Four machines, four agent IDs. Whose names are they in, Ejiro?" },
    { speaker:'EJIRO', mood:'afraid',
      text:"…My mama. My sister. My cousin for Warri. And me. Na him buy three of the machines. Him say na business.",
      textEn:"…My mother. My sister. My cousin in Warri. And me. He bought three of the machines. He said it was business." },
    { speaker:'EJIRO', mood:'afraid',
      text:"If him know say I talk, oga… Lucky get boys for this waterside. My aunty stall dey right there.",
      textEn:"If he finds out I talked, sir… Lucky has boys on this waterside. My aunt's stall is right there.",
      choices:[
        { text:"Keep your terminal open, Ejiro, and tell me when he comes.", tag:'savvy',
          effect:{ intel:+2 }, flag:{ s2_ejiro:'source' }, next:'m10_ejiro_source' },
        { text:"Ejiro, you're under arrest.", tag:'lawful',
          effect:{ publicTrust:-1 }, flag:{ s2_ejiro:'arrested' }, next:'m10_ejiro_arrested' },
        { text:"Close early tonight. Go home.", tag:'kind',
          flag:{ s2_ejiro:'left' }, next:'m10_ejiro_left' },
      ] },
  ],
  m10_ejiro_source: [
    { speaker:'EJIRO', mood:'relieved',
      text:"…Okay. Okay, oga. I go do am.",
      textEn:"…Okay. Okay, sir. I'll do it." },
    { speaker:'EJIRO',
      text:"Make I print the history for you — all four machines, from March. Na March him first come.",
      textEn:"Let me print the history for you — all four machines, from March. March is when he first came." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Sign and date the back of every page. Then it's the machines telling the story, not you." },
  ],
  m10_ejiro_arrested: [
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Ejiro, you're under arrest for helping to launder those cash-outs. You can stay silent until you've seen a lawyer, and Legal Aid will give you one free." },
    { speaker:'EJIRO', mood:'afraid',
      text:"Aunty! Aunty Karo!" },
    { speaker:'NACECA SYSTEM',
      text:"Across the lane, an old woman stands up behind her herb stall. On the jetty steps, a man with a sack turns his head towards the noise." },
  ],
  m10_ejiro_left: [
    { speaker:'EJIRO', mood:'relieved',
      text:"Close? Now? …Oga, thank you. God bless you.",
      textEn:"Close? Now? …Sir, thank you. God bless you." },
    { speaker:'NACECA SYSTEM',
      text:"The shutter comes down on T4. Ejiro walks towards the road fast, without looking back — and without his phone charger." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"(Next Thursday he'll open again. So will Lucky's cards — unless we finish this.)" },
  ],

  /* ---------- the jetty: the code runs the arrest, the chase or the tail ---------- */
  m10_jetty: [
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Two bags into the boat. The sack's still on his shoulder. Boatman's untying the rope." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"If that engine starts, the money goes up the Ethiope and we're two men standing on a jetty. Your call, sir.",
      choices:[
        { text:"Take Lucky. Let the boat go.", tag:'lawful',
          flag:{ s2_jetty:'lucky' } },
        { text:"Take them both.", tag:'harsh',
          effect:{ heat:+6 }, flag:{ s2_jetty:'both' } },
        { text:"Let them go. We follow the money.", tag:'savvy',
          effect:{ intel:+1 }, flag:{ s2_jetty:'follow' } },
      ] },
  ],

  /* ---------- the arrest (after 'lucky' or 'both', or after m10_caught) — ACJA s.6 ---------- */
  m10_arrest: [
    { speaker:'LUCKY EDAFE', mood:'angry',
      text:"Ehn! Wetin be this? Una know who una hold so? Lucky Edafe! Ask anybody from Sapele reach Warri!",
      textEn:"Hey! What is this? Do you know who you've just grabbed? Lucky Edafe! Ask anyone from Sapele to Warri!" },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Ninety-six bundles of a hundred thousand, POS slips under every rubber band. Nine million, six hundred thousand naira, sir. In a rice sack." },
    { speaker:'LUCKY EDAFE', mood:'evasive',
      text:"Oga officer, na fuel money. Clean money! And if one or two bundle fall for road… who go know?",
      textEn:"Officer, it's fuel money. Clean money! And if one or two bundles fell off along the way… who would know?" },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Lucky Edafe, you're under arrest for money laundering — cashing out and moving money that came from stolen crude." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"You can stay silent until you've spoken to a lawyer. Get one of your choice, or Legal Aid will give you one free. We'll tell your family where you are." },
    { speaker:'LUCKY EDAFE',
      text:"Write am well o, officer. Na you go read am for court.",
      textEn:"Write it down properly, officer. You're the one who'll be reading it out in court." },
  ],
  /* only after 'both' */
  m10_boatman: [
    { speaker:'BOATMAN', mood:'afraid',
      text:"Oga, I be boat driver! Dem pay me twenty thousand to carry bag. Na camp boys salary — I no open am!",
      textEn:"Sir, I just drive the boat! They pay me twenty thousand to carry bags. It's the camp boys' wages — I don't open them!" },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Carry them where?" },
    { speaker:'BOATMAN',
      text:"Up the Ethiope. Pass the second bend, Ekre side. One man go flash torch three times from the bank.",
      textEn:"Up the Ethiope. Past the second bend, Ekre side. A man flashes a torch three times from the bank." },
    { speaker:'BOATMAN', mood:'evasive',
      text:"But oga… if I no reach by two o'clock, dem go know. The camp go hear before morning.",
      textEn:"But sir… if I'm not there by two o'clock, they'll know. The camp will hear before morning." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Then we're on their clock now, sir. Not ours." },
  ],

  /* ---------- Lucky's statement ---------- */
  m10_statement_choice: [
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"He's in the back of the car, sweating through that kaftan. Tonight he'd tell us his grandmother's PIN." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Tomorrow he'll have a lawyer who says everything for him. How do you want his statement, sir?",
      choices:[
        { text:"Area Command. Camera on, and get him a lawyer.", tag:'lawful',
          effect:{ integrity:+3 }, flag:{ s2_statement:'proper' }, next:'m10_statement_proper' },
        { text:"Here, in the car, while he's scared.", tag:'savvy',
          effect:{ integrity:-2 }, flag:{ s2_statement:'car' }, next:'m10_statement_car' },
        { text:"Uche — show him what happens to people who lie to us.", tag:'harsh',
          effect:{ integrity:-6, heat:+3 }, flag:{ s2_statement:'threat' }, next:'m10_statement_threat' },
      ] },
  ],
  /* recorded on video (ACJA s.15(4)) with a Legal Aid lawyer present (s.17(2)) */
  m10_statement_proper: [
    { speaker:'NACECA SYSTEM',
      text:"Sapele Area Command, 01:40. Interview room. Camera on, red light steady. Barr. Ese Omoregie of the Legal Aid Council sits beside the suspect." },
    { speaker:'LEGAL AID LAWYER',
      text:"For the record: this statement is on camera and I am present for the suspect — sections 15(4) and 17(2). We've spoken privately. He'll answer what he chooses." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Mr. Edafe, you're not obliged to say anything unless you wish to, but whatever you say will be written down and may be given in evidence." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Four cards at T4 tonight. Four names. One BVN — yours." },
    { speaker:'LUCKY EDAFE', mood:'evasive',
      text:"Yes, I withdraw am. Na my customers own — fuel business. Dem pay me transfer, I change am to cash. Sapele no get enough bank.",
      textEn:"Yes, I withdrew it. It's my customers' money — fuel business. They pay me by transfer, I turn it into cash. Sapele hasn't got enough banks." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"And the boat. Who were the bags for?" },
    { speaker:'LUCKY EDAFE', mood:'evasive',
      text:"No comment." },
    { speaker:'LEGAL AID LAWYER',
      text:"My client has answered what he chooses to answer, Agent." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"He gave us the money and kept everything else, sir. Slower." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"But it holds." },
  ],
  /* a great lead that will not stand up in court (no video, no lawyer) */
  m10_statement_car: [
    { speaker:'NACECA SYSTEM',
      text:"The car. Doors shut, engine running for the air-conditioning. No camera. No lawyer." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"The bags in the boat, Lucky. Who were they for?" },
    { speaker:'LUCKY EDAFE', mood:'afraid',
      text:"Oga Felix for the creek. Ekre side. Na him get the camp. Riverstone people dey pay — me, I just dey change am to cash.",
      textEn:"Oga Felix, in the creek. Ekre side. The camp is his. The Riverstone people pay — I just turn it into cash." },
    { speaker:'LUCKY EDAFE', mood:'evasive',
      text:"But if you write my name for paper, I go deny am. I never talk anything for this car.",
      textEn:"But if you put my name on paper, I'll deny it. I never said anything in this car." },
    { speaker:'SGT. UCHE', portrait:'sergeant', mood:'evasive',
      text:"Felix. Ekre side. Riverstone. Good leads, sir. But no camera, no lawyer — in court, that's a story we heard in a car." },
  ],
  /* oppression: it will be excluded (Evidence Act s.29) */
  m10_statement_threat: [
    { speaker:'SGT. UCHE', portrait:'sergeant', mood:'angry',
      text:"…Yes, sir." },
    { speaker:'NACECA SYSTEM',
      text:"Uche opens the back door, leans in, and says something very quietly. He doesn't touch Lucky. He doesn't have to." },
    { speaker:'LUCKY EDAFE', mood:'afraid',
      text:"Okay! Okay! Felix — for the creek, Ekre side! Riverstone people dey pay! Abeg, abeg, make him no touch me!",
      textEn:"Okay! Okay! Felix — in the creek, Ekre side! The Riverstone people pay! Please, please, don't let him touch me!" },
    { speaker:'SGT. UCHE', portrait:'sergeant', mood:'angry',
      text:"Twenty years in uniform, sir, and I've never had to do that. I'd like to finish my career without doing it again." },
    { speaker:'AGENT KELECHI', portrait:'kelechi', mood:'evasive',
      text:"(Evidence Act, section 29: a threat is oppression, and oppression kills a confession. Every word of that is already dead.)" },
  ],

  /* ---------- 'follow': the boat goes, Lucky is lifted in Warri two days later (off-screen) ---------- */
  m10_follow: [
    { speaker:'NACECA SYSTEM',
      text:"The engine coughs, catches, and the boat slides out past the last lamp. No lights. Just the sound, going upriver." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Ekre side, or Oko side. Past the first bend, it could be either." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"And Lucky?" },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Lucky goes home thinking he's lucky. A man with four bank cards doesn't leave town. Warri will lift him when we say." },
  ],

  /* ---------- the market makes them: a chase ---------- */
  m10_made: [
    { speaker:'SGT. UCHE', portrait:'sergeant', mood:'afraid',
      text:"Sir — the kaftan. He looked at you, then at me, then at you again. He's made us." },
    { speaker:'NACECA SYSTEM',
      text:"Somebody whistles two notes down the lane. Lucky drops a sack and runs." },
    { speaker:'AGENT KELECHI', portrait:'kelechi', mood:'angry',
      text:"NACECA! Stop!" },
  ],
  m10_caught: [
    { speaker:'LUCKY EDAFE', mood:'afraid',
      text:"Okay! Okay! I no dey run again! Na exercise I dey do — doctor talk say make I dey jog!",
      textEn:"Okay! Okay! I'm not running any more! I was exercising — my doctor told me to jog!" },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Your doctor will be pleased. You left your weights behind." },
  ],

  /* ---------- midnight ---------- */
  m10_end: [
    { speaker:'NACECA SYSTEM',
      text:"Midnight. The market folds itself away: shutters, tarps, the buka generator coughing out. One lamp still burns — the herb stall's." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"She's still there. Sixty-something, and she outlasts every generator on this lane." },
    { speaker:'NACECA SYSTEM',
      text:"Out on the river an outboard starts. No lights. The sound goes upriver and doesn't come back." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Somebody's going to tell somebody something tonight." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Then we go where the sound went. Black water, a barge called TEKENA 2, and whoever's waiting at the end of it." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"I'm forty-six, sir, and I never learnt to swim. Tomorrow I'll be learning very fast." },
  ],
});

/* ======================================================================
   DOCUMENTS — "tap the line that proves it"
   m9_hash: play only after s2_method === 'image' (there is no image otherwise).
   ====================================================================== */
Object.assign(PUZZLES, {
  m9_hash: {
    title:'HASH CHECK · EXHIBIT 14',
    screen:
`<span class="label">[ BENIN ZONAL · FORENSIC BENCH 2 · WRITE-BLOCKER: READ-ONLY ]</span>
<span class="label">[ EXHIBIT 14 · 16 GB USB drive · bag seal BZ-0447 ]</span>

TIME   WHAT WAS HASHED                     ALGO     READOUT
──────────────────────────────────────────────────────────────────
21:58  Exhibit 31 (Ekpoma phone) · image   SHA-256  5421db21473f…9c11e9ef3802
23:19  EX14_try1.E01 · <span class="red">aborted at 61%</span>      SHA-256  280dd5829ccf…39eb0995fddd
23:27  EX14 source drive · before imaging  SHA-256  1e1d6d411699…99a2d003fd49
23:49  EX14.E01 image · <span class="green">verify pass</span>        SHA-256  1e1d6d411699…99a2d003fd49
23:49  EX14.E01 image · <span class="green">verify pass</span>        MD5      53e794519737…f87e8b5567ed
23:56  EX14 source drive · after imaging   SHA-256  1e1d6d411699…99a2d003fd49
00:03  Bench worksheet (copied by hand)    SHA-256  1e1d6d411699…99a2d003f4d9
`,
    prompt:`Which two readouts prove the image is a <b>true copy</b> of exhibit 14? Compare like with like, and read every character you can see.`,
    options:[
      { text:'Source drive and verified image: the same SHA-256. A true copy.', hint:'Same algorithm, every visible character the same, read by the machine from both ends. That is what "verified" means.', correct:true },
      { text:'Verified image and the bench worksheet: they match.', hint:'Read to the very end: …fd49 against …f4d9. A hand-copied hash is a note, not proof.', correct:false },
      { text:'The image\'s SHA-256 and its MD5 differ, so the image is corrupt.', hint:'Two different algorithms always give two different strings. Compare like with like.', correct:false },
      { text:'Source drive and attempt 1: same drive, so the same hash.', hint:'Attempt 1 died at 61 percent. Part of an image hashes to a completely different number.', correct:false },
    ],
    onCorrect:{ intel:+18, integrity:+3, agencyFavour:+2, evidenceId:'drive_image', evidenceName:'Forensic image of exhibit 14', xp:100 },
    onWrong:{ integrity:-1 },
    toastWrongTitle:'NO MATCH',
    toastWrong:'Compare like with like — and read each hash to the last character.'
  },

  m9_ledger: {
    title:'EXHIBIT 14 · SHEET "UPSTREAM"',
    screen:
`<span class="label">[ EXHIBIT 14 · hidden folder \\PAYROLL\\_old · u.xlsx · sheet “UPSTREAM” ]</span>
<span class="label">[ last saved 12 Sep 2026 · 13 rows shown ]</span>

DATE         ENTRY                                   AMOUNT
──────────────────────────────────────────────────────────────────
Fri 12 Jun   D.G.O. — quarterly · paid by R.M.S.     − ₦24,000,000
Tue 07 Jul   TEKENA 2 — sailed (Ethiope) · 640,000 L AGO
Thu 09 Jul   SPL-WSM-T4 — cash-out                   + ₦9,560,000
Fri 10 Jul   C.A. — monthly · paid by R.M.S.         − ₦4,800,000
Tue 21 Jul   TEKENA 2 — sailed (Ethiope) · 610,000 L AGO
Thu 23 Jul   SPL-WSM-T4 — cash-out                   + ₦9,520,000
Tue 04 Aug   TEKENA 2 — sailed (Ethiope) · 655,000 L AGO
Thu 06 Aug   SPL-WSM-T4 — cash-out                   + ₦9,580,000
Mon 10 Aug   C.A. — monthly · paid by R.M.S.         − ₦4,800,000
Tue 01 Sep   TEKENA 2 — sailed (Ethiope) · 645,000 L AGO
Thu 03 Sep   SPL-WSM-T4 — cash-out                   + ₦9,600,000
Thu 10 Sep   C.A. — monthly · paid by R.M.S.         − ₦4,800,000
Fri 11 Sep   D.G.O. — quarterly · paid by R.M.S.     − ₦24,000,000
Cell comment, A1: <span class="red">"EKO money stays OUT of this book."</span>
`,
    prompt:`Where does Upstream's money <b>come from</b>? Read which way each line moves money, and what happens two days before it arrives.`,
    options:[
      { text:'Ransom calls — Ekosodin money, moved into a new book', hint:'The cell comment keeps Ekosodin out of this book. And nothing here arrives after a ransom call — it arrives after a barge.', correct:false },
      { text:'Crude sold off TEKENA 2, cashed out in Sapele', hint:'Every sailing is followed, two days later, by a cash-out at SPL-WSM-T4. The money follows the boat.', correct:true },
      { text:'Diverted agency salaries', hint:'C.A. and D.G.O. are paid out of this book, not into it. Salaries do not arrive two days after a barge sails.', correct:false },
    ],
    onCorrect:{ intel:+26, integrity:+2, agencyFavour:+3, evidenceId:'upstream_ledger', evidenceName:'The UPSTREAM ledger', xp:130 },
    onWrong:{ integrity:-1 },
    toastWrongTitle:'IT DOESN\'T ADD UP',
    toastWrong:'Which way does the money move — and what happens two days before it arrives?'
  },

  m10_who: {
    title:'WHO IS THE CHANGER?',
    screen:
`<span class="label">[ FORENSIC DESK, BENIN ZONAL → AGENT KELECHI · 22:07 ]</span>
<span class="label">[ SPL-WSM-T4 · 4 machines, 4 agent IDs · cap ₦1.2m per agent per day ]</span>

T4 PAY-OUTS TONIGHT
──────────────────────────────────────────────────────────────────
21:52  machine 1  card ••5531  OKORO B.   ₦1,195,000
21:53  machine 2  card ••2290  ATUFE G.   ₦1,195,000
21:55  machine 3  card ••7714  IMAH P.    ₦1,195,000
21:56  machine 4  card ••3308  OGBE S.    ₦1,195,000
BVN CHECK  all four accounts → 22•••••4471 → EDAFE, LUCKY O.

YOUR NOTES
──────────────────────────────────────────────────────────────────
Blue kaftan, two sacks: four cards, back to back, each just under the cap
Esusu woman: 212 names in her book, ₦200–₦2,000 each — paid IN at T1
Fuel seller: thick bundles, each one clipped to a stamped depot receipt
T4 boy: hands shaking — pockets ₦40,000 when the kaftan leaves
`,
    prompt:`Who is the <b>changer</b> turning Upstream's money into cash? Whose money is it on paper, and who is keeping under the cap?`,
    options:[
      { text:'The man in the blue kaftan — Lucky Edafe', hint:'Four cards in four names, one BVN — his. And every withdrawal stops just under the cap.', correct:true },
      { text:'Mama Esusu, the thrift collector', hint:'Hundreds of names, small sums, and the cash goes in at T1. That is saving, not changing.', correct:false },
      { text:'Ogaga, the fuel seller', hint:'Thick bundles — but every one is clipped to a stamped depot receipt.', correct:false },
      { text:'Ejiro, the boy at T4', hint:'He takes a cut, and he will answer for that. But the cards and the BVN belong to someone else.', correct:false },
    ],
    onCorrect:{ intel:+22, integrity:+2, agencyFavour:+3, evidenceId:'bvn_link', evidenceName:'Four accounts, one BVN', xp:110 },
    onWrong:{ integrity:-1 },
    toastWrongTitle:'WRONG MAN',
    toastWrong:'Whose money is it on paper — and who is keeping under the cap?'
  },
});

Object.assign(V12.DOCS, {
  m9_hash: {
    ask:'Which two readouts prove the image is a <b>true copy</b> of exhibit 14? Pick the pair, then tap a readout that proves it.',
    proof:['99a2d003fd49'],
    look:['99a2d003fd49', '99a2d003f4d9', 'MD5', 'aborted'],
    fail:{ mode:'continue', note:'You sign off without a clean comparison. The image exists, but the defence will ask why nobody matched the hashes.', effect:{ integrity:-1 } },
  },
  m9_ledger: {
    ask:'Where does Upstream\'s money <b>come from</b>? Pick the source, then tap a line that proves it.',
    proof:['TEKENA 2', 'SPL-WSM-T4'],
    look:['TEKENA 2', 'SPL-WSM-T4', 'C.A.', 'D.G.O.', 'EKO money'],
    fail:{ mode:'continue', note:'You file the sheet without reading its rhythm. It is on the record — but you will learn about the barge the slow way.', effect:{ agencyFavour:-1 } },
  },
  m10_who: {
    ask:'Who is the <b>changer</b> turning Upstream\'s money into cash? Pick him, then tap the line that proves it.',
    proof:['LUCKY O.', '1,195,000', 'just under'],
    look:['LUCKY O.', '1,195,000', 'just under', 'paid IN', 'depot receipt', 'pockets'],
    fail:{ mode:'continue', note:'You follow the sacks on instinct. The BVN check goes in the file, but you can\'t yet say why it matters.', effect:{ agencyFavour:-1 } },
  },
});

/* ======================================================================
   AFTERMATH — headline(state) accepts S, S.game, or nothing
   ====================================================================== */
V13.AFTER = Object.assign(V13.AFTER || {}, {
  m9:{
    headline:(st)=>{
      const m = MC(st);
      if(m.s2_original === 'kept') return { pub:'THE LAGOS LEDGER',
        head:'Benin Zonal refuses HQ order, keeps Ekosodin flash drive',
        ded:'A retention order signed at dawn kept "exhibit 14" in Benin. NACECA headquarters called it "an internal administrative matter".' };
      if(m.finale === 'contested') return { pub:'NATIONAL DISPATCH',
        head:'Key exhibit in Adaeze trial flown to Abuja at dawn',
        ded:'Defence lawyers say nobody told them the flash drive was moving. Headquarters says it is "in safe hands".' };
      if(m.finale === 'unproven') return { pub:'THE DAILY GONG',
        head:'Ekosodin evidence moved to Abuja as Adaeze inquiry stalls',
        ded:'Six weeks on, no charges. The drive recovered with the freed UNIBEN student left Benin on the first flight.' };
      return { pub:'NATIONAL DISPATCH',
        head:'Ekosodin flash drive moved to NACECA headquarters',
        ded:'The exhibit left Benin Zonal Command on the 06:00 flight "for safekeeping", a headquarters spokesman said.' };
    },
    tip:'If you report a fraud, bring the original phone or device and the original messages, not just screenshots — and don\'t let anyone "clean" or "fix" it first. Nigerian courts admit computer evidence only when they can trust how it was produced (Evidence Act, s.84).',
    next:'Thursday night in Sapele: a POS kiosk from a hidden ledger, an herb seller who sees everything, and a man who comes with sacks.',
  },
  m10:{
    headline:(st)=>{
      const m = MC(st);
      const tail = m.s2_statement === 'threat' ? ' His lawyer says he was threatened in a car before he said a word.'
        : m.s2_statement === 'car' ? ' His lawyer says no statement was ever recorded.'
        : m.s2_statement === 'proper' ? ' He gave a recorded statement with Legal Aid counsel present.' : '';
      const ej = m.s2_ejiro === 'arrested' ? ' A 22-year-old POS attendant was also detained.' : '';
      if(m.s2_jetty === 'both') return { pub:'DELTA CHRONICLE',
        head:'Night raid at Sapele jetty: changer and boatman held with ₦9.6m',
        ded:'Traders say the outboard was still running when officers jumped aboard.' + ej + tail };
      if(m.s2_jetty === 'follow') return { pub:'WAVE24 NEWS',
        head:'Sapele currency changer arrested in Warri',
        ded:'NACECA says the arrest followed "a period of observation" on the Sapele waterside.' + ej + tail };
      return { pub:'DELTA CHRONICLE',
        head:'NACECA arrests Sapele changer with ₦9.6m in POS cash',
        ded:'Lucky Edafe, a well-known waterside changer, was arrested at the jetty. A boat left before officers reached it.' + ej + tail };
    },
    tip:'Never let anyone use your account, card or BVN — not for a cut, not for a relative. Money mules carry the crime in their own names, and a POS agent who cashes out strangers\' cards for a fee is helping to launder, not doing business.',
    next:'The boat went up the Ethiope in the dark. Next: the creeks, where the water runs black.',
  },
});

/* ======================================================================
   HUB PHONE — cond is a JS expression evaluated against the live state
   ====================================================================== */
V13.PHONE = Object.assign(V13.PHONE || {}, {
  after_m9:[
    { who:'MUM',
      text:"Your messages have no full stops again. That means you haven't slept. Eat something before you go anywhere o. And don't eat fish from those Delta rivers — your uncle says the oil has entered them." },
    { who:'UCHE',
      text:"Bought you a shirt for Thursday. Market shirt, parrots on it. It was the only one in your size. Don't argue." },
    { who:'TOBI', cond:"(S.game.moralChoices||{}).asaba==='rescue'",
      text:"I can't stop reading it. Every sailing is a Tuesday. Every T4 cash-out is a Thursday. Every C.A. payment is the 10th. Somebody ran this like a church harvest committee." },
    { who:'UCHE', cond:"(S.game.moralChoices||{}).asaba!=='rescue'",
      text:"Igbinosa says to tell you every T4 cash-out in that book is a Thursday. He also says his tea is better than mine. One of those is true." },
    { who:'OSAGIE', cond:"(S.game.moralChoices||{}).s2_original==='kept'",
      text:"Abuja has 'acknowledged' my retention order. One word, no signature. Go to Sapele, Agent. I'll be here. For now. — G.O." },
    { who:'OSAGIE', cond:"(S.game.moralChoices||{}).s2_original==='handed'",
      text:"The escort signed for exhibit 14 at 05:14. I've asked HQ to confirm it arrived. No reply. I've asked again, in writing, and kept a copy. — G.O." },
    { who:'OSAGIE', cond:"(S.game.moralChoices||{}).s2_abuja_call==='deflect'",
      text:"Mr. Kuti called my house at 02:41. He asked after my daughters by name. I have never told him their names." },
  ],
  after_m10:[
    { who:'MAMA KARO', cond:"(S.game.moralChoices||{}).s2_karo==='trust' && (S.game.moralChoices||{}).s2_ejiro!=='arrested'",
      text:"This is Karo. Ejiro showed me how to send message. He is home. He ate. He did not sleep, but he ate. Bitter leaf is fresh on Saturday." },
    { who:'MAMA KARO', cond:"(S.game.moralChoices||{}).s2_karo==='trust' && (S.game.moralChoices||{}).s2_ejiro==='arrested'",
      text:"You greeted me in my own language, then took my sister's son in front of the whole market. I am not angry. I am old. Bring him back to his mother." },
    { who:'EJIRO', cond:"(S.game.moralChoices||{}).s2_ejiro==='source'",
      text:"Oga na Ejiro. Lucky people come this morning dey ask who talk. I tell dem say na market wey talk. I dey fear but I dey here.",
      textEn:"Sir, it's Ejiro. Lucky's people came this morning asking who talked. I told them the market talked. I'm scared, but I'm here." },
    { who:'UCHE', cond:"(S.game.moralChoices||{}).s2_statement==='proper'",
      text:"The Legal Aid lawyer says you're the first officer this year who called her before the suspect asked. She sounded suspicious about it." },
    { who:'UCHE', cond:"(S.game.moralChoices||{}).s2_statement==='car'",
      text:"I've filed the car conversation as 'intelligence', not 'statement'. That's all it is, sir. Felix. Ekre side. Riverstone. Now we prove it." },
    { who:'UCHE', cond:"(S.game.moralChoices||{}).s2_statement==='threat'",
      text:"I didn't sleep. I keep hearing my own voice in that car. Don't ask me to do that again, sir. I won't." },
    { who:'UCHE', cond:"(S.game.moralChoices||{}).s2_jetty==='follow'",
      text:"Warri Area Command lifted Lucky at a filling station on the Effurun road. He asked for his lawyer and his phone charger, in that order." },
    { who:'OSAGIE', cond:"(S.game.moralChoices||{}).s2_jetty==='both'",
      text:"The boatman's family came to Sapele Area Command at dawn. Thirty of them. He has four children. I've arranged for them to see him. — G.O." },
    { who:'TOBI', cond:"(S.game.moralChoices||{}).asaba==='rescue'",
      text:"The four accounts behind Lucky's cards were opened at the same Warri branch on the same afternoon, eighteen months ago, by the same bank officer. Writing it up." },
    { who:'TUNDE',
      text:"Oga Kelechi! Na Tunde. I hear say you don go Delta. Ikeja boys dey ask for you. Abeg no forget us for Lagos o.",
      textEn:"Officer Kelechi! It's Tunde. I hear you've gone to Delta. The Ikeja boys are asking after you. Please don't forget us in Lagos." },
    { who:'MUM',
      text:"Did you eat the fish? I told you not to eat the fish. Your uncle wants to know if Sapele still has the big sawmill. Tell him yes. He's old." },
  ],
});

/* ======================================================================
   SOURCE TIPS — HERBS (Mama Karo), TILL (Ejiro)
   after: the case after which the tip arrives; true:false = planted (use
   once the source is exposed)
   ====================================================================== */
V13.TIPS = V13.TIPS || {};
V13.TIPS.HERBS = V13.TIPS.HERBS || [];
V13.TIPS.TILL = V13.TIPS.TILL || [];
V13.TIPS.HERBS.push(
  { after:'m10', true:true,
    text:"Three mothers from the Ekre side came for cough leaves this week. Their children cough black. Black, my son. Past the second bend, the river is sick." },
  { after:'m10', true:false,
    text:"Everybody in the market says the boys' camp is up the Oko side. Go there first." },
  { after:'m11', true:true,
    text:"Lucky's boys laughed at my stall today. They said the oil goes to Port Harcourt black and comes back with a receipt. 'Paper oil', they called it." },
  { after:'m12', true:true,
    text:"A black jeep with Abuja plates came to Lucky's house. The driver brought rice and an envelope and did not stay to greet. Lucky's wife is wearing new gold." },
  { after:'m13b', true:true,
    text:"Somebody is telling the market women not to talk in court. They say, 'Remember, the river is long.' I am too old to be frightened. Tell your lawyer." },
  { after:'m14', true:true,
    text:"Lucky's boys are moving cash tonight. Sacks, not bags — down to the jetty, for a boat going to Port Harcourt." },
  { after:'m14', true:false,
    text:"They say the big man will not come himself. He is sending his driver to the barge." },
);
V13.TIPS.TILL.push(
  { after:'m10', true:true,
    text:"Oga, the boatman wey carry Lucky bag dey withdraw ₦38,000 for petrol every Thursday. Him talk say na forty minutes up river with the tide.",
    textEn:"Sir, the boatman who carries Lucky's bags withdraws ₦38,000 for petrol every Thursday. He says it's forty minutes upriver with the tide." },
  { after:'m10', true:false,
    text:"Lucky people talk for my kiosk say the camp dey Oko side. I hear am with my own ear.",
    textEn:"Lucky's people said at my kiosk that the camp is on the Oko side. I heard it with my own ears." },
  { after:'m11', true:true,
    text:"One tanker driver pay ₦2.3m cash for my kiosk, transfer to one account. The name wey show for my screen: RIVERSTONE MARINE SVCS. Him say na for diesel.",
    textEn:"A tanker driver paid ₦2.3m cash at my kiosk, a transfer to an account. The name on my screen: RIVERSTONE MARINE SVCS. He said it was for diesel." },
  { after:'m12', true:true,
    text:"Oga, one of Lucky cards wey dem freeze pass for my machine today. E WORK. Who fit unfreeze account for two days?",
    textEn:"Sir, one of Lucky's frozen cards went through my machine today. It WORKED. Who can unfreeze an account in two days?" },
  { after:'m13b', true:true,
    text:"Two men come my mama house dey ask whether I go go court. Dem no threaten. Dem just know which church she dey attend.",
    textEn:"Two men came to my mother's house asking whether I'll go to court. They didn't threaten. They just knew which church she attends." },
  { after:'m14', true:true,
    text:"Big cash-out everywhere tonight — T1, T2, T3, even my machines. Somebody dey empty accounts before freeze. The money dey go PH boat.",
    textEn:"Big cash-outs everywhere tonight — T1, T2, T3, even my machines. Somebody is emptying accounts before a freeze. The money is going to the PH boat." },
  { after:'m14', true:false,
    text:"Lucky boys talk say the money go go Warri by road tonight, no be boat.",
    textEn:"Lucky's boys say the money is going to Warri by road tonight, not by boat." },
);

})();
