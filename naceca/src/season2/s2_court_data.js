(function(){ const V13 = window.V13 = window.V13 || {};
/* =========================================================================
   NACECA · Season 2 · Case 14 — FRN v. Lucky Edafe & 2 Ors
   Courtroom content (data + small text-returning functions only).
   Contract: s2/COURT.md. The engine evaluates every `when` and decides flow.
   Tokens: {EXH} = the full exhibit label the engine assigns, e.g. "Exhibit P5"
           (the text never writes the word "Exhibit" in front of the token).
   `when` vocabulary: the COURT.md conditions, joined with && / ||, plus
           'always' (always true).
   Lines are { who, text } and, for Pidgin, an optional textEn (plain English).
   ========================================================================= */

/* ---------- line helpers (one per speaker) ---------- */
const ln = (who) => (text, textEn) => (textEn ? { who, text, textEn } : { who, text });
const R  = ln('REGISTRAR'),  J  = ln('JUDGE'),   D  = ln('DANLADI'),  S  = ln('SAN');
const LA = ln('LEGAL AID'),  K  = ln('KELECHI'), LU = ln('LUCKY'),    F  = ln('FELIX');
const SO = ln('SOTONYE'),    E  = ln('EJIRO'),   T  = ln('TOBI'),     I  = ln('IGBINOSA');
const IK = ln('IKPE'),       U  = ln('USHER'),   N  = ln('NACECA SYSTEM');

const C = {};

/* =========================================================================
   META + CHARGE
   ========================================================================= */
C.meta = {
  number: 'FHC/ABJ/CR/214/2026',
  title: 'Federal Republic of Nigeria v. Lucky Edafe & 2 Ors',
  court: 'Federal High Court, Abuja Division, Court 5',
  judge: 'Hon. Justice T. O. Bakare',
  prosecution: 'Z. Danladi Esq. with A. Okoro Esq. (NACECA Legal)',
  defence: 'Femi Olaniran-Cole SAN, leading T. Akande Esq., O. Bello Esq. and C. Nwosu Esq., for the 1st defendant; N. Abara (Mrs.), Legal Aid Council of Nigeria, for the 2nd and 3rd defendants'
};

C.charge = {
  count1: "COUNT ONE. That you, LUCKY EDAFE, on diverse dates between March and December, 2026, at the Waterside Market, Sapele, Delta State, within the jurisdiction of this Honourable Court, did convert and transfer funds, to wit: cash withdrawn through POS terminal SPL-WSM-T4 from four bank accounts linked to one Bank Verification Number registered in your name, which funds you knew or reasonably ought to have known formed part of the proceeds of an unlawful act, to wit: the theft of crude oil, and thereby committed an offence contrary to section 18(2)(b) of the Money Laundering (Prevention and Prohibition) Act, 2022 and punishable under section 18(3) of the same Act.",
  count2: "COUNT TWO. That you, FELIX UGBEKILE, on diverse dates between March and December, 2026, at a camp on the Ekre creek of the Ethiope River, Delta State, within the jurisdiction of this Honourable Court, without lawful authority or an appropriate licence, did deal in crude oil and petroleum products, to wit: by refining stolen crude oil in open drums, storing the product, and selling it for shipment on the barge TEKENA 2, and thereby committed an offence contrary to section 1(17)(a) of the Miscellaneous Offences Act, Cap. M17, Laws of the Federation of Nigeria, 2004, and punishable under the same section.",
  count3: "COUNT THREE. That you, SOTONYE JUMBO, on diverse dates between March and December, 2026, at the tank farm of Riverstone Marine Services Ltd on the Port Harcourt waterfront, Rivers State, within the jurisdiction of this Honourable Court, without lawful authority, did receive, store and sell petroleum products, to wit: automotive gas oil discharged from the barge TEKENA 2, knowing it to have been refined from stolen crude oil, and did enter the said product in the official intake log of the said tank farm as 'imported AGO', which entry you knew to be false, and thereby committed an offence contrary to section 1(17)(a) of the Miscellaneous Offences Act, Cap. M17, Laws of the Federation of Nigeria, 2004, and punishable under the same section."
};

/* =========================================================================
   PRE-TRIAL CONFERENCE — NACECA Legal, Abuja (ACJA s.270(5) consultation)
   ========================================================================= */
C.conference = {
  open: [
    N("ABUJA · NACECA HEADQUARTERS · LEGAL DEPARTMENT, THIRD FLOOR · 18:40. Case files on every chair. A kettle that has given up."),
    D("Sit, Agent. Move those. No, those are somebody else's disaster. Put them on the floor."),
    D("Monday, nine o'clock, Court 5, Justice Bakare. Three defendants: the changer, the camp manager, the tank-farm manager. You are PW1. You'll be in that box longer than anyone."),
    K("And the people this was really about?"),
    D("Are not on the charge sheet. Not the Senator. Not anybody on the ninth floor. This trial is about what gets admitted, and who says what on oath. Win it properly and the rest has a floor to stand on."),
    D("Lucky has a Senior Advocate. Femi Olaniran-Cole. A SAN, for a man who changes money in a night market. Ask yourself who is paying."),
    K("I have been asking."),
    D("He won't shout. He'll be courteous, and he'll take every exhibit apart at the seams. Anything off a computer without a section 84 certificate, gone. Kubor v Dickson."),
    D("Public records only by certified true copy. Bank records only if the bank's own officer proves them. A copy of a missing original only if we show we searched for the original."),
    D("A confession only if it was taken the way the ACJA says. And anything from a search that cut corners, he'll ask the judge to throw out under sections 14 and 15."),
    D("Then he starts on you. Whatever you did out there, he has read it. Tell the truth in that box. It's the one thing I can't repair afterwards."),
    D("Before I file: the law makes me consult the investigating officer before I offer anyone a plea bargain. Section 270(5). So. I'm consulting.")
  ],
  sotonye: {
    ask: [
      D("Sotonye Jumbo. Her USB is the only thing that puts TEKENA 2's cargo inside Tank 3. And she knows whose driver owns Riverstone."),
      D("The offer: she pleads guilty to count three as amended — receiving and storing without lawful authority, the false-entry particulars struck out. Agreed sentence, two years. She testifies for us."),
      D("She's an accomplice. Before the court convicts on her word alone it must warn itself, section 198, so what matters in her evidence needs support. But no document can name a driver. She can."),
      D("And if anything was said to her out there that looks like pressure, the judge will ask her whether her plea is voluntary. She'll be looking at you when she answers."),
      D("Your view, Agent. Do I offer it?")
    ],
    yes: [
      K("Offer it. She kept that USB because she knew someone would come for it one day. Let it be us."),
      D("Then it goes in writing tonight. Her counsel signs, she signs, I sign, and the victim's representative is consulted. The judge stays out of the room. That's the law."),
      D("Two years for the woman who can name the driver. I can live with that.")
    ],
    no: [
      K("No deal. She logged stolen diesel as imported for months. Let her answer for it."),
      D("Then she sits in the dock beside Lucky and says nothing, which is her right. And her USB has to get in on the strength of your search alone."),
      D("I hope you searched well.")
    ]
  },
  felix: {
    ask: [
      D("Felix Ugbekile. He gave you the barge schedule and the Sapele end of the money. He'll say it again on oath, if we let him plead."),
      D("The offer: count two as amended — storing and selling without lawful authority, the refining particulars struck out. Agreed sentence, three years."),
      D("In return he testifies: the camp, the barge, and the cash coming back."),
      D("He ran a camp that poisoned a creek. The judge will look hard at that bargain. But he's the only engineer alive who can explain to a court how crude becomes 'imported' diesel."),
      D("Your view?")
    ],
    yes: [
      K("Offer it. He knows exactly what the smoke does. He told me before I asked."),
      D("Then I'll draft it. If the judge thinks three years is too light, the judge must tell him so before passing sentence, and he can walk away from the deal. That's his protection, not mine.")
    ],
    no: [
      K("No. The creek doesn't get a plea bargain."),
      D("Then he's a defendant like the others, and he'll sit next to Lucky saying nothing. Also his right. We prove the camp without him.")
    ]
  },
  close: [
    D("Monday. Wear a suit you can sweat in. Court 5's air conditioning is older than I am."),
    D("And the certificates, Agent. Everything we can make admissible before Monday, make admissible. Whatever isn't ready, we fight for on the day, or we lose it."),
    K("And if we lose an exhibit?"),
    D("Then we lose an exhibit. We don't lose the court's trust. That's the only thing that carries over from one day to the next.")
  ]
};

/* =========================================================================
   DAY 1 — call, appearances, arraignment, opening, PW1 in chief
   ========================================================================= */
C.day1 = {
  call: [
    N("FEDERAL HIGH COURT · ABUJA DIVISION · COURT 5 · 09:12. Ceiling fans, wigs, and a row of reporters who were told this was a small case."),
    U("Court! All rise."),
    N("Hon. Justice T. O. Bakare takes the bench, lays three pens side by side, and opens a hardback notebook. Everything said in this room will be written down by hand."),
    R("Charge number FHC/ABJ/CR/214/2026. Federal Republic of Nigeria versus Lucky Edafe and two others."),
    J("Appearances."),
    D("May it please your Lordship. Z. Danladi, with me A. Okoro, for the prosecution. My Lord, the defendants are in court."),
    S("May it please my Lord. Femi Olaniran-Cole, Senior Advocate of Nigeria, leading T. Akande, O. Bello and C. Nwosu, for the first defendant."),
    LA("May it please my Lord. N. Abara, of the Legal Aid Council of Nigeria, for the second and third defendants."),
    J("That is a crowded bar for a currency changer, Mr. Olaniran-Cole."),
    S("Every citizen deserves a proper defence, my Lord."),
    J("So I am told. Rarely can they afford one. Yes, Counsel?"),
    D("My Lord, the matter is for arraignment. The prosecution is ready to proceed.")
  ],
  arraign: {
    d1: [
      R("Lucky Edafe. Stand up. Do you understand English?"),
      LU("Yes, my Lord."),
      R("Listen carefully to the charge against you."),
      N("The registrar reads count one in full: money laundering, section 18 of the Money Laundering (Prevention and Prohibition) Act, 2022."),
      R("Do you understand the charge?"),
      LU("I understand."),
      R("How do you plead? Guilty, or not guilty?"),
      LU("Not guilty, my Lord. I be fuel man.", "Not guilty, my Lord. I'm a fuel man."),
      J("The plea, Mr. Edafe. Only the plea. You'll have your turn."),
      J("The first defendant pleads not guilty to count one. Recorded.")
    ],
    d2_notguilty: [
      R("Felix Ugbekile. Stand up. Do you understand English?"),
      F("I do."),
      N("The registrar reads count two in full: dealing in crude oil and petroleum products without lawful authority, section 1(17) of the Miscellaneous Offences Act."),
      R("Do you understand the charge? How do you plead?"),
      F("Not guilty."),
      J("The second defendant pleads not guilty to count two. Recorded.")
    ],
    d2_plea: [
      D("My Lord, before the second defendant takes his plea: the prosecution and the second defendant have reached a plea agreement under section 270 of the ACJA. It is in writing, signed, and filed."),
      LA("That is so, my Lord. I was present throughout, and I have explained it to him."),
      J("This court took no part in it, and will take no part in it. Registrar, read the count as amended."),
      N("The registrar reads count two as amended: storing and selling petroleum products without lawful authority."),
      R("Felix Ugbekile, how do you plead?"),
      F("Guilty."),
      J("Mr. Ugbekile, look at me. Did anyone force you, threaten you, or promise you anything that is not written in that agreement?"),
      F("No, my Lord. Nobody forced me. I'm tired of the smoke."),
      D("My Lord, the facts: the second defendant ran a refining camp on the Ekre creek, and stored and sold its product for shipment on the barge TEKENA 2."),
      J("Do you admit those facts?"),
      F("I admit them."),
      J("I am satisfied that the plea is voluntary and that he admits every element. The second defendant is convicted on his plea on count two as amended."),
      J("Sentence is deferred to the conclusion of this trial. Mr. Ugbekile, this court is not a party to your bargain."),
      J("If I think the agreed sentence too light, I will tell you before I pass it, and you may choose your course.")
    ],
    d3_notguilty: [
      R("Sotonye Jumbo. Stand up. Do you understand English?"),
      SO("Yes."),
      N("The registrar reads count three in full: receiving, storing and selling petroleum products without lawful authority, and the false entries in the intake log."),
      R("How do you plead?"),
      SO("Not guilty."),
      J("The third defendant pleads not guilty to count three. Recorded.")
    ],
    d3_plea: [
      D("My Lord, the prosecution and the third defendant have also reached a written plea agreement under section 270. It is filed."),
      LA("Confirmed, my Lord. I have explained its terms to her, and the consequences."),
      N("The registrar reads count three as amended: receiving and storing petroleum products without lawful authority. The false-entry particulars are struck out."),
      R("Sotonye Jumbo, how do you plead?"),
      N("She looks at the second row of the gallery, where the investigating officer sits, before she answers."),
      J("Look at me, Ms. Jumbo, not at the officers. Did anyone threaten you, or promise you anything outside this agreement?"),
      SO("...No, my Lord. I'm pleading guilty."),
      D("My Lord, the facts: as manager of the Riverstone tank farm, the third defendant received and stored, in Tank 3, diesel discharged from the barge TEKENA 2."),
      J("Do you admit those facts?"),
      SO("I admit them."),
      J("The plea is voluntary and the facts admitted. The third defendant is convicted on her plea on count three as amended. Sentence is deferred to the conclusion of the trial.")
    ]
  },
  open: [
    D("My Lord, briefly. The prosecution will show that the cash drawn by the first defendant at a POS kiosk in Sapele was the proceeds of crude oil stolen from the Ethiope creeks."),
    D("That it was cooked into diesel at a camp, carried on the barge TEKENA 2 to a tank farm in Port Harcourt, sold into the market as 'imported', and paid back through that kiosk."),
    D("Every link, my Lord, by a witness or a document."),
    J("Then let us have the first of them."),
    D("The prosecution calls its first witness."),
    R("PW1. Take the oath."),
    N("Kelechi takes the oath on the holy book of his choosing. His hand is steady. His collar is already damp."),
    K("...the truth, the whole truth, and nothing but the truth.")
  ],
  exam: [
    { id: 'who',
      ask: [ D("PW1, tell the court your name and what you do.") ],
      answers: [
        { text: "My name is Kelechi. I am an officer of NACECA. I was the investigating officer in this case.", kind: 'good', cred: 2,
          reply: [ J("'...investigating officer in this case.' Go on, Counsel.") ] },
        { text: "Agent Kelechi, NACECA. The officer who broke the Ekosodin kidnapping and found the UPSTREAM ledger.", kind: 'overclaim', cred: -3,
          reply: [ S("My Lord, I had hoped to wait for cross-examination before the witness began his memoirs."),
                   J("Your name and your work, Agent. This court will decide what you found.") ] },
        { text: "Kelechi, NACECA. The officer certain people in Abuja tried very hard to keep out of this courtroom.", kind: 'speculate', cred: -5,
          reply: [ S("Objection, my Lord. 'Certain people' are not on the charge sheet."),
                   J("Sustained. Agent, you will find this court has no appetite for mysteries. Your name and your work.") ] }
      ],
      tender: null },

    { id: 'drive',
      ask: [ D("How did this investigation begin?") ],
      answers: [
        { text: "With exhibit 14 at Benin Zonal Command: a flash drive recovered in the Ekosodin case. The night before it was sent to Abuja, I examined it with the forensic analyst.", kind: 'good', cred: 2,
          reply: [ J("Slowly, Agent. This court still writes by hand."),
                   N("The judge writes. Everyone waits. The ceiling fan ticks on every turn.") ] },
        { text: "Headquarters ordered that drive flown to Abuja at six in the morning. Somebody there knew exactly what was on it.", kind: 'speculate', cred: -5,
          reply: [ S("Objection. The witness is now reading minds, my Lord. In Abuja. From Benin."),
                   J("Sustained, and struck out. Tell us what you did, Agent, not what others knew.") ] },
        { text: "The custodian told me nobody had opened it since it came back from the registry.", kind: 'hearsay', cred: -3,
          reply: [ S("Hearsay, my Lord. If the custodian has something to say, let him come and say it."),
                   J("Sustained. The custodian can speak for himself.") ] }
      ],
      tender: 'drive_image', also: ['evidence_register'] },

    { id: 'ledger',
      ask: [ D("What did you find on the drive?") ],
      answers: [
        { text: "A spreadsheet titled UPSTREAM. Dated rows, codes and sums. Against several dates: 'TEKENA 2 — sailed (Ethiope)'. About two days after each: 'SPL-WSM-T4 — cash-out', with an amount.", kind: 'good', cred: 3,
          reply: [ N("Olaniran-Cole writes one word on his pad and underlines it twice."),
                   J("'...cash-out, with an amount.' Yes, Counsel.") ] },
        { text: "Payments every quarter to 'D.G.O.' — the Director-General's Office, my Lord.", kind: 'speculate', cred: -8,
          reply: [ S("My Lord! The witness has just accused a public officer who is not before this court, on the strength of three letters of the alphabet."),
                   J("Agent. This court is trying three defendants, not initials. That answer is struck out, and I will not hear it again."),
                   D("My Lord, I'll move on.") ] },
        { text: "The first defendant's whole business. Every naira he touched is in it.", kind: 'overclaim', cred: -4,
          reply: [ S("Objection. Is my client's name anywhere in it?"),
                   J("Is it, Agent?"),
                   K("...No, my Lord. A terminal code."),
                   J("Then say a terminal code.") ] }
      ],
      tender: 'upstream_ledger' },

    { id: 'terminal',
      ask: [ D("What did you do with the code 'SPL-WSM-T4'?") ],
      answers: [
        { text: "I went to the Waterside night market in Sapele. On a kiosk beside a herb stall there's a POS terminal. I read its sticker myself: SPL-WSM-T4.", kind: 'good', cred: 2,
          reply: [ J("'S-P-L... W-S-M... T-4.' Go on.") ] },
        { text: "A trader there told me a changer came to that kiosk every Thursday with sacks.", kind: 'hearsay', cred: -4,
          reply: [ S("Hearsay, my Lord. From a trader with no name."),
                   J("Sustained."),
                   D("My Lord, the prosecution does not rely on it."),
                   J("Good, Counsel, because you can't.") ] },
        { text: "SPL, Sapele. WSM, Waterside Market. I knew at once that's where Upstream's money landed.", kind: 'speculate', cred: -3,
          reply: [ S("The witness 'knew at once'. My Lord, we would much rather hear what he saw."),
                   J("So would I. Struck out. What did you see, Agent?") ] }
      ],
      tender: 'pos_t4_log' },

    { id: 'watch',
      ask: [ D("Tell the court what you saw at that terminal.") ],
      answers: [
        { text: "Shortly after nine, the first defendant came to the kiosk. Within half an hour he made four withdrawals, back to back, each just under the limit, a different card each time. Then he carried two bags to the jetty and handed them to a boatman.", kind: 'good', cred: 3,
          reply: [ J("Four withdrawals. A different card each time. Two bags. A boatman."),
                   N("The judge underlines something. Olaniran-Cole notices.") ] },
        { text: "I watched him launder crude-oil money: four withdrawals, four cards, two sacks to a boatman.", kind: 'overclaim', cred: -4,
          reply: [ S("My Lord, 'launder' is the question this court sits to answer. The witness has kindly answered it for you."),
                   J("I'll answer it myself, thank you. Agent, describe. Don't conclude.") ] },
        { text: "The boy at the kiosk told me he'd been doing it every Thursday for months.", kind: 'hearsay', cred: -4,
          reply: [ S("Hearsay. If the boy at the kiosk has evidence, the prosecution knows where to find him."),
                   J("Sustained. Struck out.") ] }
      ],
      tender: 'bvn_link' },

    { id: 'arrest',
      ask: [ D("How did the first defendant come to be arrested?") ],
      answers: [
        { text: "He was arrested on my instructions. I told him why, and that he could remain silent and have a lawyer. What he had with him was counted in front of him and listed.", kind: 'good', cred: 2,
          reply: [ J("'...counted in front of him and listed.' Thank you.") ] },
        { text: "We caught him red-handed with the proceeds.", kind: 'overclaim', cred: -3,
          reply: [ S("Proceeds of what, my Lord? That is rather the point of the trial."),
                   J("Agent, you were asked how he was arrested, not what he is guilty of.") ] },
        { text: "If we hadn't moved, that money would have been up the creek by midnight, paying for the next barge.", kind: 'speculate', cred: -4,
          reply: [ S("Objection. Speculation about the money's travel plans."),
                   J("Sustained.") ] }
      ],
      tender: 'cash_bundles' },

    { id: 'statement',
      ask: [ D("Did the first defendant make a statement?") ],
      answers: [
        { text: "He did. I was present when it was recorded, and he signed each page.", kind: 'good', cred: 1,
          reply: [ J("Noted.") ] },
        { text: "He confessed, my Lord. He told us everything.", kind: 'overclaim', cred: -4,
          reply: [ S("My Lord, if my learned friend means to tender a confession, the defence will have a great deal to say about it. The witness may not summarise it for her."),
                   J("The document will speak for itself, Agent, if it is admitted. Not you.") ] },
        { text: "He was frightened, my Lord. Frightened men tell the truth.", kind: 'speculate', cred: -6,
          reply: [ S("Did the court hear that, my Lord? 'Frightened.' I will come back to that word."),
                   J("It is written down, Mr. Olaniran-Cole. Every word is.") ] }
      ],
      tender: 'lucky_statement' },

    { id: 'creek',
      ask: [ D("Did your investigation take you beyond Sapele?") ],
      answers: [
        { text: "Yes. To a camp on the Ekre creek. I saw drums over open fires, crude being cooked into diesel, product stored at a landing, and the barge TEKENA 2 alongside it. The second defendant was at the camp.", kind: 'good', cred: 3,
          reply: [ J("'...the barge TEKENA 2 alongside it.' Go on.") ] },
        { text: "A fisherman told us that camp had been poisoning the creek for years.", kind: 'hearsay', cred: -4,
          reply: [ S("Hearsay, my Lord. Another witness with no name."),
                   J("Sustained. This court has great sympathy for fishermen, Agent. It cannot hear them through you.") ] },
        { text: "The second defendant ran all of it: the camp, the barge, the money.", kind: 'overclaim', cred: -4,
          reply: [ LA("Objection, my Lord. The witness has just promoted my client to chief executive."),
                   J("Sustained. Agent, you saw a man at a camp. Say that.") ] }
      ],
      tender: 'fuel_samples', also: ['waybill_book', 'felix_phone', 'barge_track'] },

    { id: 'tankfarm',
      ask: [ D("What happened in Port Harcourt?") ],
      answers: [
        { text: "I went to the Riverstone Marine tank farm on the waterfront. The third defendant is its manager. A sample was drawn from Tank 3 in my presence, and I recovered a USB drive holding the farm's loading log.", kind: 'good', cred: 3,
          reply: [ J("'...holding the farm's loading log.' Yes.") ] },
        { text: "Riverstone is a front, my Lord. On paper a driver owns it. A Senator's driver.", kind: 'overclaim', cred: -6,
          reply: [ S("My Lord, I object in the strongest terms. A distinguished member of the Senate is not a party to—"),
                   J("He isn't, and he will not become one by implication in my court. Struck out. Agent, stay inside the charge.") ] },
        { text: "The boat drivers' union told me the 'Big Man's boat' came in every Thursday.", kind: 'hearsay', cred: -4,
          reply: [ S("Hearsay, my Lord. And from a union, which is worse."),
                   J("Sustained. Struck out.") ] }
      ],
      tender: 'loading_log', also: ['tank3_sample', 'gate_register'] },

    { id: 'records',
      ask: [ D("What records did you obtain about Riverstone Marine Services Limited?") ],
      answers: [
        { text: "Its record at the Corporate Affairs Commission: shareholders, directors, addresses. And its bank statements, which show payments out of its account to a company called Maitama Haven Properties Limited.", kind: 'good', cred: 2,
          reply: [ J("'Maitama Haven Properties Limited.' Spell Maitama for the record, Agent. I know how. The record may not.") ] },
        { text: "That money paid for a house in Maitama where powerful men meet on Fridays.", kind: 'speculate', cred: -5,
          reply: [ S("My Lord, we seem to have moved from Sapele to the society pages."),
                   J("Sustained. Agent, a bank statement does not tell you who meets on Fridays.") ] },
        { text: "Those records prove where the oil money ended up.", kind: 'overclaim', cred: -3,
          reply: [ S("Objection. Documents prove nothing until this court says so."),
                   J("Quite. What do they show, Agent? Not prove. Show.") ] }
      ],
      tender: 'cac_record', also: ['bank_trail'] }
  ],
  adjourn: [
    D("My Lord, that concludes the evidence-in-chief of PW1."),
    J("Mr. Olaniran-Cole, you will want time to prepare your cross-examination."),
    S("I am always ready, my Lord. But I should like the witness to have a weekend to think about his answers. It's only fair."),
    J("Generous of you. This matter is adjourned to Monday next for cross-examination of PW1 and continuation of trial. The defendants are to be produced."),
    U("Court!"),
    N("In the corridor, Olaniran-Cole stops beside Kelechi, unhurried, wig under his arm."),
    S("Agent. A pleasure. Monday will be less pleasant, I'm afraid. Nothing personal."),
    K("It never is.")
  ]
};

/* Optional frames for the later sittings (the engine may use or ignore). */
C.day2 = {
  call: [
    N("COURT 5 · MONDAY · 09:05. The reporters have doubled. Somebody has brought a camera and been sent outside with it."),
    U("Court! All rise."),
    R("Charge number FHC/ABJ/CR/214/2026, FRN versus Lucky Edafe and two others. For continuation of trial."),
    D("My Lord, appearances as before. PW1 is in the box. The matter is for cross-examination."),
    J("Agent, you are still on your oath. Mr. Olaniran-Cole."),
    S("I'm obliged, my Lord.")
  ],
  adjourn: [
    J("This matter is adjourned to Thursday for the defence."),
    U("Court!")
  ]
};
C.day3 = {
  call: [
    N("COURT 5 · THURSDAY · 09:00. The fans are working. Nobody trusts them."),
    U("Court! All rise."),
    R("Charge number FHC/ABJ/CR/214/2026. For defence."),
    S("May it please my Lord. The first defendant will give evidence on his own behalf.")
  ],
  adjourn: [
    J("Final written addresses having been adopted, this matter is adjourned for judgment."),
    U("Court!")
  ]
};

/* =========================================================================
   EXHIBITS — tendered through PW1 (or any witness: "this witness")
   Objections are checked in order; the first whose `when` is true fires.
   A response may carry an optional `cred` (credibility change for PW1).
   ========================================================================= */
C.exhibits = {};

/* ---- exhibit 14: the copy of the Benin drive ---- */
C.exhibits.drive_image = {
  name: "the copy of exhibit 14, the flash drive held at Benin Zonal Command, with its hash values",
  apply: [
    D("My Lord, through this witness the prosecution seeks to tender the copy of exhibit 14 made at Benin Zonal Command on the night he described, together with its hash values and the analyst's certificate.")
  ],
  clean: [
    S("We have examined it, my Lord. A write-blocker, hash values that match, a certificate under section 84. My learned friend has been careful."),
    J("Then it is admitted and marked {EXH}."),
    S("We reserve our comments on what it means, my Lord. Not on what it is.")
  ],
  objections: [
    { when: 'method_photo && original_handed',
      san: [
        S("My Lord, this is not a copy of a drive. It is a set of photographs of a laptop screen, taken on a phone, of a drive which has since disappeared."),
        S("No image, no hash, no certificate, and no original to check them against. Kubor v Dickson. And section 89(c) asks for proof of a search, not a shrug.")
      ],
      responses: [
        { text: "Kelechi lays the foundation himself; Danladi hands up the record of the search for the original.", ok: true, needs: 'search_record',
          reply: [
            K("I took every photograph myself, my Lord, on my service phone, which was working properly. They show the screen as I saw it, file by file."),
            D("And for the original, my Lord: three letters to Headquarters and three replies. 'Cannot be located.' All possible search, section 89(c).")
          ] },
        { text: "Kelechi: \"The photographs are a complete record of that drive.\"", ok: false, needs: null, cred: -3,
          reply: [
            K("The photographs are a complete record of that drive, my Lord."),
            S("Complete? How many files were on it, Agent?"),
            K("...I photographed the ones that mattered."),
            S("Chosen by you. I'm obliged.")
          ] },
        { text: "Danladi: \"The original is at Headquarters and can be produced.\"", ok: false, needs: null,
          reply: [
            D("My Lord, the original is at the Agency's headquarters and can be produced."),
            J("Then produce it, Counsel. Until you do, I have photographs of a screen and a promise.")
          ] }
      ],
      admitted: [
        J("The witness has laid the foundation orally, which Dickson v Sylva permits, and the search for the original is proved. Admitted and marked {EXH}."),
        J("But a photograph of a screen is a photograph of a screen. Its weight will be very carefully considered.")
      ],
      rejected: [
        J("Photographs of a screen, no certificate, no proper foundation, and an original nobody has shown me they looked for. Tendered and rejected.")
      ],
      weight: 'reduced' },

    { when: 'method_direct && original_handed',
      san: [
        S("My Lord, this 'copy' was taken after the witness plugged the original straight into a laptop. No write-blocker, no hash beforehand. Every file now says it was opened that night."),
        S("And the original, the only thing that could tell us what was there before he touched it, has vanished. The copy cannot be checked against anything.")
      ],
      responses: [
        { text: "The analyst's evidence on the file dates, plus the record of the search for the original.", ok: true, needs: 'search_record',
          reply: [
            D("My Lord, the analyst will testify that opening a file changes the date it was last read, not what is written in it. Every 'last modified' date predates the seizure."),
            D("As to the original: our letters to Headquarters, and their replies, are before the court. All possible search, section 89(c).")
          ] },
        { text: "Kelechi: \"I didn't change anything. I only looked.\"", ok: false, needs: null, cred: -2,
          reply: [
            K("I didn't change anything, my Lord. I only opened the files."),
            S("'Only opened.' Agent, do you know what a computer writes to a drive when you only open it?"),
            K("...Not exactly."),
            S("Neither does the court. That is my point.")
          ] },
        { text: "Danladi: \"These are matters of weight, not admissibility.\"", ok: false, needs: null,
          reply: [
            D("My Lord, these are matters for weight, not admissibility."),
            J("Some are. A missing original is admissibility, Counsel. Section 89(c). Have you shown me a search?")
          ] }
      ],
      admitted: [
        J("On the account given of the file dates, and on proof of the search, the copy is admitted and marked {EXH}."),
        J("Its weight is another matter. A drive opened without protection, in a hurry, at night. I will remember all of it.")
      ],
      rejected: [
        J("The original is gone without explanation, and the copy was taken after the original was handled unprotected. I cannot know what I am looking at. Tendered and rejected.")
      ],
      weight: 'reduced' },

    { when: 'method_photo',
      san: [
        S("My Lord, these are photographs of a laptop screen, taken on a phone. There is no forensic image, no hash, and no certificate under section 84 for the phone, the laptop, or the drive."),
        S("Computer output without a foundation. Kubor v Dickson.")
      ],
      responses: [
        { text: "Kelechi lays the section 84 foundation orally.", ok: true, needs: null,
          reply: [
            K("I took the photographs myself, my Lord, on my service phone. It was working properly. The screen showed the drive's files, and I photographed them in order."),
            D("My Lord, oral evidence may lay the foundation in place of a certificate. Dickson v Sylva.")
          ] },
        { text: "Kelechi: \"The analyst certified them.\"", ok: false, needs: null, cred: -5,
          reply: [
            K("The analyst certified them, my Lord."),
            S("Did he? My Lord, there is no certificate in the proof of evidence. The analyst's worksheet says, and I quote: 'No image taken. Screens photographed at officer's instruction.'")
          ] },
        { text: "Danladi: \"The photographs speak for themselves.\"", ok: false, needs: null,
          reply: [
            D("My Lord, the photographs speak for themselves."),
            J("Photographs are made by machines, Counsel, and machines need a foundation. Section 84 says so, not I.")
          ] }
      ],
      admitted: [
        J("The witness has laid the foundation orally, which Dickson v Sylva permits. Admitted and marked {EXH}."),
        J("What photographs of a screen, chosen by an officer, are worth, I will hear at the end.")
      ],
      rejected: [ J("No certificate, and no proper foundation laid. Tendered and rejected.") ],
      weight: 'reduced' },

    { when: 'method_direct',
      san: [
        S("My Lord, the original was plugged straight into an ordinary laptop. No write-blocker. Every file on it now says it was opened on the night this witness had it."),
        S("The defence cannot know, and with respect neither can the court, what that drive said before he touched it.")
      ],
      responses: [
        { text: "The analyst's evidence: 'opened' is not 'changed'.", ok: true, needs: null,
          reply: [
            D("My Lord, the analyst who copied the drive will testify that opening a file changes when it was last read, not what it says. Every 'last modified' date predates the seizure."),
            K("I sat beside the analyst while the copy was made, my Lord. The laptop was working properly.")
          ] },
        { text: "Kelechi: \"We used a write-blocker.\"", ok: false, needs: null, cred: -6,
          reply: [
            K("We used a write-blocker, my Lord."),
            S("My Lord, the file listing in the prosecution's own disclosure shows every file 'last accessed' that night, between 23:40 and 01:10. A write-blocker exists to stop exactly that."),
            S("I'll give the witness a moment to remember.")
          ] },
        { text: "Danladi: \"Any defect goes to weight.\"", ok: false, needs: null,
          reply: [
            D("My Lord, any defect goes to weight, not admissibility."),
            J("If I had a foundation, Counsel, I might agree. As it is, I have nothing to weigh.")
          ] }
      ],
      admitted: [
        J("On the account given of the dates, the copy is admitted and marked {EXH}."),
        J("I note, and will note again in my judgment, that the original was handled without protection, by choice.")
      ],
      rejected: [ J("There is no reliable account of what the drive held before it was handled. Tendered and rejected.") ],
      weight: 'reduced' },

    { when: 'original_handed',
      san: [
        S("My Lord, my learned friend offers a copy. The best evidence of a document is the document. Where is exhibit 14?"),
        S("We understand it went to the Agency's headquarters. The prosecuting agency. Section 167(d): evidence which could be produced and is not is presumed unfavourable to the one who withholds it.")
      ],
      responses: [
        { text: "Danladi hands up the record of the search: three letters to Headquarters and the replies.", ok: true, needs: 'search_record',
          reply: [
            D("My Lord, the prosecution wrote to Headquarters three times for the original. These are the letters. These are the replies: 'Exhibit 14 cannot be located at this time.'"),
            D("That is all possible search, section 89(c). The copy was verified by hash on the night it was made, and the analyst's certificate is attached."),
            J("The prosecuting agency cannot locate the prosecution's exhibit. I see.")
          ] },
        { text: "Kelechi: \"The original is in the Director-General's safe.\"", ok: false, needs: null, cred: -4,
          reply: [
            K("My Lord, the original is in the Director-General's safe."),
            S("Is it? Did the witness see it there?"),
            K("I saw a docket that said so."),
            J("A docket that is not before me. Agent, that is a serious statement and it is not evidence. Counsel, is there any record of a search?")
          ] },
        { text: "Danladi: \"The hash proves the copy is exact. The original adds nothing.\"", ok: false, needs: null,
          reply: [
            D("My Lord, the hash values prove the copy is exact. The original adds nothing."),
            J("It adds the law, Counsel. Secondary evidence of a missing document needs proof of a search. Section 89(c).")
          ] }
      ],
      admitted: [
        J("The search is proved. The copy is verified by hash and certified under section 84. Admitted and marked {EXH}."),
        J("The court notes, without comment for now, where the original was last seen.")
      ],
      rejected: [ J("There is no evidence of any search for an original in the prosecution's own custody. I will not receive the copy. Tendered and rejected.") ],
      weight: 'full' },

    { when: 'custody_unsigned',
      san: [
        S("My Lord, no quarrel with the copying. The quarrel is with the night. The exhibit register has no entry for exhibit 14 that night. None."),
        S("Until the witness explains where the drive was, and in whose hands, this copy comes from nowhere.")
      ],
      responses: [
        { text: "Kelechi tells the court the truth about that night.", ok: true, needs: null, cred: -1,
          reply: [
            K("My Lord, there's no entry because I asked the custodian not to make one. I took exhibit 14 out at about ten that night and returned it before four."),
            K("It was with me, at the forensic bench, the whole time. That is my word, and I know it is only my word.")
          ] },
        { text: "Kelechi: \"It never left the cage. The analyst came to it.\"", ok: false, needs: null, cred: -6,
          reply: [
            K("It never left the cage, my Lord. The analyst came to it."),
            S("My Lord, the analyst's worksheet records exhibit 14 'at the forensic bench' from 23:14 until 03:30. Not at the cage. At the bench.")
          ] },
        { text: "Danladi: \"Whoever held it, the hash shows the copy is exact.\"", ok: true, needs: null,
          reply: [
            D("My Lord, whoever held the drive, the hash values show the copy matches what the drive held at the moment of copying."),
            J("At that moment. Not before it. That goes to weight. You may have your copy.")
          ] }
      ],
      admitted: [
        J("Admitted and marked {EXH}. The gap in the register will be weighed, and against the prosecution if it is not closed.")
      ],
      rejected: [ J("The witness's account is contradicted by the prosecution's own documents. I will not admit the copy through him. Tendered and rejected.") ],
      weight: 'reduced' }
  ]
};

/* ---- the UPSTREAM ledger (printout from the copy) ---- */
C.exhibits.upstream_ledger = {
  name: "a printout of the spreadsheet titled UPSTREAM, taken from the copy of exhibit 14",
  apply: [
    D("My Lord, I seek to tender through this witness a printout of the spreadsheet titled UPSTREAM, taken from the copy of exhibit 14. Twelve pages, each initialled by the analyst.")
  ],
  clean: [
    S("No objection to its admissibility, my Lord. A great deal to say, later, about its author. Whoever that is."),
    J("Admitted and marked {EXH}. Anonymity goes to weight, Mr. Olaniran-Cole."),
    S("I'm obliged, my Lord. It usually does.")
  ],
  objections: [
    { when: 'method_photo',
      san: [ S("My Lord, this is a printout of a photograph of a screen. Two steps from whatever the drive held, and no certificate for either step.") ],
      responses: [
        { text: "Kelechi: \"I photographed every page of that sheet myself and printed them unedited.\"", ok: true, needs: null,
          reply: [
            K("I photographed every page of that sheet myself, my Lord, and printed the photographs without editing them. My phone was working properly."),
            D("Oral foundation, my Lord. Dickson v Sylva.")
          ] },
        { text: "Kelechi: \"It's the whole ledger, exactly as it was.\"", ok: false, needs: null, cred: -4,
          reply: [
            K("It's the whole ledger, my Lord, exactly as it was on the drive."),
            S("Exactly? My Lord, photograph eleven cuts off the right-hand column. Whatever was in it, this court will never know.")
          ] }
      ],
      admitted: [ J("Admitted on the oral foundation and marked {EXH}, with every reservation that two steps from the source deserves.") ],
      rejected: [ J("Tendered and rejected.") ],
      weight: 'reduced' },

    { when: 'method_direct',
      san: [ S("My Lord, printed from a drive that was opened unprotected. Whatever the ledger said before that night, this is what it said afterwards.") ],
      responses: [
        { text: "Danladi: the sheet's own 'last modified' date is from before the seizure.", ok: true, needs: null,
          reply: [ D("My Lord, the sheet's own 'last modified' date is earlier than the seizure of the drive. Opening a file does not change it. The analyst will say so.") ] },
        { text: "Kelechi: \"Nobody touched the spreadsheet.\"", ok: false, needs: null, cred: -3,
          reply: [
            K("Nobody touched the spreadsheet, my Lord."),
            S("Somebody opened it, Agent. You. Its 'last accessed' time is that night, 23:52. What else did you do at 23:52?"),
            K("...I read it.")
          ] }
      ],
      admitted: [ J("Admitted and marked {EXH}. The handling was careless, and the weight will say so.") ],
      rejected: [ J("Tendered and rejected.") ],
      weight: 'reduced' },

    { when: 'original_handed',
      san: [ S("My Lord, the same point as before. A printout of a copy of a drive the prosecution cannot produce.") ],
      responses: [
        { text: "Danladi relies on the record of the search for the original.", ok: true, needs: 'search_record',
          reply: [ D("My Lord, the record of the search is before the court and section 89(c) is satisfied. This printout comes from the hash-verified copy.") ] },
        { text: "Danladi: \"A printout doesn't need the original.\"", ok: false, needs: null,
          reply: [
            D("My Lord, a printout does not need the original."),
            J("A printout of a copy of a missing original needs a good deal more than that, Counsel.")
          ] }
      ],
      admitted: [ J("Admitted and marked {EXH}.") ],
      rejected: [ J("Without proof of the search, the printout falls with the copy. Tendered and rejected.") ],
      weight: 'full' }
  ]
};

/* ---- the Benin exhibit register ---- */
C.exhibits.evidence_register = {
  name: "the exhibit register of Benin Zonal Command, the page for exhibit 14",
  apply: [
    D("My Lord, I seek to tender the exhibit register of Benin Zonal Command, the page for exhibit 14. The custodian has brought the original book. It is in court.")
  ],
  clean: [
    S("No objection, my Lord. Times, names, seal numbers. I wish every register in this country were kept like that one."),
    J("Admitted and marked {EXH}.")
  ],
  objections: [
    { when: 'custody_unsigned',
      san: [
        S("No objection, my Lord. In fact, the defence is grateful for it."),
        S("We invite the court to read the entry for the night of the examination very carefully. There isn't one. The prosecution is tendering its own gap.")
      ],
      responses: [
        { text: "Kelechi explains the blank page now, under oath, before he's asked.", ok: true, needs: null, cred: 1,
          reply: [
            K("My Lord, the page is blank because I told the custodian that night that the drive never left the cage. It did. I took it."),
            N("The judge writes it down, word for word, without looking up.")
          ] },
        { text: "Kelechi: \"The custodian must have missed the entry.\"", ok: false, needs: null, cred: -6,
          reply: [
            K("The custodian must have missed the entry, my Lord."),
            S("Must he? My Lord, the custodian is on the prosecution's list of witnesses. I look forward to asking him.")
          ] },
        { text: "Danladi: \"The register is what it is. Its weight is for address.\"", ok: true, needs: null,
          reply: [
            D("My Lord, the register is what it is. Its weight is a matter for final address."),
            J("Agreed. I expect the address on it will be lively.")
          ] }
      ],
      admitted: [ J("Admitted and marked {EXH}, blank night and all. A register is evidence of what it records. Sometimes of what it doesn't.") ],
      rejected: [
        D("My Lord, in the circumstances the prosecution withdraws the register at this stage."),
        J("Withdrawn, and so marked. I suspect the custodian will have something to say about it.")
      ],
      weight: 'reduced' }
  ]
};

/* ---- terminal T4 log ---- */
C.exhibits.pos_t4_log = {
  name: "the transaction log of POS terminal SPL-WSM-T4, Waterside Market, Sapele",
  apply: [
    D("My Lord, I seek to tender through this witness the transaction log of POS terminal SPL-WSM-T4, March to December, sixty-two pages.")
  ],
  clean: [
    S("We have seen the provider's certificate, my Lord. No objection to the log. A log can't say who was holding the cards. We will."),
    J("Admitted and marked {EXH}.")
  ],
  objections: [
    { when: 'always',
      san: [
        S("My Lord, this is a computer printout. Where is the certificate under section 84(4), signed by someone responsible for the terminal or its system?"),
        S("Not this witness, who, with respect, has never run a POS terminal in his life. Kubor v Dickson.")
      ],
      responses: [
        { text: "Danladi hands up the certificate of the POS provider's compliance officer.", ok: true, needs: 'cert_pos',
          reply: [
            D("My Lord, the certificate under section 84(4), signed by the compliance officer of the terminal's provider, is attached to the log."),
            D("It identifies the terminal and the system, and confirms both were operating properly throughout the period."),
            S("...So it does. I'm obliged.")
          ] },
        { text: "Kelechi: \"I watched the terminal print it myself.\"", ok: false, needs: null, cred: -2,
          reply: [
            K("I watched the terminal print it myself, my Lord."),
            S("Did you see the server it came from, Agent? The one in Lagos that holds nine months of transactions?"),
            K("No."),
            J("Then you cannot vouch for it.")
          ] },
        { text: "Danladi: \"The terminal's operator will come and explain it.\"", ok: false, needs: null,
          reply: [
            D("My Lord, the terminal's operator will be called and can speak to it."),
            J("Then he may lay the foundation when he comes, Counsel. I will not admit a computer printout on a promise.")
          ] }
      ],
      admitted: [ J("The certificate satisfies section 84(4). Admitted and marked {EXH}.") ],
      rejected: [ J("Computer output with no certificate, and no foundation from anyone responsible for the system. Tendered and rejected.") ],
      weight: 'full' }
  ]
};

/* ---- four accounts, one BVN ---- */
C.exhibits.bvn_link = {
  name: "the account-opening records and statements of four accounts paid out at T4, and the BVN record that links them",
  apply: [
    D("My Lord, I seek to tender the account-opening records and statements of four bank accounts, and the Bank Verification Number record that links all four.")
  ],
  clean: [
    S("Properly proved by the bank, my Lord. No objection. Four names, one BVN. We will say what that means."),
    J("Admitted and marked {EXH}.")
  ],
  objections: [
    { when: 'always',
      san: [
        S("My Lord, these are copies of entries in banker's books. Under section 90(1)(e), no such copy is evidence until an officer of the bank proves the book, and that the copy was examined against it."),
        S("They are also computer printouts. So, section 84 as well. We have neither.")
      ],
      responses: [
        { text: "Danladi hands up the bank officer's certificates.", ok: true, needs: 'bank_cert',
          reply: [
            D("My Lord, the certificate of the bank's officer is attached: the books are the bank's ordinary books, the entries made in the ordinary course of business, and the copies examined against them."),
            D("And a certificate under section 84 for the system that produced them, signed by the same officer.")
          ] },
        { text: "Kelechi: \"Our analyst pulled them from the BVN system.\"", ok: false, needs: null,
          reply: [
            K("Our analyst pulled them from the BVN system, my Lord."),
            S("'Our analyst.' Not the bank. My Lord, the bank must prove its own books. That is the whole point of section 90(1)(e).")
          ] },
        { text: "Kelechi: \"I saw the BVN on the screen myself.\"", ok: false, needs: null, cred: -2,
          reply: [
            K("I saw the BVN on the screen myself, my Lord."),
            J("What you saw on a screen is not the bank's book, Agent. Counsel?"),
            D("...Nothing further on it, my Lord.")
          ] }
      ],
      admitted: [ J("Banker's books properly proved, and a section 84 certificate. Admitted and marked {EXH}.") ],
      rejected: [ J("Copies of banker's books, unproved by any officer of any bank. Tendered and rejected.") ],
      weight: 'full' }
  ]
};

/* ---- the cash ---- */
C.exhibits.cash_bundles = {
  name: "nine million, six hundred thousand naira in POS bundles, with the seizure inventory and photographs",
  apply: [
    D("My Lord, I seek to tender the sum of nine million, six hundred thousand naira in bundles, produced in court from the exhibit room, with the inventory and the photographs taken at recovery.")
  ],
  clean: [
    S("No objection, my Lord. Cash is cash. My client is a currency changer. We would be worried if he had none."),
    J("Admitted and marked {EXH}. And somebody count it again before it leaves this courtroom."),
    N("Two officers count it at the clerk's table. It takes forty minutes. Nobody leaves.")
  ],
  objections: [
    { when: 'lucky_followed',
      san: [
        S("My Lord, my client was not arrested at the jetty. The witness watched him walk away, by choice, and he was arrested two days later in Warri."),
        S("Whatever this money is, the prosecution must show me how it travelled from that jetty to this table.")
      ],
      responses: [
        { text: "Kelechi gives a precise account of where, when and how the bundles were recovered.", ok: true, needs: null,
          reply: [
            K("My Lord, I let him go to follow the bags. The bundles were recovered exactly where the inventory says, and sealed there. The seal numbers are on the bags in front of you."),
            D("The inventory and the photographs are before the court, my Lord.")
          ] },
        { text: "Kelechi: \"It's obviously the same money.\"", ok: false, needs: null, cred: -3,
          reply: [
            K("It's obviously the same money, my Lord."),
            S("Obviously. My Lord, naira notes are not famous for their individuality.")
          ] }
      ],
      admitted: [ J("Admitted and marked {EXH}. How it connects to the first defendant is a question of weight.") ],
      rejected: [ J("I have money, and no chain from the first defendant to it. Tendered and rejected.") ],
      weight: 'reduced' }
  ]
};

/* ---- Lucky's statement. If the engine runs C.twt, the response reply orders the
   trial-within-trial; the twt scene carries the ruling. `admitted`/`rejected`
   here are the short formal rulings for when no TWT scene is run. ---- */
C.exhibits.lucky_statement = {
  name: "the statement of the first defendant, Lucky Edafe",
  apply: [
    D("My Lord, I seek to tender the statement of the first defendant, recorded by this witness and signed by the first defendant on each page.")
  ],
  clean: [
    S("No objection, my Lord. My client told them it was his fuel business. He still says so."),
    J("Admitted and marked {EXH}.")
  ],
  objections: [
    { when: 'statement_threat',
      san: [
        S("My Lord, the defence objects. The first defendant will say this statement was not made voluntarily. It was made after threats, in the presence of this witness and his sergeant."),
        S("Under section 29(2), the prosecution must prove beyond reasonable doubt that it was not obtained by oppression. We ask for a trial-within-trial.")
      ],
      responses: [
        { text: "Danladi: \"The prosecution will prove it voluntary.\"", ok: false, needs: null,
          reply: [
            D("My Lord, the prosecution will call the investigating officer and the sergeant who was present, and prove voluntariness."),
            J("Then that question is tried before anything else touches this statement. It is marked for identification only.")
          ] },
        { text: "Danladi: \"The prosecution withdraws the statement.\"", ok: false, needs: null,
          reply: [
            D("My Lord, having considered the position, the prosecution will not rely on this statement. We withdraw it."),
            N("Olaniran-Cole looks at her for a long second, then inclines his head. It is very nearly a bow."),
            J("Withdrawn. The court records it.")
          ] }
      ],
      admitted: [ J("The prosecution has discharged the burden under section 29(2). The statement is admitted and marked {EXH}.") ],
      rejected: [ J("The prosecution has not proved, beyond reasonable doubt, that the statement was not obtained by oppression. It is excluded, and marked rejected.") ],
      weight: 'reduced' },

    { when: 'statement_car',
      san: [
        S("My Lord, this statement was written in a car. No video recording, no lawyer, no one of the defendant's choosing. Sections 15(4) and 17(2) of the ACJA."),
        S("The Supreme Court has held both requirements mandatory for every federal agency. This statement cannot be admitted.")
      ],
      responses: [
        { text: "Danladi: \"Section 15(4) says 'may'. It is permissive.\"", ok: false, needs: null,
          reply: [
            D("My Lord, section 15(4) says the statement 'may' be recorded electronically. The word is permissive."),
            J("It was, Counsel, until the Supreme Court read it. That word is settled. I am bound.")
          ] },
        { text: "Kelechi: \"He spoke freely. Nobody forced him.\"", ok: false, needs: null, cred: -1,
          reply: [
            K("He spoke freely, my Lord. Nobody forced him."),
            J("That is not the question, Agent. The question is whether the law's conditions were met. Were they?"),
            K("...No, my Lord.")
          ] },
        { text: "Danladi: \"We'll prove what the statement led to by other evidence instead.\"", ok: false, needs: null,
          reply: [
            D("My Lord, the prosecution will not press the statement. What it led us to, the creek and the camp, we prove by other evidence."),
            J("Section 30 lets you prove facts discovered. The statement itself stays out. Sensible, Counsel.")
          ] }
      ],
      admitted: [ J("The statement is admitted and marked {EXH}.") ],
      rejected: [
        J("No video, no counsel, no person of the defendant's choosing. The Supreme Court's ruling binds this court. Tendered and rejected."),
        J("And for completeness: even if admitted, what one defendant says is not evidence against another. Section 29(4).")
      ],
      weight: 'reduced' },

    { when: 'statement_proper',
      san: [
        S("My Lord, I am instructed to object. My client says this statement was not made voluntarily."),
        S("I am bound to put my client's case, my Lord. I put it."),
        N("He says it the way a man reads out a weather forecast he does not believe.")
      ],
      responses: [
        { text: "Danladi: \"It was recorded on video, with Legal Aid counsel present. We'll prove it.\"", ok: true, needs: null,
          reply: [
            D("My Lord, the statement was recorded on video at Area Command, with counsel from the Legal Aid Council present throughout. The recording is here, with its certificate."),
            J("Then we shall watch it, in a trial-within-trial. Marked for identification until then.")
          ] },
        { text: "Kelechi: \"He was given water, a lawyer, and the right to stop. He chose to talk.\"", ok: true, needs: null,
          reply: [
            K("My Lord, he was given water, a lawyer, and the right to stop whenever he wanted. He talked about his fuel business for forty minutes."),
            S("That much is true, my Lord. He does like to talk about it.")
          ] },
        { text: "Kelechi: \"He's only saying that because his lawyer told him to.\"", ok: true, needs: null, cred: -3,
          reply: [
            K("He's only saying that now because his lawyer told him to."),
            S("My Lord, I'd ask the witness to leave my instructions to me."),
            J("Agent, you will not speculate about what passes between a man and his counsel. Ever.")
          ] }
      ],
      admitted: [
        J("The recording shows a man at ease, with counsel beside him. Voluntariness is proved beyond reasonable doubt. Admitted and marked {EXH}."),
        J("Whether it is true is another matter. A retraction goes to weight, not admissibility. Omoha v State.")
      ],
      rejected: [ J("The statement is rejected.") ],
      weight: 'full' }
  ]
};

/* ---- camp samples ---- */
const grabbedResponses = [
  { text: "Kelechi admits the bottle was grabbed, and accounts for every hour it was in his hands.", ok: true, needs: null, cred: -1,
    reply: [
      K("It wasn't sealed at the scene, my Lord. I took it from the drum myself, and it never left my possession until I handed it to the laboratory the next afternoon."),
      K("I wrote the time on the cap with a marker, in the boat. That's all I can say for it.")
    ] },
  { text: "Kelechi: \"It was sealed at the scene.\"", ok: false, needs: null, cred: -7,
    reply: [
      K("It was sealed at the scene, my Lord."),
      S("My Lord, the laboratory's intake form, served on us by the prosecution: 'One plastic bottle. Unsealed. Unlabelled. Marker on cap.'"),
      S("Perhaps the seal fell off in the boat.")
    ] }
];
C.exhibits.fuel_samples = {
  name: "the product samples taken from the cooling drums at the Ekre creek camp, with the laboratory report",
  apply: [ D("My Lord, I seek to tender the samples of product taken at the Ekre creek camp, and the laboratory's report on them.") ],
  clean: [
    S("No objection, my Lord. Sealed, labelled, signed across the seal. The defence has no quarrel with diesel."),
    J("Admitted and marked {EXH}.")
  ],
  objections: [
    { when: 'samples_grabbed && camp_navy',
      san: [
        S("My Lord, one bottle. No seal, no label, no photograph of where it stood. And the place it came from no longer exists. The witness had it burned."),
        S("Diesel is diesel, my Lord. Without a chain, this bottle could have come from any filling station between here and Warri.")
      ],
      responses: grabbedResponses,
      admitted: [ J("Admitted and marked {EXH}. The court has the witness's account of the bottle's journey, and nothing else. The weight will reflect that.") ],
      rejected: [ J("An unsealed bottle, an account the prosecution's own laboratory contradicts, and a scene that no longer exists. Tendered and rejected.") ],
      weight: 'reduced' },
    { when: 'samples_grabbed',
      san: [
        S("My Lord, one bottle. No seal, no label, no photograph of where it stood."),
        S("Diesel is diesel. Without a chain, this bottle could have come from any filling station between here and Warri.")
      ],
      responses: grabbedResponses,
      admitted: [ J("Admitted and marked {EXH}, on the witness's account of its journey. Reduced weight.") ],
      rejected: [ J("An unsealed bottle, and an account the prosecution's own laboratory contradicts. Tendered and rejected.") ],
      weight: 'reduced' },
    { when: 'camp_navy',
      san: [ S("My Lord, no objection to the bottles as such. But the court should know the camp they came from was burned on this witness's call. The defence can test nothing against the scene.") ],
      responses: [
        { text: "Kelechi: \"The samples were sealed and photographed at the drums before the Navy came.\"", ok: true, needs: null,
          reply: [ K("The samples were sealed, labelled and photographed at the drums before the Navy arrived, my Lord. The seal numbers are on the bottles.") ] },
        { text: "Danladi: \"The burning goes to weight, if anything.\"", ok: true, needs: null,
          reply: [ D("My Lord, that goes to weight at most. The bottles are sealed."), J("They are. Proceed.") ] }
      ],
      admitted: [ J("Admitted and marked {EXH}.") ],
      rejected: [ J("Tendered and rejected.") ],
      weight: 'full' }
  ]
};

/* ---- the waybill book ---- */
C.exhibits.waybill_book = {
  name: "a book of Riverstone Marine Services waybills recovered at the Ekre creek camp, with the depot notice found inside it",
  apply: [ D("My Lord, I seek to tender a book of Riverstone Marine Services waybills, recovered by this witness at the Ekre creek camp, with the depot notice found pinned inside it.") ],
  clean: [
    S("No objection to the book, my Lord. My client never wrote a waybill in his life."),
    J("Admitted and marked {EXH}.")
  ],
  objections: [
    { when: 'camp_navy',
      san: [ S("My Lord, this book was supposedly found at a camp which the witness then had burned. No photograph of where it lay, and no one from the camp to say it was ever there.") ],
      responses: [
        { text: "Kelechi: \"I found it in the shelter, signed and dated the cover there, and have kept it since.\"", ok: true, needs: null,
          reply: [ K("I found it on a shelf in the shelter, my Lord, before the Navy was called. I signed and dated the inside cover there and then. It has been in my custody since.") ] },
        { text: "Kelechi: \"The Navy recovered it.\"", ok: false, needs: null, cred: -6,
          reply: [
            K("The Navy recovered it, my Lord."),
            S("Did they? The Navy's own report, which the defence obtained: 'Drums destroyed: forty-one.' It mentions no book.")
          ] }
      ],
      admitted: [ J("Admitted and marked {EXH}. The witness's signature on the cover is the only witness to where it was found. Weight accordingly.") ],
      rejected: [ J("Tendered and rejected.") ],
      weight: 'reduced' },
    { when: 'always',
      san: [
        S("My Lord, the waybills are what they are. But my learned friend wants them to be forgeries, and for that she relies on a depot notice pinned inside, written by we know not whom."),
        S("That notice is hearsay. Its author is not here.")
      ],
      responses: [
        { text: "Danladi: \"We tender the book as found. That Riverstone's waybills were at an illegal camp is the fact.\"", ok: true, needs: null,
          reply: [ D("My Lord, we tender the book as found, not the notice for its truth. That Riverstone's waybills were at an illegal refinery is itself the relevant fact."),
                   J("On that basis, yes.") ] },
        { text: "Kelechi: \"The notice proves the waybills are forged.\"", ok: false, needs: null, cred: -2,
          reply: [ K("The notice proves the waybills are forged, my Lord."),
                   J("The notice proves somebody pinned up a notice, Agent. Counsel, on what basis do you tender this?"),
                   D("...My Lord, I'll take instructions.") ] }
      ],
      admitted: [ J("The book is admitted, and marked {EXH}, as a document found at the camp. The notice proves nothing about Jetty 2 unless someone from the depot comes to say so.") ],
      rejected: [ J("Tendered and rejected.") ],
      weight: 'reduced' }
  ]
};

/* ---- the escort's phone ---- */
C.exhibits.felix_phone = {
  name: "the mobile phone recovered from the camp escort, with the report of its extraction",
  apply: [ D("My Lord, I seek to tender the mobile phone recovered from the camp escort at the Ekre creek, and the report of its extraction.") ],
  clean: [
    S("No objection, my Lord. My client's number is not in it."),
    J("Admitted and marked {EXH}.")
  ],
  objections: [
    { when: 'always',
      san: [ S("My Lord, an extraction report is computer output twice over: the phone, and the machine that read it. There is no certificate under section 84 for either.") ],
      responses: [
        { text: "Kelechi lays the foundation: he seized the phone and was present for the extraction.", ok: true, needs: null,
          reply: [
            K("My Lord, I took the phone from the escort myself and put it in flight mode. I was present when it was extracted on the Agency's forensic kit, which is in regular use and was working properly."),
            K("And the contact saved as 'GODWIN — R.M.S.' was on the screen when I took it. I saw it myself.")
          ] },
        { text: "Danladi: \"A certificate will follow, my Lord.\"", ok: false, needs: null,
          reply: [ D("My Lord, a certificate will follow."), J("Then so may the phone, Counsel. Not before.") ] }
      ],
      admitted: [ J("Admitted on the oral foundation, Dickson v Sylva, and marked {EXH}. Whose phone it is, and whose contacts, I will weigh.") ],
      rejected: [ J("No foundation. Tendered and rejected.") ],
      weight: 'reduced' }
  ]
};

/* ---- the barge tracker ---- */
C.exhibits.barge_track = {
  name: "the log of the tracking device placed on the barge TEKENA 2",
  apply: [ D("My Lord, I seek to tender the log of the tracking device placed on the barge TEKENA 2: every position, every six minutes, for as long as it was attached.") ],
  clean: [
    S("No objection, my Lord. Boats move. It's what they're for."),
    J("Admitted and marked {EXH}.")
  ],
  objections: [
    { when: 'always',
      san: [ S("My Lord, a tracker log is the purest computer output there is. No certificate under section 84(4). And this witness is not responsible for the tracker's server.") ],
      responses: [
        { text: "Danladi hands up the analyst's section 84 certificate for the tracker log.", ok: true, needs: 'cert_tracker',
          reply: [ D("My Lord, the certificate of the Agency's forensic analyst, who is responsible for the tracking system: the device, the server, and that both operated properly throughout.") ] },
        { text: "Kelechi: \"I fitted it myself and watched it on the screen every night.\"", ok: false, needs: null,
          reply: [ K("I fitted it myself, my Lord, and watched it on the screen every night."),
                   S("Watching a screen is not certifying a server, my Lord. Kubor is clear.") ] },
        { text: "Danladi: \"The loading log corroborates every voyage.\"", ok: false, needs: null,
          reply: [ D("My Lord, the loading log corroborates every voyage."),
                   J("Corroboration goes to weight, Counsel. First I need something admissible to corroborate.") ] }
      ],
      admitted: [ J("Certified under section 84(4). Admitted and marked {EXH}.") ],
      rejected: [ J("Uncertified computer output. Tendered and rejected.") ],
      weight: 'full' }
  ]
};

/* ---- the tank-farm search: shared objections (loading log, Tank 3 sample, gate register) ---- */
const searchObjections = (what, withPerson) => {
  const out = [
    { when: 'no_warrant && searched_woman_self',
      san: [
        S("My Lord, " + what + " came out of a search made without a warrant, though a magistrate was within reach, in which this witness, a man, also searched the third defendant himself."),
        S("Two breaches of the law in one afternoon, both deliberate. Sections 14 and 15 of the Evidence Act were written for afternoons like that.")
      ],
      responses: [
        { text: "Danladi argues the section 15 balance: grave offence, central evidence.", ok: false, needs: null,
          reply: [
            D("My Lord, section 15 asks the court to weigh the probative value, the importance of the evidence, and the gravity of the offence. All are high."),
            J("It also asks whether the breach was deliberate, Counsel, and how hard it would have been to act lawfully. A warrant was an hour away. A female officer, a phone call.")
          ] },
        { text: "Kelechi: \"There was no time. They'd have destroyed the records.\"", ok: false, needs: null, cred: -2,
          reply: [
            K("There was no time, my Lord. They would have destroyed the records."),
            S("Did the witness see anything destroyed?"),
            K("...No."),
            S("Then the danger was imagined, my Lord, and the breaches were real.")
          ] }
      ],
      admitted: [ J("On balance, and with this court's displeasure on the record, admitted and marked {EXH}. Its weight is much reduced.") ],
      rejected: [ J("Two deliberate breaches in a single search, when lawful means were close at hand. The undesirability of admitting what that search produced outweighs its value. Section 14. Excluded.") ],
      weight: 'reduced' },
    { when: 'no_warrant',
      san: [
        S("My Lord, " + what + " was taken in a search of the Riverstone tank farm made without a warrant. A magistrate was available within the hour."),
        S("The witness chose not to wait. A deliberate breach. We ask the court to exclude what it produced, under sections 14 and 15.")
      ],
      responses: [
        { text: "Kelechi tells the truth about the decision; Danladi argues the section 15 balance.", ok: true, needs: null, cred: -1,
          reply: [
            K("My Lord, a warrant could have been had within the hour. I decided not to wait. I believed the records would not survive the hour."),
            D("My Lord, section 15: the evidence is central, the offence grave, the impropriety one of timing and not of force. Nobody was harmed. The balance favours admission.")
          ] },
        { text: "Kelechi: \"We had a warrant.\"", ok: false, needs: null, cred: -8,
          reply: [
            K("We had a warrant, my Lord."),
            S("My Lord, the defence holds a certified extract of the magistrates' warrant register for that day. No warrant was issued for Riverstone Marine. Shall I hand it up?")
          ] },
        { text: "Danladi: \"No warrant is needed to search premises used for crime.\"", ok: false, needs: null,
          reply: [
            D("My Lord, no warrant is needed to search premises being used for crime."),
            J("Counsel, that is an argument for every search ever made. The law takes a different view.")
          ] }
      ],
      admitted: [
        J("The breach was deliberate, but it has been candidly admitted, nobody was harmed, and the evidence is central. On balance, and only just, admitted and marked {EXH}."),
        J("Its weight will carry the mark of how it was obtained.")
      ],
      rejected: [ J("A deliberate breach, and nothing before me that tips the balance the other way. Excluded under section 14, and marked rejected.") ],
      weight: 'reduced' }
  ];
  if (withPerson) out.push(
    { when: 'searched_woman_self',
      san: [ S("My Lord, the third defendant, a woman, was searched by this witness, a man, in breach of section 9(3) of the ACJA. What was taken from her that day is tainted by it.") ],
      responses: [
        { text: "Kelechi admits the search was wrong, and says where the USB was found.", ok: true, needs: null, cred: -1,
          reply: [
            K("I searched her myself, my Lord. I should not have. It should have been a female officer."),
            K("The USB was not on her person. It was in her car, which was searched separately.")
          ] },
        { text: "Kelechi: \"A female officer searched her.\"", ok: false, needs: null, cred: -8,
          reply: [
            K("A female officer searched her, my Lord."),
            S("My Lord, the operation order lists every officer on that search. Not one is recorded as searching the third defendant, except, in his own notebook, the witness.")
          ] }
      ],
      admitted: [ J("The breach of section 9(3) is serious and admitted. But the drive came from her car, not her person. Admitted and marked {EXH}, with reduced weight.") ],
      rejected: [ J("Excluded.") ],
      weight: 'reduced' });
  out.push(
    { when: 'inventory_skipped',
      san: [ S("My Lord, nothing taken at the tank farm went on an inventory signed by the third defendant, and she was given no copy. Section 10 of the ACJA."),
             S("How, then, does this court know that " + what + " is what was taken that day?") ],
      responses: [
        { text: "Kelechi: no signed inventory, but he sealed it himself and logged the seal number.", ok: true, needs: null, cred: -1,
          reply: [
            K("There was no signed inventory, my Lord. That was my failure."),
            K("I sealed it at the scene myself. The seal number is in my notebook, timed, and it is the seal on the exhibit in front of you.")
          ] },
        { text: "Kelechi: \"She signed an inventory.\"", ok: false, needs: null, cred: -6,
          reply: [
            K("She signed an inventory, my Lord."),
            S("Then the prosecution will produce it. It is not in the proof of evidence, and my learned friend for the third defendant tells me her client was given nothing.")
          ] }
      ],
      admitted: [ J("Admitted and marked {EXH}. The missing inventory goes to weight.") ],
      rejected: [ J("Tendered and rejected.") ],
      weight: 'reduced' });
  return out;
};

C.exhibits.loading_log = {
  name: "a USB drive recovered at the Riverstone tank farm, and a printout of the true loading log it holds",
  apply: [ D("My Lord, I seek to tender a USB drive recovered at the Riverstone tank farm, and a printout of the loading log it holds.") ],
  clean: [
    S("No objection to the record, my Lord. We look forward to hearing who kept it, and why."),
    J("Admitted and marked {EXH}.")
  ],
  objections: searchObjections('this USB drive', true).concat([
    { when: 'always',
      san: [ S("My Lord, a printout from a USB drive is computer output. Section 84. Who vouches for the computer that made this log?") ],
      responses: [
        { text: "Oral foundation: the analyst imaged the USB on a write-blocker; Kelechi recovered and sealed it.", ok: true, needs: null,
          reply: [ D("My Lord, the analyst imaged the USB through a write-blocker and will say so. The printout is from that image. This witness recovered and sealed the drive. Oral foundation, Dickson v Sylva.") ] },
        { text: "Danladi: \"It is the company's own record. It speaks for itself.\"", ok: false, needs: null,
          reply: [ D("My Lord, the log is the company's own record."),
                   J("Records do not vouch for themselves, Counsel. That is rather the point of section 84.") ] }
      ],
      admitted: [ J("Admitted and marked {EXH}.") ],
      rejected: [ J("Tendered and rejected.") ],
      weight: 'full' }
  ])
};

C.exhibits.tank3_sample = {
  name: "a sample of diesel drawn from Tank 3 at the Riverstone tank farm, with the laboratory report",
  apply: [ D("My Lord, I seek to tender a sample of diesel drawn from Tank 3 at the Riverstone tank farm, with the laboratory's report: colour, foaming, sediment, flash point.") ],
  clean: [
    S("No objection, my Lord. We'll address you on what it proves, which is that some diesel is badly made."),
    J("Admitted and marked {EXH}.")
  ],
  objections: searchObjections('this sample', false)
};

C.exhibits.gate_register = {
  name: "the gate register of the Riverstone tank farm, recording tankers in and out",
  apply: [ D("My Lord, I seek to tender the gate register of the Riverstone tank farm, recording tankers in and out, recovered in the search.") ],
  clean: [
    S("No objection, my Lord. Tankers come and go. That is what tank farms are for."),
    J("Admitted and marked {EXH}.")
  ],
  objections: searchObjections('this register', false)
};

/* ---- CAC record (public document) ---- */
C.exhibits.cac_record = {
  name: "the Corporate Affairs Commission record of Riverstone Marine Services Ltd",
  apply: [ D("My Lord, I seek to tender the record of Riverstone Marine Services Limited at the Corporate Affairs Commission: its shareholders, its directors, and their addresses.") ],
  clean: [
    S("It is certified, my Lord. No objection. A company owned on paper by a driver. Many are."),
    J("Admitted and marked {EXH}.")
  ],
  objections: [
    { when: 'always',
      san: [
        S("My Lord, this is a printout from the Commission's online portal. The Commission's records are public documents, under section 102."),
        S("Only a certified true copy is admissible: sections 89(e), 90(1)(c) and 104. And Kubor v Dickson says a printout of a public document is no exception.")
      ],
      responses: [
        { text: "Danladi hands up the certified true copy issued by the Commission.", ok: true, needs: 'ctc_cac',
          reply: [
            D("My Lord, the prosecution tenders instead the certified true copy issued by the Commission, with the certification and the fees paid endorsed on it."),
            S("My learned friend has been to the Commission. I'm obliged.")
          ] },
        { text: "Danladi: \"It comes from the Commission's own official website.\"", ok: false, needs: null,
          reply: [ D("My Lord, it comes from the Commission's own official website."),
                   J("So did one of the printouts in Kubor v Dickson, Counsel. It did not survive the Supreme Court either.") ] },
        { text: "Kelechi: \"I searched the registry myself.\"", ok: false, needs: null,
          reply: [ K("I searched the registry myself, my Lord."),
                   J("Then you know what the registry says, Agent. The court needs the registry's certificate, not your memory of it.") ] }
      ],
      admitted: [ J("A certified true copy of a public document. Admitted and marked {EXH}.") ],
      rejected: [ J("An uncertified printout of a public document. Tendered and rejected.") ],
      weight: 'full' }
  ]
};

/* ---- Riverstone's statements (banker's books) ---- */
C.exhibits.bank_trail = {
  name: "the statements of account of Riverstone Marine Services Ltd, showing transfers to Maitama Haven Properties Ltd",
  apply: [ D("My Lord, I seek to tender the statements of account of Riverstone Marine Services Limited, showing transfers to Maitama Haven Properties Limited.") ],
  clean: [
    S("Properly proved, my Lord. No objection, though I confess I can't find my client anywhere in Maitama."),
    J("Admitted and marked {EXH}.")
  ],
  objections: [
    { when: 'always',
      san: [
        S("My Lord, the same defect as before: copies of banker's books unproved by any officer of the bank, section 90(1)(e), and uncertified printouts besides."),
        S("And, with respect, relevance. My client changes money in Sapele. He has never set foot in Maitama.")
      ],
      responses: [
        { text: "Danladi hands up the bank officer's certificates, and answers on relevance.", ok: true, needs: 'bank_cert',
          reply: [ D("My Lord, the bank's officer has proved the books and certified the system."),
                   D("As to relevance: the prosecution must prove the money is the proceeds of unlawful activity. Where it goes is part of what it is.") ] },
        { text: "Danladi: \"They come straight from the bank. They're obviously genuine.\"", ok: false, needs: null,
          reply: [ D("My Lord, they come straight from the bank."),
                   J("Then the bank can say so, Counsel, through an officer. That is all section 90 asks.") ] }
      ],
      admitted: [ J("Proved and certified. Admitted and marked {EXH}. Relevance I will hear you both on at the end.") ],
      rejected: [ J("Copies of banker's books, unproved. Tendered and rejected.") ],
      weight: 'full' }
  ]
};

/* =========================================================================
   CROSS-EXAMINATION OF PW1 — the engine takes those whose `when` is true,
   in this order, max 6. 'hearsay' is always first. Truth costs a little now;
   lies win a point now and are exposed by a document the SAN holds.
   ========================================================================= */
C.cross = [
  { id: 'hearsay', when: 'always',
    q: [
      S("Good morning, Agent. I'll be brief, and I'll be fair. You'll tell me if I'm not."),
      S("You've told the court a great deal about crude oil. Did you, at any time, see crude oil being stolen?")
    ],
    answers: [
      { text: "No, sir. I never saw crude taken from a pipeline.", kind: 'truth', cred: -1, exposed: null,
        reply: [
          S("Thank you. And you never saw my client near a pipeline, or a creek, or a barge?"),
          K("No, sir. I saw him at a POS kiosk in Sapele."),
          S("At a POS kiosk. I'm obliged.")
        ] },
      { text: "Yes. I saw the barge loading stolen crude at the camp.", kind: 'lie', cred: 1,
        reply: [ S("Did you? Then help me with something.") ],
        exposed: [
          S("My Lord, the witness's own report, dated the morning after: 'Arrived at camp 01:20. No crude delivery observed. Refined product only.'"),
          S("Your words, Agent. Or were they somebody else's too?")
        ] },
      { text: "I didn't need to. The ledger told me where the money came from.", kind: 'combative', cred: -4, exposed: null,
        reply: [
          S("The ledger told you. Who wrote the ledger, Agent?"),
          K("...I don't know."),
          S("So a document by nobody told you something you never saw. Thank you.")
        ] },
      { text: "The evidence speaks for itself, sir.", kind: 'evasive', cred: -3, exposed: null,
        reply: [
          S("Evidence is modest, Agent. It rarely speaks. Did you see crude stolen, yes or no?"),
          J("Answer the question, Agent."),
          K("No.")
        ] }
    ] },

  { id: 'bribe', when: 'bribe',
    q: [
      S("Agent, I want to take you back some time. To a house in Lagos, a man called Chief Obi, and a drawer in his desk."),
      D("Objection, my Lord. Relevance."),
      J("It goes to credit, Counsel. Overruled."),
      S("Did you take money from that drawer, Agent?")
    ],
    answers: [
      { text: "Yes. I took the money. It's the worst thing I have done in this job.", kind: 'truth', cred: -4, exposed: null,
        reply: [
          N("Nobody in Court 5 moves. Even the fans seem to slow."),
          S("Thank you for your honesty, Agent. It must be new to you."),
          J("Mr. Olaniran-Cole."),
          S("I withdraw that, my Lord. The answer was enough.")
        ] },
      { text: "No, sir. I have never taken money from anyone.", kind: 'lie', cred: 1,
        reply: [ S("Never. I see.") ],
        exposed: [
          S("My Lord, may the witness be shown this? An affidavit sworn last month by one Chief Obi, at the High Court registry in Lagos."),
          S("Paragraph four: 'The officer took the cash from my drawer and walked out of my house.' Would you like to read it yourself, Agent, or shall I?")
        ] },
      { text: "Is this a trial of the first defendant, or of me?", kind: 'combative', cred: -6, exposed: null,
        reply: [ S("Of the first defendant, Agent. With you as the main evidence against him. Which is why your honesty is on trial too.") ] },
      { text: "I don't recall any such incident.", kind: 'evasive', cred: -7, exposed: null,
        reply: [ S("You don't recall. Cash. In a drawer. In a house you raided. Do tell the court if your memory improves before lunch.") ] }
    ] },

  { id: 'statement_threat', when: 'statement_threat',
    q: [ S("Agent, the night my client made his statement. Before he said a word, did you say this to your sergeant: 'Show him what happens to people who lie to us'?") ],
    answers: [
      { text: "Yes. I said it.", kind: 'truth', cred: -4, exposed: null,
        reply: [
          S("And the sergeant, what did he do?"),
          K("He stood where your client could see him."),
          S("And then my client talked."),
          K("Yes.")
        ] },
      { text: "No, sir. Nothing like that was said.", kind: 'lie', cred: 1,
        reply: [ S("Nothing like that. Very well.") ],
        exposed: [
          S("My Lord, the prosecution served on us the written statement of Sergeant Uche, its own witness. Line nine:"),
          S("'Agent Kelechi said: Uche, show him what happens to people who lie to us. I did not like it.' Your sergeant's words, Agent.")
        ] },
      { text: "He was lying to us. Every word.", kind: 'combative', cred: -6, exposed: null,
        reply: [ S("So you threatened him to stop him lying, and then he said what you wanted to hear. My Lord, I'll leave that there.") ] },
      { text: "I don't remember my exact words.", kind: 'evasive', cred: -5, exposed: null,
        reply: [
          S("Not your exact words. Your approximate ones, then. They were about what happens to liars?"),
          K("...Something like that."),
          S("Something like that.")
        ] }
    ] },

  { id: 'custody_unsigned', when: 'custody_unsigned',
    q: [ S("Agent, exhibit 14. The night you examined it. From about ten o'clock until nearly four in the morning, where was it?") ],
    answers: [
      { text: "With me. Out of the cage. I told the custodian not to write it down.", kind: 'truth', cred: -3, exposed: null,
        reply: [
          S("Why?"),
          K("Because I didn't want headquarters to know it had been opened before it reached them."),
          S("So for six hours, the only record of that drive's whereabouts is your word."),
          K("Yes, sir.")
        ] },
      { text: "In the cage, sir. It never left.", kind: 'lie', cred: 1,
        reply: [ S("Never left. Then I'm puzzled.") ],
        exposed: [
          S("My Lord, the analyst's worksheet records exhibit 14 'at the forensic bench' from 23:14 until 03:30. Not in the cage. At the bench."),
          S("Did it walk there on its own, Agent?")
        ] },
      { text: "If I'd written it down, Abuja would have known before the drive was copied.", kind: 'combative', cred: -5, exposed: null,
        reply: [
          S("So you hid an exhibit from your own headquarters. My Lord, the witness has a very interesting relationship with his agency."),
          J("Noted.")
        ] },
      { text: "Its custody was with the Zonal Command, sir.", kind: 'evasive', cred: -4, exposed: null,
        reply: [
          S("The Zonal Command is a building, Agent. I asked about a person. Who had it?"),
          K("...I did.")
        ] }
    ] },

  { id: 'original_handed', when: 'original_handed',
    q: [ S("Agent, where is the original exhibit 14 today?") ],
    answers: [
      { text: "I don't know, sir. I handed it to the Abuja escort at five in the morning, as ordered. It hasn't been seen since.", kind: 'truth', cred: -2, exposed: null,
        reply: [
          S("So the only original of this so-called ledger was handed by you to your own agency, which has lost it."),
          K("Yes, sir."),
          S("Careless people, your colleagues.")
        ] },
      { text: "It's safe at headquarters, sir.", kind: 'lie', cred: 1,
        reply: [ S("Safe. Good.") ],
        exposed: [
          S("My Lord, headquarters' own letter, in answer to the defence's subpoena: 'Exhibit 14 cannot be located at this time.'"),
          S("Safe somewhere, perhaps, Agent. Not anywhere anyone can find it.")
        ] },
      { text: "Ask the people in Abuja who wanted it so badly.", kind: 'combative', cred: -4, exposed: null,
        reply: [
          J("Agent. Answer the question you are asked, not the one you would like to be asked."),
          S("I'm happy to repeat it, my Lord. Where is it?"),
          K("I don't know.")
        ] },
      { text: "That's a matter for headquarters, sir.", kind: 'evasive', cred: -3, exposed: null,
        reply: [ S("Everything is, today. I'll take that as 'I don't know'.") ] }
    ] },

  { id: 'method_direct', when: 'method_direct',
    q: [ S("Agent, when exhibit 14 was examined, was it connected through anything that stops a computer writing to it? A write-blocker?") ],
    answers: [
      { text: "No, sir. We plugged it straight into the laptop. I chose speed.", kind: 'truth', cred: -3, exposed: null,
        reply: [
          S("You chose. And the analyst advised otherwise?"),
          K("Yes."),
          S("So you overruled the expert because you were in a hurry. I'm obliged.")
        ] },
      { text: "Yes, sir. A write-blocker was used.", kind: 'lie', cred: 1,
        reply: [ S("A write-blocker. Good.") ],
        exposed: [
          S("My Lord, the prosecution's disclosure includes the drive's file listing. Every file, 'last accessed': that night, between 23:40 and 01:10."),
          S("A write-blocker exists so that does not happen. Was it switched off, Agent?")
        ] },
      { text: "Would you rather we'd sent it to Abuja unread?", kind: 'combative', cred: -5, exposed: null,
        reply: [ S("I'd rather you had read it properly, Agent. The law gave you a way. You didn't take it.") ] },
      { text: "The analyst handled the technical side.", kind: 'evasive', cred: -4, exposed: null,
        reply: [ S("Did the analyst decide how it would be done, or did you?"), K("...I did.") ] }
    ] },

  { id: 'method_photo', when: 'method_photo',
    q: [ S("Agent, how exactly did you 'copy' exhibit 14?") ],
    answers: [
      { text: "I photographed the screen with my phone, file by file.", kind: 'truth', cred: -3, exposed: null,
        reply: [
          S("How many files were on the drive?"),
          K("I'm not certain."),
          S("And how many did you photograph?"),
          K("The ones that mattered."),
          S("Chosen by you.")
        ] },
      { text: "We made a full forensic image, sir.", kind: 'lie', cred: 1,
        reply: [ S("A full image. Then you'll have hash values.") ],
        exposed: [ S("My Lord, there are no hash values anywhere in the proof of evidence. The analyst's worksheet reads: 'No image taken. Officer's instruction. Screens photographed.'") ] },
      { text: "It was that or nothing. Headquarters was coming for it at six.", kind: 'combative', cred: -5, exposed: null,
        reply: [ S("So it was a race, Agent, and you ran it with a phone camera.") ] },
      { text: "The method was appropriate in the circumstances.", kind: 'evasive', cred: -4, exposed: null,
        reply: [ S("Which method, Agent? I'm asking you to name it."), K("Photographs.") ] }
    ] },

  { id: 'statement_car', when: 'statement_car',
    q: [ S("Agent, where was my client's statement taken?") ],
    answers: [
      { text: "In the car, sir, at the jetty, on the night of the arrest. No camera. No lawyer.", kind: 'truth', cred: -2, exposed: null,
        reply: [
          S("Why?"),
          K("Because he was frightened and talking, and I wanted him to keep talking."),
          S("Thank you. That is the most honest answer about a statement I have heard in this building.")
        ] },
      { text: "At Area Command, sir, with a lawyer present.", kind: 'lie', cred: 1,
        reply: [ S("At Area Command. With a lawyer. Good.") ],
        exposed: [
          S("My Lord, the statement is timed 22:40. The arrest report puts the arrest at the jetty at 22:15. Area Command is half an hour away by road."),
          S("Did you fly, Agent? And which lawyer? There's no lawyer's name or signature anywhere on it.")
        ] },
      { text: "Would a lawyer have made him more honest?", kind: 'combative', cred: -4, exposed: null,
        reply: [ S("The law thinks a lawyer would have made him safer, Agent. So does the Supreme Court.") ] },
      { text: "It was taken in the field, sir.", kind: 'evasive', cred: -3, exposed: null,
        reply: [ S("In the field. In a car, in the field?"), K("In a car.") ] }
    ] },

  { id: 'searched_woman_self', when: 'searched_woman_self',
    q: [ S("Agent, at the tank farm. Who searched the third defendant's person, and her handbag?") ],
    answers: [
      { text: "I did, sir. I shouldn't have. It should have been a female officer.", kind: 'truth', cred: -3, exposed: null,
        reply: [
          S("Section 9(3) of the ACJA: 'by a person of the same sex'. You knew that?"),
          K("Yes."),
          S("And did it anyway.")
        ] },
      { text: "A female officer did, sir.", kind: 'lie', cred: 1,
        reply: [ S("A female officer. Which one?") ],
        exposed: [ S("My Lord, the prosecution's own operation order lists every officer on that search. Not one of them is recorded as searching the third defendant, except, in his own notebook, the witness.") ] },
      { text: "She was hiding evidence. There was no time to wait.", kind: 'combative', cred: -5, exposed: null,
        reply: [ S("No time to wait for a woman officer. Plenty of time to search a woman yourself.") ] },
      { text: "The search was conducted professionally.", kind: 'evasive', cred: -4, exposed: null,
        reply: [ S("By whom, Agent?"), K("...By me.") ] }
    ] },

  { id: 'no_warrant', when: 'no_warrant',
    q: [ S("Agent, when you entered the Riverstone tank farm, did you have a search warrant?") ],
    answers: [
      { text: "No, sir. One could have been had within the hour. I decided not to wait.", kind: 'truth', cred: -2, exposed: null,
        reply: [
          S("You decided. A magistrate available, the law perfectly clear, and you decided."),
          K("Yes, sir.")
        ] },
      { text: "Yes, sir. Signed by a magistrate.", kind: 'lie', cred: 1,
        reply: [ S("Signed by a magistrate. Which magistrate?") ],
        exposed: [ S("My Lord, the defence holds a certified extract of the magistrates' warrant register for that day. Nothing for Riverstone Marine. Nothing for the Port Harcourt waterfront at all.") ] },
      { text: "And wait while they shredded everything?", kind: 'combative', cred: -4, exposed: null,
        reply: [
          S("Did you see anything shredded, Agent?"),
          K("No."),
          S("Then you broke the law to prevent something you never saw.")
        ] },
      { text: "It was an operational decision.", kind: 'evasive', cred: -3, exposed: null,
        reply: [ S("Whose?"), K("Mine.") ] }
    ] },

  { id: 'samples_grabbed', when: 'samples_grabbed',
    q: [ S("Agent, the bottle from the camp. When you took it, was it sealed? Labelled? Photographed where it stood?") ],
    answers: [
      { text: "No, sir. I grabbed it from the drum and kept it on me until the laboratory.", kind: 'truth', cred: -2, exposed: null,
        reply: [
          S("On you. In a boat, at night, for how many hours?"),
          K("About fourteen."),
          S("Fourteen hours of 'trust me'.")
        ] },
      { text: "It was sealed at the scene, sir.", kind: 'lie', cred: 1,
        reply: [ S("Sealed. Good.") ],
        exposed: [ S("My Lord, the laboratory's intake form, served by the prosecution: 'One plastic bottle, unsealed, unlabelled.' The laboratory disagrees with you, Agent.") ] },
      { text: "It's diesel from a kpo-fire drum. What else would it be?", kind: 'combative', cred: -3, exposed: null,
        reply: [ S("That is precisely the question a seal answers, Agent.") ] },
      { text: "Procedure was followed as far as practicable.", kind: 'evasive', cred: -3, exposed: null,
        reply: [ S("As far as practicable. Which part of a seal was impracticable?") ] }
    ] },

  { id: 'inventory_skipped', when: 'inventory_skipped',
    q: [ S("Agent, did you give the third defendant a signed inventory of what you took from her, and a copy?") ],
    answers: [
      { text: "No, sir. I didn't.", kind: 'truth', cred: -2, exposed: null,
        reply: [
          S("Section 10 of the ACJA requires it."),
          K("Yes."),
          S("So she was left with nothing to show what was taken. Only your word, again.")
        ] },
      { text: "Yes, sir. She signed it.", kind: 'lie', cred: 1,
        reply: [ S("She signed it. Then there's a copy.") ],
        exposed: [ S("Where is it? My Lord, it is not in the proof of evidence, and my learned friend for the third defendant tells me her client was given nothing at all.") ] },
      { text: "She was a suspect, not a customer.", kind: 'combative', cred: -4, exposed: null,
        reply: [ S("She was a suspect with rights, Agent. The ACJA was written for suspects. Customers have other laws.") ] },
      { text: "Everything seized was documented.", kind: 'evasive', cred: -3, exposed: null,
        reply: [ S("By whom, and where?"), K("In my notebook.") ] }
    ] },

  { id: 'camp_navy', when: 'camp_navy',
    q: [ S("Agent, the camp on the Ekre creek. Where is it now?") ],
    answers: [
      { text: "Gone. I called the Navy, and they burned it.", kind: 'truth', cred: -2, exposed: null,
        reply: [
          S("So the scene of the alleged crime against the second defendant was destroyed on your call, before any defence expert could see it."),
          K("It was burning crude into the creek, sir. Every hour."),
          S("I'm sure it was. Now we will never know how much.")
        ] },
      { text: "The Navy acted on its own operation, sir.", kind: 'lie', cred: 1,
        reply: [ S("On its own. I see.") ],
        exposed: [ S("My Lord, the Navy's own statement to the press that week thanks 'NACECA operatives, led by Agent Kelechi, for the coordinates'.") ] },
      { text: "Would you rather I'd left it poisoning the river?", kind: 'combative', cred: -4, exposed: null,
        reply: [ S("I'd rather you had photographed it first, Agent. The river would have forgiven you an hour.") ] },
      { text: "The camp was dealt with by the appropriate authorities.", kind: 'evasive', cred: -3, exposed: null,
        reply: [ S("At whose request?"), K("Mine.") ] }
    ] },

  { id: 'source_unregistered', when: 'source_unregistered',
    q: [
      S("Agent, the night market, the creek, the tank farm. You found them all very quickly. Somebody pointed the way."),
      S("I don't ask for names. I ask whether your informants were registered with your agency, as its rules require. And whether any were paid.")
    ],
    answers: [
      { text: "Not all of them were registered. That was my failure. Their names stay out of this court, under section 189.", kind: 'truth', cred: -1, exposed: null,
        reply: [
          S("Section 189 protects their names, Agent. It doesn't make them reliable."),
          K("Nothing they told me is in evidence, sir. Only what I saw."),
          S("We shall see.")
        ] },
      { text: "Every source I used was registered, sir.", kind: 'lie', cred: 1,
        reply: [ S("Every one. Good.") ],
        exposed: [ S("My Lord, in answer to the defence's subpoena, the Agency's source register, certified by headquarters, shows at least one person the witness relied on was never entered at all.") ] },
      { text: "You want me to name them, so your client's friends can find them?", kind: 'combative', cred: -5, exposed: null,
        reply: [
          S("My Lord, I asked for no names, and the witness knows it. I'd ask that the remark be noted."),
          J("It is noted, Agent. It does you no credit.")
        ] },
      { text: "Sources are handled according to procedure.", kind: 'evasive', cred: -2, exposed: null,
        reply: [ S("Registered, Agent, yes or no?"), K("Not all.") ] }
    ] },

  { id: 'ninth_bury', when: 'ninth_bury',
    q: [
      S("Agent, congratulations are in order, I'm told. Superintendent. Head of Lagos Cyber and Financial Crimes."),
      S("You were promoted the day you met the Director-General in private. Out of the cycle, with immediate effect. A reward, Agent?")
    ],
    answers: [
      { text: "He offered it to me in that meeting. I accepted.", kind: 'truth', cred: -3, exposed: null,
        reply: [
          S("In exchange for—"),
          N("He stops. A Senior Advocate who has never asked a question he didn't know the answer to, stopping one word short of one."),
          S("No further questions on that, my Lord."),
          J("Are you sure, Mr. Olaniran-Cole? You seemed on the verge of something."),
          S("Quite sure, my Lord.")
        ] },
      { text: "It was a routine promotion, sir.", kind: 'lie', cred: 1,
        reply: [ S("Routine. I see.") ],
        exposed: [
          S("My Lord, the letter, published in the Agency's own bulletin, is dated the day before that meeting, signed by the Director-General personally: 'outside the promotion cycle, with immediate effect'."),
          S("Routine, Agent?")
        ] },
      { text: "My promotion isn't on trial.", kind: 'combative', cred: -5, exposed: null,
        reply: [ S("No. But your reasons are, Agent. A witness who has just been rewarded is a witness the court must watch.") ] },
      { text: "Promotions are a matter for the Board.", kind: 'evasive', cred: -4, exposed: null,
        reply: [ S("And this one? The Board, or the man you met on the ninth floor?"), K("...The Director-General signed it.") ] }
    ] },

  { id: 'ninth_refuse', when: 'ninth_refuse',
    q: [
      S("Agent, as you stand in that box, are you a suspended officer?"),
      S("Suspended by your own Director-General, pending an inquiry into your conduct at Ekosodin. A man with a grievance against his agency, and every reason to make this case his vindication?")
    ],
    answers: [
      { text: "I was suspended the morning I refused to hand this file to headquarters. I have no grievance, sir. I have a case.", kind: 'truth', cred: -2, exposed: null,
        reply: [
          S("My Lord, I'd ask that the answer be confined to the question."),
          J("It answered your question very fully, Mr. Olaniran-Cole. You asked about his reasons. It stays."),
          J("Agent, the Director-General is not before me. Keep to what you know.")
        ] },
      { text: "I'm on leave, sir.", kind: 'lie', cred: 1,
        reply: [ S("On leave. How restful.") ],
        exposed: [
          S("My Lord, the letter served on the defence by the Agency, in answer to our subpoena: 'You are hereby suspended from duty, pending an inquiry.' Signed for the Director-General."),
          S("A strange sort of leave, Agent.")
        ] },
      { text: "Ask the Director-General why he wanted this file so badly.", kind: 'combative', cred: -4, exposed: null,
        reply: [
          J("Agent. You will not make speeches about people who are not here to answer them."),
          S("I'm obliged, my Lord.")
        ] },
      { text: "That is an internal administrative matter.", kind: 'evasive', cred: -3, exposed: null,
        reply: [ S("Internal. Suspended or not, Agent?"), K("Suspended.") ] }
    ] },

  { id: 'adaeze_proven', when: 'adaeze_proven',
    q: [
      S("Agent, your former commander, Commander Adaeze. She is in prison, on your evidence."),
      S("A career built on your commander's downfall. And now you need a bigger one. Is this case your encore?")
    ],
    answers: [
      { text: "She trained me. I gave evidence against her because it was true. I'd have given anything for it not to be.", kind: 'truth', cred: -1, exposed: null,
        reply: [ S("Very affecting."), J("It was an answer, Mr. Olaniran-Cole. Move on.") ] },
      { text: "I barely knew her, sir.", kind: 'lie', cred: 1,
        reply: [ S("Barely. I see.") ],
        exposed: [ S("My Lord, the witness's posting letter to the Lagos unit, signed by Commander Adaeze. And the citation for his first commendation, written in her hand. Barely, Agent?") ] },
      { text: "She put a student in a box. Somebody had to stop her.", kind: 'combative', cred: -3, exposed: null,
        reply: [ S("And you were glad it was you.") ] },
      { text: "My relationship with her is irrelevant.", kind: 'evasive', cred: -2, exposed: null,
        reply: [ S("Is it? Her case and this one: same drive, same witness.") ] }
    ] },

  { id: 'adaeze_contested', when: 'adaeze_contested',
    q: [
      S("Agent, Commander Adaeze awaits her trial. You are the chief witness against her."),
      S("This case uses the same drive. Forgive me. Is this the rehearsal?")
    ],
    answers: [
      { text: "No, sir. Her case is hers. This one is about the money at T4.", kind: 'truth', cred: -2, exposed: null,
        reply: [ S("And if you win this one, does hers get easier?"), K("...It might."), S("Thank you.") ] },
      { text: "I'm not involved in her case.", kind: 'lie', cred: 1,
        reply: [ S("Not involved. Good.") ],
        exposed: [ S("My Lord, the list of witnesses filed in the Commander's own trial. The first name on it is this witness's.") ] },
      { text: "If her lawyers want me, they know where to find me.", kind: 'combative', cred: -4, exposed: null,
        reply: [ S("So do I, Agent. Every Monday, it seems.") ] },
      { text: "That matter is sub judice.", kind: 'evasive', cred: -3, exposed: null,
        reply: [ S("So it is. You know the phrase. You'll also know you are its principal witness.") ] }
    ] },

  { id: 'adaeze_unproven', when: 'adaeze_unproven',
    q: [
      S("Agent, you accused your own commander. She was never charged. The Agency found nothing it could prosecute."),
      S("And ever since, you have been trying to prove yourself right. Isn't this case your second attempt?")
    ],
    answers: [
      { text: "She was never charged. I still believe what I saw. This case doesn't depend on her.", kind: 'truth', cred: -2, exposed: null,
        reply: [ S("'I still believe.' Belief, my Lord. On the witness's word.") ] },
      { text: "I never accused her of anything, sir.", kind: 'lie', cred: 1,
        reply: [ S("Never. Then help me with this.") ],
        exposed: [ S("My Lord, the witness's written report to Benin Zonal Command on the night of Ekosodin, the one his commander was relieved of command over. Page one names her. In his handwriting.") ] },
      { text: "Somebody protected her. You'll forgive me for wanting to know who.", kind: 'combative', cred: -4, exposed: null,
        reply: [ J("Agent, this courtroom is not your inquiry."), S("I'm obliged, my Lord.") ] },
      { text: "That was a different investigation.", kind: 'evasive', cred: -3, exposed: null,
        reply: [ S("A different investigation. The same drive, the same officer.") ] }
    ] },

  { id: 'lucky_followed', when: 'lucky_followed',
    q: [ S("Agent, at the jetty you watched my client hand two bags to a boatman. You had officers with you. You let him go. Why?") ],
    answers: [
      { text: "To follow the money upriver, sir. I made that choice.", kind: 'truth', cred: -2, exposed: null,
        reply: [
          S("And did you recover those bags that night?"),
          K("Not that night."),
          S("So, no money from that jetty, and a man arrested two days later in another town.")
        ] },
      { text: "We lost him in the crowd, sir.", kind: 'lie', cred: 1,
        reply: [ S("Lost him. A pity.") ],
        exposed: [ S("My Lord, the witness's own radio log, served by the prosecution: 'Let them go. We follow the money.' Your words, Agent?") ] },
      { text: "Arresting him then would have told the whole network we were coming.", kind: 'combative', cred: -3, exposed: null,
        reply: [ S("So my client was bait. How very efficient.") ] },
      { text: "It was a tactical decision.", kind: 'evasive', cred: -3, exposed: null,
        reply: [ S("Yours?"), K("Mine.") ] }
    ] },

  { id: 'camp_mass', when: 'camp_mass',
    q: [ S("Agent, how many people did you arrest at the camp?") ],
    answers: [
      { text: "Everyone we found there. Nine.", kind: 'truth', cred: -2, exposed: null,
        reply: [
          S("And how many of them are before this court?"),
          K("One."),
          S("So eight people were arrested for being poor near a fire.")
        ] },
      { text: "Only those directly involved, sir.", kind: 'lie', cred: 1,
        reply: [ S("Directly involved. How many?") ],
        exposed: [ S("My Lord, the custody register of the Area Command for that morning: nine entries, one charge. Directly involved, Agent?") ] },
      { text: "They were all working that camp.", kind: 'combative', cred: -3, exposed: null,
        reply: [ S("Then why charge one?"), K("...") ] },
      { text: "Arrests were made in line with the operation.", kind: 'evasive', cred: -3, exposed: null,
        reply: [ S("Nine of them. I'm obliged.") ] }
    ] }
];

/* =========================================================================
   RE-EXAMINATION — the player picks one; confined to matters raised in cross
   (Evidence Act s.215). `fixes` = the cross ids it repairs.
   ========================================================================= */
C.reexam = [
  { id: 'rx_hearsay', fixes: ['hearsay'],
    ask: [ D("PW1, my learned friend asked whether you saw crude oil stolen. Tell the court what you did see, yourself.") ],
    answer: [ K("A camp cooking crude into diesel in open drums. The barge TEKENA 2 at its landing. Diesel in Tank 3 in Port Harcourt. And the first defendant drawing cash at T4 with four cards in four names.") ],
    cred: 3 },
  { id: 'rx_custody', fixes: ['custody_unsigned', 'original_handed', 'method_direct', 'method_photo'],
    ask: [ D("PW1, why was exhibit 14 examined that night, and not later?") ],
    answer: [ K("Because at six the next morning it was leaving Benin on an order to headquarters. I wanted something this court could see, in case it never came back."),
              K("That's why I hurried. Where I cut corners, I've told you myself.") ],
    cred: 2 },
  { id: 'rx_statement', fixes: ['statement_threat', 'statement_car'],
    ask: [ D("PW1, setting the first defendant's statement aside entirely: where does your evidence about the money at T4 come from?") ],
    answer: [ K("From my own eyes at that kiosk, and from the records. Not from anything he said to me.") ],
    cred: 2 },
  { id: 'rx_search', fixes: ['no_warrant', 'searched_woman_self', 'inventory_skipped'],
    ask: [ D("PW1, you were asked about the search at Riverstone. Is there anything about it the court has not heard?") ],
    answer: [ K("No, my Lord. The court has heard all of it, the good and the bad, from me. I'd rather it heard it from me.") ],
    cred: 2 },
  { id: 'rx_bribe', fixes: ['bribe'],
    ask: [ D("PW1, why did you answer my learned friend's question about Chief Obi the way you did?") ],
    answer: [ K("Because it was true. If I lie to this court about the worst thing I have done, it can't believe me about anything else.") ],
    cred: 2 },
  { id: 'rx_promotion', fixes: ['ninth_bury'],
    ask: [ D("PW1, you were asked about your promotion. When it was offered, what was said to you, and by whom?") ],
    answer: [
      K("In the Director-General's office, on the ninth floor. He said the Upstream file should come home to headquarters. Then he offered me Lagos."),
      S("My Lord, the Director-General is not on trial!"),
      J("Neither is the witness's promotion, Mr. Olaniran-Cole. You raised it. Overruled.")
    ],
    cred: 3 },
  { id: 'rx_suspension', fixes: ['ninth_refuse'],
    ask: [ D("PW1, when were you suspended, and what had happened that day?") ],
    answer: [
      K("That same morning. I was asked to hand the Upstream file to headquarters. I said it would stay with Zonal. Before noon I'd been told to leave my ID card at the desk."),
      S("My Lord, the inquiry is into Ekosodin."),
      J("So the letter says. The court has heard both, and will weigh both.")
    ],
    cred: 3 },
  { id: 'rx_vendetta', fixes: ['adaeze_proven', 'adaeze_contested', 'adaeze_unproven'],
    ask: [ D("PW1, what was Commander Adaeze to you?") ],
    answer: [ K("She signed my posting. She taught me chain of custody. Everything I did right in this case, she taught me. Everything I did wrong, I can't blame on her.") ],
    cred: 2 },
  { id: 'rx_sources', fixes: ['source_unregistered'],
    ask: [ D("PW1, has anything an informant told you been given in evidence in this court?") ],
    answer: [ K("No, my Lord. Only what I saw, and what the records show. Whatever anyone whispered to me stays outside this room.") ],
    cred: 2 },
  { id: 'rx_camp', fixes: ['camp_navy', 'camp_mass', 'samples_grabbed'],
    ask: [ D("PW1, describe the camp as you saw it, before anything was done to it.") ],
    answer: [ K("Forty-odd drums over open fires. Smoke you could taste. The creek under the landing was the colour of engine oil, and nothing moved in it.") ],
    cred: 1 },
  { id: 'rx_followed', fixes: ['lucky_followed'],
    ask: [ D("PW1, why did you let the boat go that night?") ],
    answer: [ K("Because those bags were going somewhere, and I needed to know where. They took us up the Ekre creek, to the camp.") ],
    cred: 2 }
];

/* =========================================================================
   OTHER PROSECUTION WITNESSES (Day 2). The engine picks:
   analyst: pw_igbinosa* in every save (CN06; pw_tobi* are retired, unused); suffix by method
            (none = image, _direct, _photo).  custodian: pw_ikpe, or pw_ikpe_gap
            if custody_unsigned.  pw_ejiro if ejiro_source.  pw_sotonye (or
            pw_sotonye_pressured if sotonye_pressured) if her plea was taken.
            pw_felix if his plea was taken.
   ========================================================================= */
C.witnesses = {
  /* RETIRED (CN06): pw_tobi, pw_tobi_direct, pw_tobi_photo. Mr. Igbinosa is PW2 in every save;
     these stay in the file, unused, so old references resolve. */
  pw_tobi: [
    N("PW2 · TOBI ONUOHA, FORENSIC ANALYST. He takes the oath with both hands on the book, as if it might get away."),
    D("Mr. Onuoha, what did you do with exhibit 14?"),
    T("I connected it through a write-blocker, a device that lets a computer read a drive without writing to it. Then I made a forensic image."),
    T("Before and after, I calculated a SHA-256 hash of the drive and of the image. A hash is a fingerprint. Change one letter and it changes completely. They matched."),
    D("And the certificate?"),
    T("I signed it that night, under section 84. The computer was working properly. The image is a true copy."),
    S("Mr. Onuoha, I'm told you owe Agent Kelechi your life. Asaba, wasn't it?"),
    T("Yes, sir. That's why I did it properly. He wouldn't have wanted it any other way. Neither would I."),
    S("Your hash proves the copy matched the drive on that night. It can't tell us what was on the drive before it ever reached Benin, can it?"),
    T("No, sir. It proves nobody has touched it since.")
  ],
  pw_tobi_direct: [
    N("PW2 · TOBI ONUOHA, FORENSIC ANALYST."),
    D("Mr. Onuoha, how was exhibit 14 examined?"),
    T("Directly, ma. Plugged into my laptop. I suggested a write-blocker and a proper image; it would have taken forty minutes. The agent decided we didn't have them."),
    D("Did opening the files change what was in them?"),
    T("No, ma. Opening a file changes the date it was last read, not what it says. Every 'last modified' date on that drive is from before it was seized."),
    S("Mr. Onuoha, without a write-blocker, can you swear the operating system wrote nothing at all to that drive?"),
    T("...No, sir. It writes small things. Index files. Not the documents."),
    S("Small things. Written by a machine, at night, onto the only original. And you owe the agent your life, I believe?"),
    T("I do, sir. It didn't change a single one of my answers.")
  ],
  pw_tobi_photo: [
    N("PW2 · TOBI ONUOHA, FORENSIC ANALYST."),
    D("Mr. Onuoha, how was exhibit 14 examined?"),
    T("The agent photographed the screen with his phone while I scrolled. I said we should image it. He said there wasn't time."),
    D("Do the photographs show what was on the screen?"),
    T("Yes, ma. I scrolled, he shot. Nothing was edited."),
    S("Did you photograph every file on the drive?"),
    T("No, sir. The ones he asked for."),
    S("So the court sees what the agent chose to see."),
    T("The court sees what was on the screen, sir. Not everything that was on the drive. I'd have liked it to be everything.")
  ],
  pw_igbinosa: [
    N("PW2 · MR. IGBINOSA, ZONAL FORENSIC OFFICER. Nineteen years in the job. He answers as if each word is billed separately."),
    D("Mr. Igbinosa, what did you do with exhibit 14?"),
    I("Write-blocker. Forensic image. Hashed the drive, hashed the image, SHA-256. They matched. Signed the certificate under section 84 at 01:52."),
    J("Slower, Mr. Igbinosa. Some of us are writing."),
    I("My apologies, my Lord. Write. Blocker."),
    S("Mr. Igbinosa, in nineteen years, how many drives have you imaged at midnight because a field agent asked you to?"),
    I("One, sir."),
    S("This one."),
    I("And it was done properly, sir. That is the only unusual thing about it.")
  ],
  pw_igbinosa_direct: [
    N("PW2 · MR. IGBINOSA, ZONAL FORENSIC OFFICER."),
    D("Mr. Igbinosa, how was exhibit 14 examined?"),
    I("Plugged straight in. The agent's decision. I told him every file's access date would say tonight. He said, 'Then they'll say tonight.'"),
    D("Did opening the files change their contents?"),
    I("No. It changes when they were read. What they say, it doesn't touch. The modified dates are all from before the seizure."),
    S("Did you object to the method, Mr. Igbinosa?"),
    I("I wrote it down, sir. That is how a forensic officer objects."),
    S("And is it written down?"),
    I("Page two of my worksheet. You have it. You've underlined it.")
  ],
  pw_igbinosa_photo: [
    N("PW2 · MR. IGBINOSA, ZONAL FORENSIC OFFICER."),
    D("Mr. Igbinosa, how was exhibit 14 examined?"),
    I("He photographed the screen with his phone. I offered him a forensic image in forty minutes. He said he didn't have forty minutes."),
    S("And did he?"),
    I("He had until six, sir. It was eleven."),
    S("So the method was a choice, not a necessity."),
    I("Everything is a choice, sir. Some are written down. I wrote that one down.")
  ],
  pw_ikpe: [
    N("PW3 · SGT. IKPE, EXHIBIT CUSTODIAN, BENIN ZONAL COMMAND. Twenty-two years. He carries the register in a plastic bag, wrapped like a Bible."),
    D("Sergeant, what does your register show for exhibit 14 on the night in question?"),
    IK("Twenty-three-oh-four: signed out to Agent Kelechi for forensic imaging, seal intact. Zero-three-forty: returned, new seal, new number recorded, signed by both of us."),
    D("Who made those entries?"),
    IK("Me, ma. In this hand. Nobody writes in my book except me."),
    S("Sergeant, in twenty-two years, has anyone ever asked you not to write something in that book?"),
    IK("Asked, sir? Yes."),
    S("And?"),
    IK("And it's in the book, sir. Everything is in the book."),
    S("...No further questions, my Lord.")
  ],
  pw_ikpe_gap: [
    N("PW3 · SGT. IKPE. He holds the register on his knees and does not open it until he is asked."),
    D("Sergeant, is there an entry for exhibit 14 on the night in question?"),
    IK("No, ma."),
    D("Why not?"),
    IK("Agent Kelechi said, 'Sergeant, tonight this never left the cage.' I didn't write it. I should have. Twenty-two years, and that's the only blank I ever left."),
    D("Did it leave the cage?"),
    IK("Just after eleven. It came back before four."),
    S("Sergeant, the seal on that bag today. Is it the seal number in your book?"),
    IK("...No, sir. The seal in my book is the old one. The new one, I never wrote down."),
    S("So the register this court is asked to trust is accurate, except on the one night that matters?"),
    IK("Yes, sir. Except that night.")
  ],
  pw_ejiro: [
    N("PW4 · EJIRO, POS OPERATOR, KIOSK T4. A borrowed tie, and the stillness of a young man who has been told to keep his hands still."),
    D("Mr. Ejiro, do you know the first defendant?"),
    E("Yes ma. Na Oga Lucky. Every Thursday him dey come my kiosk with plenty card.", "Yes ma. That's Oga Lucky. Every Thursday he comes to my kiosk with lots of cards."),
    D("What did he do with the cards?"),
    E("Withdraw. One card, one million one hundred and something. Next card, the same. E no dey ever pass the limit.", "Withdraw. One card, one million one hundred and something. The next card, the same. Never over the limit."),
    D("Were you paid for this?"),
    E("Five thousand naira per card, ma. My cut. I no go lie for this court.", "Five thousand naira a card, ma. My cut. I won't lie to this court."),
    S("Mr. Ejiro, you took my client's money every Thursday for months. Now you help the people who could have arrested you. Which is your real employer?"),
    E("Sir, na my conscience. E don tire me.", "Sir, it's my conscience. I got tired of it."),
    S("Your conscience took five thousand naira a card."),
    E("Yes sir. Now e dey pay me back.", "Yes, sir. Now it's paying me back.")
  ],
  pw_sotonye: [
    N("PW5 · SOTONYE JUMBO, CONVICTED ON HER OWN PLEA. Four steps from the dock to the witness box. The longest walk in the room."),
    D("Ms. Jumbo, where did the diesel in Tank 3 come from?"),
    SO("From the barge TEKENA 2. Every load. We entered it in the official book as 'imported AGO'. The true log was on my USB."),
    D("Why did you keep a true log?"),
    SO("Insurance. In my business, the person who keeps the true record is the last person they can afford to lose."),
    D("Who owns Riverstone Marine Services?"),
    SO("On paper, Godwin Ereba. He signs everything. I've never seen him read anything he signed."),
    D("Who is Godwin Ereba?"),
    SO("He's a driver. He drives for Senator Tonye Douglas-Akpan. I've seen him do it, many times, at our gate."),
    S("My Lord, I object. A distinguished Senator of this Republic is not a party to these proceedings, and—"),
    J("The witness was asked who Mr. Ereba is, and she has told me what she has seen. The answer stands. Sit down, Mr. Olaniran-Cole."),
    S("Ms. Jumbo, you've bargained your way out of the dock with these words. Your freedom, for his name?"),
    SO("My sentence for the truth, sir. My freedom I lost the day I kept that USB.")
  ],
  pw_sotonye_pressured: [
    N("PW5 · SOTONYE JUMBO, CONVICTED ON HER OWN PLEA. She does not look at the second row. She has decided not to."),
    D("Ms. Jumbo, where did the diesel in Tank 3 come from?"),
    SO("From the barge TEKENA 2. Every load. We entered it in the official book as 'imported AGO'. The true log was on my USB."),
    D("Who owns Riverstone Marine Services?"),
    SO("On paper, Godwin Ereba. He signs everything. He drives for Senator Tonye Douglas-Akpan. I've seen him do it, many times, at our gate."),
    S("My Lord, I object. A Senator of this Republic is not a party to—"),
    J("She has told me what she has seen. The answer stands."),
    S("Ms. Jumbo, when you were arrested, did the investigating officer tell you to 'think about your children'?"),
    SO("...Yes."),
    S("And here you are, saying what he wants. Thinking of them."),
    SO("I am always thinking of them, sir. That's why I'm telling the truth now. So they don't grow up on that waterfront."),
    N("The judge writes for a long time. Then underlines one line twice.")
  ],
  pw_felix: [
    N("PW6 · FELIX UGBEKILE, CONVICTED ON HIS OWN PLEA. Twenty years ago he was a production engineer. He still stands like one."),
    D("Mr. Ugbekile, what happened at the Ekre camp?"),
    F("We cooked stolen crude in drums over open fires. The light ends come off first, then diesel. What's left goes into the creek."),
    D("Where did the diesel go?"),
    F("Onto the barge TEKENA 2. To the Riverstone tank farm in Port Harcourt."),
    D("And the money?"),
    F("Came back through Sapele. Cash. A changer there drew it out and sent it upriver by boat, to pay the boys and the escorts."),
    S("Mr. Ugbekile, did you ever once meet my client?"),
    F("No, sir. I only ever met his bags."),
    S("Then you cannot tell this court what he knew."),
    F("No, sir. I can tell the court what was in the bags.")
  ]
};

/* =========================================================================
   TRIAL-WITHIN-TRIAL on Lucky's statement (Day 2, only if challenged).
   Each scene contains its own ruling.
   ========================================================================= */
C.twt = {
  proper: [
    N("TRIAL-WITHIN-TRIAL · the voluntariness of the first defendant's statement. The main trial pauses. A television is wheeled in on a trolley with one bad wheel."),
    J("The burden is on the prosecution, beyond reasonable doubt. Section 29(2). Counsel."),
    D("My Lord, the prosecution plays the recording made at Area Command, tendered for this purpose with its certificate under section 84."),
    N("On screen: Lucky in a plastic chair. Beside him, Barr. Ese Omoregie of the Legal Aid Council. A bottle of water. The officer tells him, twice, that he may stop whenever he likes."),
    N("On the recording, Lucky corrects a figure the officer has written down, and laughs: 'Na my fuel business o. I no know say anything dey wrong.'", "On the recording, Lucky corrects a figure the officer has written down, and laughs: 'It's my fuel business. I didn't know anything was wrong.'"),
    LU("Dem frighten me before the camera on, my Lord.", "They frightened me before the camera came on, my Lord."),
    D("Mr. Edafe, on that recording you laugh. Twice. Were you frightened then?"),
    LU("...Na nervous laugh.", "...It was a nervous laugh."),
    J("Ruling. The recording shows a man at ease, with his own counsel at his side, told more than once that he could stop. Voluntariness is proved beyond reasonable doubt."),
    J("That the first defendant now says the statement is untrue goes to its weight, not its admissibility. Omoha v State. The statement is admitted and marked {EXH}."),
    S("I'm obliged, my Lord. We will address you on its weight. My client still sells fuel.")
  ],
  car: [
    N("TRIAL-WITHIN-TRIAL · the admissibility of the first defendant's statement. PW1 is recalled."),
    S("Agent, was the statement recorded on video?"),
    K("No, sir."),
    S("Was a lawyer present? Anyone from the Legal Aid Council? A Justice of the Peace? Anyone at all of my client's choosing?"),
    K("No, sir. My sergeant and myself."),
    S("And where were you?"),
    K("In the car. At the jetty."),
    D("My Lord, the defendant spoke freely. Nobody laid a hand on him."),
    J("I accept that, Counsel. It isn't the question. Sections 15(4) and 17(2) of the ACJA are the question, and the Supreme Court has answered it."),
    J("Both are mandatory. A statement taken without them cannot be admitted."),
    J("The statement is rejected. And even if it had been admitted, what one defendant says is not evidence against another. Section 29(4). Whatever he said about anyone else stays in that car.")
  ],
  threat: [
    N("TRIAL-WITHIN-TRIAL · the defence alleges oppression. The main trial pauses."),
    LU("Oga Kelechi talk say make dem show me wetin dey happen to people wey dey lie. The sergeant come stand for my front. I fear. I talk everything.", "Oga Kelechi said they should show me what happens to people who lie. The sergeant came and stood in front of me. I was afraid. I said everything."),
    D("My Lord, the prosecution calls Sergeant Uche, within the trial."),
    N("Sgt. Uche takes the oath. He answers every question in the same level voice, and never once looks at the second row."),
    N("Under cross-examination, Uche: 'He said, \"Uche, show him what happens to people who lie to us.\" I stood where the man could see me. I didn't touch him. I didn't need to.'"),
    S("Agent Kelechi, do you dispute your sergeant's account?"),
    K("No, sir."),
    J("Ruling. The words were spoken, and the sergeant stood where the defendant could see him. The law defines oppression to include the threat of violence. Section 29(5)."),
    J("The prosecution has not proved, beyond reasonable doubt, that this statement was not obtained by oppression. Section 29(2). It is excluded."),
    J("Section 30 preserves any fact discovered because of it. It preserves nothing else. Agent, that sentence was for you."),
    N("On his way out, Uche stops at the second row, just for a moment. 'Slower,' he says quietly. 'But it holds. Remember?'")
  ]
};

/* =========================================================================
   NO-CASE SUBMISSION (ACJA ss.302–303) — per defendant still on trial
   ========================================================================= */
C.nocase = {
  submit: [
    D("My Lord, that is the case for the prosecution."),
    N("Olaniran-Cole is on his feet before the judge has finished writing the sentence."),
    S("My Lord, the first defendant makes a no-case submission under sections 302 and 303 of the ACJA."),
    S("Take away what this court has rejected, and what the witness did not see. What remains? A man drawing cash at a kiosk. That is not a crime in Nigeria. Not yet."),
    S("The prosecution must have some evidence on every element: that the money was the proceeds of an unlawful act, and that he knew or ought to have known it. On at least one of them, there is nothing."),
    D("My Lord, at this stage the court does not weigh credibility. It asks only whether there is evidence on each element which, if believed, could support a conviction. There is."),
    J("Section 303(3) gives me four questions. I have asked them. Ruling.")
  ],
  d1_overruled: [
    J("There is evidence that the first defendant drew the money; evidence, if believed, that it was the proceeds of unlawful activity; and evidence from which knowledge may be inferred."),
    J("Section 18(9) of the Act permits exactly that inference."),
    J("Whether I believe it is a question for the end of the trial, not for now. The submission is overruled. The first defendant has a case to answer."),
    S("I'm obliged, my Lord. He will answer it.")
  ],
  d1_upheld: [
    J("The prosecution had to place before me some evidence that the money at T4 was the proceeds of an unlawful act."),
    J("What would have shown it was either never tendered, or did not survive the rules of evidence."),
    J("An essential element is unproved. Section 303(3)(a). I record a finding of not guilty on count one, and the first defendant is discharged."),
    N("Lucky looks at his lawyer as if he has just been handed a winning ticket. His lawyer is already packing his bag.")
  ],
  d2_overruled: [
    LA("My Lord, for the second defendant: nobody saw him refine anything. He was found near a fire."),
    J("He was found at the camp, among its product, by a witness who described it. There is evidence on each element. The second defendant has a case to answer.")
  ],
  d2_upheld: [
    LA("My Lord, for the second defendant: what remains is a man found near a fire that no longer exists."),
    J("I agree. The evidence that he dealt in the product either did not survive or was never laid. I record a finding of not guilty on count two. The second defendant is discharged.")
  ],
  d3_overruled: [
    LA("My Lord, for the third defendant: a manager stores what she is told to store, under her company's licence."),
    J("There is evidence, if believed, that what she stored came off TEKENA 2 and that she knew it. That is enough at this stage. The third defendant has a case to answer.")
  ],
  d3_upheld: [
    LA("My Lord, for the third defendant: without what this court has excluded, there is no evidence she knew where that diesel came from."),
    J("There is diesel in a tank she managed. There is nothing admissible to show she knew its origin. I record a finding of not guilty on count three. The third defendant is discharged.")
  ]
};

/* =========================================================================
   DEFENCE CASE (Day 3)
   ========================================================================= */
C.defence = {
  lucky: [
    N("DW1 · LUCKY EDAFE. He takes the oath, and then, before anyone asks him anything, waves at the gallery."),
    J("Mr. Edafe. The gallery is not giving evidence."),
    S("Mr. Edafe, what do you do for a living?"),
    LU("I sell fuel, sir. Jerrycan. Generator people for the market: barbers, welders, the women with freezers. And I change money for traders."),
    S("The cards you used at the kiosk. Whose were they?"),
    LU("My boys own, sir. Boys wey dey sell for me. I dey keep their card make dem no chop the money.", "My boys', sir. Boys who sell for me. I keep their cards so they don't spend the money."),
    S("Where did the money in those accounts come from?"),
    LU("Customers, sir. Transfer. I no dey ask person wetin him money be. Na market.", "Customers, sir. Transfers. I don't ask anyone what their money is. It's a market."),
    S("Did you know that money came from crude oil, or from anything unlawful?"),
    LU("God forbid, sir. If I know, I go withdraw am for open market, for machine wey get sticker?", "God forbid, sir. If I'd known, would I withdraw it in an open market, at a machine with a sticker on it?"),
    S("No further questions, my Lord."),
    N("It is not a bad answer. Several people in the gallery nod. Danladi turns to the second row and holds out her hand for a note.")
  ],
  suggest: [
    { text: "Ask him what a fuel seller pays for upriver, at night, where there's no depot.", good: true,
      lines: [
        D("Mr. Edafe, you sell fuel. Where do you buy it?"),
        LU("Depot, ma. Warri. Sometimes Sapele."),
        D("Then help the court. Your money went the other way. Upriver, at night, in two bags, to a boatman. There is no depot up the Ethiope, Mr. Edafe."),
        LU("Na... na for the boys. Dem dey buy... local product.", "It's... it's for the boys. They buy... local product."),
        D("Local product. From the camps on the creek."),
        N("Olaniran-Cole stops writing. For the first time in the trial, he puts his pen down."),
        D("No further questions, my Lord.")
      ] },
    { text: "Ask him if he knows Senator Douglas-Akpan.", good: false,
      lines: [
        D("Mr. Edafe, do you know Senator Tonye Douglas-Akpan?"),
        S("Objection, my Lord. Relevance. My learned friend is fishing in a very large pond."),
        J("Sustained. Counsel, the Senator is not on this charge sheet. Ask about what is."),
        N("At the back of the gallery, a man in a dark agbada writes something down and leaves.")
      ] },
    { text: "Ask him how a fuel seller came to own a house in Warri.", good: false,
      lines: [
        D("Mr. Edafe, how does a fuel seller come to own a four-bedroom house in Warri?"),
        S("Objection, my Lord. There is no evidence of any house in Warri before this court. My learned friend is giving evidence from the bar."),
        J("Sustained. Counsel, if you had a house, you should have tendered it."),
        LU("Na rent sef.", "It's rented, anyway.")
      ] }
  ],
  addresses: [
    N("FINAL WRITTEN ADDRESSES · filed, served, and adopted in open court."),
    N("The defence: the investigator saw no crime; the documents are anonymous, uncertified or tainted; the first defendant sells fuel and handles cash; suspicion, however strong, is not proof."),
    N("The prosecution: withdrawals just under the limit, four names on one BVN, sacks to a boatman at night, cash-outs that follow a barge."),
    N("And section 18(9), which lets knowledge be inferred from exactly such facts."),
    J("I am grateful to learned counsel on both sides. This matter is adjourned for judgment.")
  ]
};

/* =========================================================================
   JUDGMENT
   ========================================================================= */
const NM = {
  drive_image: 'the copy of exhibit 14',
  upstream_ledger: 'the UPSTREAM ledger',
  evidence_register: 'the Benin exhibit register',
  pos_t4_log: 'the T4 transaction log',
  bvn_link: 'the BVN and account records',
  cash_bundles: 'the ₦9.6 million recovered',
  lucky_statement: "the first defendant's statement",
  fuel_samples: 'the camp samples',
  waybill_book: 'the Riverstone waybill book',
  felix_phone: "the escort's phone",
  barge_track: 'the TEKENA 2 tracker log',
  loading_log: 'the true loading log',
  tank3_sample: 'the Tank 3 sample',
  cac_record: 'the CAC record',
  bank_trail: "Riverstone's statements of account",
  gate_register: 'the gate register'
};
const PLURAL = { bvn_link: true, fuel_samples: true, bank_trail: true };
const adm   = (ev) => (ev && Array.isArray(ev.admitted)) ? ev.admitted : [];
const has   = (ev, id) => adm(ev).indexOf(id) >= 0;
const wt    = (ev, id) => (ev && ev.weight && ev.weight[id]) || 'full';
const wit   = (ev, w) => !!(ev && Array.isArray(ev.witnesses) && ev.witnesses.indexOf(w) >= 0);
const crd   = (ev) => (ev && typeof ev.cred === 'number') ? ev.cred : 50;
const pw1ok = (ev) => crd(ev) >= 40;
const cap   = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
const top   = (a, n) => a.slice(0, n);
/* nouns: "a, b and c"   clauses: "a; b; and c" */
const nouns   = (a) => a.length === 0 ? '' : a.length === 1 ? a[0] : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
const clauses = (a) => a.length === 0 ? '' : a.length === 1 ? a[0] : a.slice(0, -1).join('; ') + '; and ' + a[a.length - 1];
const goneIds = (ev, ids) => ids.filter((id) => !has(ev, id));
const notBefore = (ids) => ids.length ? ': ' + nouns(ids.map((id) => NM[id])) + ((ids.length > 1 || PLURAL[ids[0]]) ? ' were' : ' was') + ' not before me' : '';
const lighter = (ev, ids) => { const r = ids.filter((id) => has(ev, id) && wt(ev, id) === 'reduced').map((id) => NM[id]);
  return r.length ? ' I give reduced weight to ' + nouns(r) + '.' : ''; };

C.judgment = {
  open: [
    N("THREE WEEKS LATER · COURT 5. Every seat is taken. The fans, for once, are working."),
    U("Court! All rise."),
    J("Judgment. The prosecution must prove every element of every count against a defendant who pleaded not guilty, beyond reasonable doubt. Section 135 of the Evidence Act. A defendant proves nothing."),
    J("I have reminded myself that suspicion is not proof, that an honest witness may still be mistaken, and that the evidence of an accomplice needs support before I act on it. Section 198."),
    J("I have also reminded myself that the kidnappings mentioned in some of this evidence are not before this court. This court is concerned with crude oil, and with money."),
    J("I take the elements in turn.")
  ],
  /* Each element: (ev) => one to three short sentences naming what carries it or what is missing.
     ev = { admitted: [ids], weight: { id: 'full'|'reduced' }, witnesses: ['sotonye', ...], cred: 0..100 } */
  element: {
    e1a_yes: (ev) => {
      const p = [];
      if (pw1ok(ev)) p.push('PW1 watched him make four withdrawals in a row at T4');
      if (has(ev, 'pos_t4_log')) p.push('the T4 log records each one');
      if (has(ev, 'bvn_link')) p.push('the BVN records tie all four accounts to him');
      if (has(ev, 'lucky_statement')) p.push('his own statement admits the withdrawals');
      if (wit(ev, 'ejiro')) p.push('the operator describes them and is corroborated in doing so');
      if (has(ev, 'cash_bundles')) p.push('₦9.6 million was recovered in bundles');
      const lead = top(p, 3);
      lead.push('he himself says he drew it for his fuel business');
      return 'That the first defendant drew and moved this money is hardly in dispute: ' + clauses(lead) + '. Element (a) of count one is proved.' + lighter(ev, ['pos_t4_log', 'bvn_link']);
    },
    e1a_no: (ev) => {
      const miss = goneIds(ev, ['pos_t4_log', 'bvn_link']);
      const first = miss.length
        ? "There is no admissible record of what passed through the first defendant's hands" + notBefore(miss) + '.'
        : "The records show withdrawals at T4; they do not, on their own, show me that it was the first defendant's hand on the cards.";
      return first + ' ' + (pw1ok(ev) ? 'PW1 saw withdrawals; he cannot tell me whose money it was.' : "PW1's account, standing alone, I cannot safely accept.") + ' Element (a) is not proved.';
    },
    e1b_yes: (ev) => {
      const c = [], led = has(ev, 'upstream_ledger'), trk = has(ev, 'barge_track');
      if (led) c.push('the UPSTREAM ledger records a cash-out at T4 about two days after each sailing of TEKENA 2');
      if (trk) c.push(led ? 'the tracker log fixes those sailings' : 'the tracker log fixes the sailings of TEKENA 2');
      if (has(ev, 'pos_t4_log')) c.push((led || trk) ? 'the T4 log shows withdrawals on the matching days' : 'the T4 log shows the withdrawals week after week');
      if (has(ev, 'loading_log')) c.push("the true loading log puts the barge's cargo into Tank 3");
      else if (wit(ev, 'sotonye')) c.push("PW5 puts the barge's cargo into Tank 3");
      if (has(ev, 'tank3_sample') || has(ev, 'fuel_samples')) c.push('the laboratory shows that cargo to be crudely refined product of the creek camps');
      if (wit(ev, 'felix')) c.push('PW6 describes the cash coming back upriver from Sapele, and is corroborated');
      if (has(ev, 'bank_trail')) c.push("Riverstone's statements show where the proceeds went next");
      const body = c.length ? cap(clauses(top(c, 3))) + '.' : 'Taken as a whole, the evidence carries the money from the creek to the kiosk.';
      return body + ' Section 18(8) does not require a particular unlawful act to be proved, and I am satisfied this money was the proceeds of crude oil theft. Element (b) is proved.';
    },
    e1b_no: (ev) => {
      const miss = goneIds(ev, ['upstream_ledger', 'pos_t4_log', 'barge_track', 'loading_log']);
      return (miss.length
        ? 'Nothing admissible connects the money at T4 to crude oil, or to any other unlawful act' + notBefore(top(miss, 3)) + '.'
        : 'The documents show money moving and a barge sailing; they do not prove, beyond reasonable doubt, that one paid for the other.') +
        ' Suspicion, however strong, is not proof. Element (b) fails.';
    },
    e1c_yes: (ev) => {
      const f = [];
      if (pw1ok(ev)) f.push('withdrawals made back to back just under the limit');
      if (has(ev, 'bvn_link')) f.push('four accounts in four names on one set of fingerprints');
      if (pw1ok(ev)) f.push('cash carried to a boatman at night');
      if (has(ev, 'pos_t4_log')) f.push('the same pattern every Thursday for months');
      if (wit(ev, 'ejiro')) f.push('a cut paid to the operator for every card');
      const facts = top(f, 3);
      const tail = has(ev, 'bvn_link') ? 'A fuel seller does not need four names on one set of fingerprints' : 'Honest trade does not arrange itself like that';
      return 'Section 18(9) allows knowledge to be inferred from objective facts' + (facts.length ? ': ' + nouns(facts) : '') + '. ' + tail +
        ', and I find that he knew, or at the very least ought reasonably to have known. Element (c) is proved.';
    },
    e1c_no: (ev) => {
      const miss = goneIds(ev, ['bvn_link', 'pos_t4_log']).map((id) => NM[id]);
      return 'The first defendant says he never knew, and the prosecution has not given me enough to say otherwise.' +
        (miss.length ? ' Without ' + nouns(miss) + ', what remains is a man drawing cash in a market.' : '') +
        ' That he ought to have asked questions may be so; that he ought reasonably to have known the answer is not proved.';
    },
    e2a_yes: (ev) => {
      const p = [];
      if (pw1ok(ev)) p.push('PW1 found the second defendant running a camp where crude was cooked into diesel');
      if (has(ev, 'fuel_samples')) p.push('the camp samples show what it produced');
      if (has(ev, 'waybill_book')) p.push('the waybill book shows where the product was meant to go');
      if (has(ev, 'felix_phone')) p.push("the escort's phone links the camp to Riverstone Marine");
      if (has(ev, 'barge_track')) p.push('the tracker log puts TEKENA 2 at its landing');
      const body = p.length ? cap(clauses(top(p, 3))) + '.' : 'On the evidence as a whole, the camp was his and its product was sold.';
      return body + ' He dealt in that product. Element (a) of count two is proved.' + lighter(ev, ['fuel_samples', 'waybill_book', 'felix_phone']);
    },
    e2a_no: (ev) => {
      const miss = goneIds(ev, ['fuel_samples', 'waybill_book']);
      return (miss.length
        ? 'Nothing admissible shows what the camp produced, or that the second defendant dealt in it' + notBefore(miss) + '.'
        : 'What the camp produced is plain; that the second defendant, and not others at the camp, dealt in it is not proved beyond reasonable doubt.') +
        ' A man found near a fire is not, without more, proved to have dealt in anything.';
    },
    e2b_yes: () => 'No licence has been produced or even suggested. A licence is a fact especially within the knowledge of whoever holds it (section 140), the prosecution need not disprove an exception nobody has raised (section 141), and nobody licenses a refinery of open drums in a creek. Element (b) is proved.',
    e2b_no: () => 'Without proof of what was being dealt in, I cannot find that it was dealt in without authority. Element (b) falls with element (a).',
    e3a_yes: (ev) => {
      const p = [];
      if (has(ev, 'loading_log')) p.push("the true loading log records TEKENA 2's cargo going into Tank 3");
      if (has(ev, 'tank3_sample')) p.push('the Tank 3 sample matches the product of the creek camps');
      if (has(ev, 'gate_register')) p.push('the gate register shows tankers carrying it out again');
      if (has(ev, 'barge_track')) p.push('the tracker log puts TEKENA 2 at the Riverstone jetty on the matching days');
      if (pw1ok(ev)) p.push('PW1 found the third defendant managing the farm');
      const body = p.length ? cap(clauses(top(p, 3))) + '.' : 'On the evidence as a whole, the product passed through her farm.';
      return body + ' The third defendant received, stored and sold that product. Element (a) of count three is proved.' + lighter(ev, ['loading_log', 'tank3_sample', 'gate_register']);
    },
    e3a_no: (ev) => {
      const miss = goneIds(ev, ['loading_log', 'tank3_sample', 'gate_register']);
      return (miss.length
        ? 'What went into Tank 3, and from where, is not proved by anything admissible' + notBefore(miss) + '.'
        : 'The records show product entering and leaving Tank 3; I am not satisfied beyond reasonable doubt that it was the third defendant who received and dealt in it.') +
        ' Element (a) is not proved.';
    },
    e3b_yes: () => 'Whatever licence Riverstone holds is a licence for lawful product. No licence anywhere authorises the storage and sale of diesel cooked from stolen crude. Element (b) is proved.',
    e3b_no: () => 'Riverstone is a licensed tank farm, and nothing admissible shows that the product in Tank 3 fell outside its licence. Element (b) is not proved.',
    e3c_yes: (ev) => {
      if (has(ev, 'loading_log')) return "A manager who keeps a second, true log of where her diesel came from knows where her diesel came from. That is the whole point of a second log, and her official book entered the same cargo as 'imported AGO'. Element (c) is proved.";
      const p = [];
      if (has(ev, 'tank3_sample')) p.push('the product in Tank 3 was visibly and measurably not imported diesel');
      if (has(ev, 'gate_register')) p.push('it left her gate as fast as it came in');
      if (has(ev, 'waybill_book')) p.push('the waybills behind it were false');
      return (p.length ? cap(clauses(p)) + '. Yet' : 'On all the evidence,') + ' a professional manager accepted it load after load, and I infer that she knew. Element (c) is proved.';
    },
    e3c_no: (ev) => has(ev, 'loading_log')
      ? 'The loading log shows what arrived and when. It does not, on its own, show me what the third defendant understood of where it came from. Element (c) is not proved.'
      : 'Without the true loading log, nothing shows the third defendant knew more than her official book told her. Element (c) is not proved.'
  },
  guilty: {
    d1: [
      J("On count one, I find the first defendant, Lucky Edafe, guilty as charged, and I convict him accordingly."),
      N("Lucky looks at his Senior Advocate. His Senior Advocate looks at the ceiling fan.")
    ],
    d2: [ J("On count two, the second defendant, Felix Ugbekile, stands convicted.") ],
    d3: [ J("On count three, the third defendant, Sotonye Jumbo, stands convicted.") ]
  },
  notguilty: {
    d1: [
      J("On count one, the prosecution has not proved its case beyond reasonable doubt. I find the first defendant, Lucky Edafe, not guilty. He is discharged and acquitted."),
      N("Olaniran-Cole closes his file the way some men close a door: quietly, and only once.")
    ],
    d2: [ J("On count two, the case against the second defendant, Felix Ugbekile, is not proved beyond reasonable doubt. He is discharged and acquitted.") ],
    d3: [ J("On count three, the case against the third defendant, Sotonye Jumbo, is not proved beyond reasonable doubt. She is discharged and acquitted.") ]
  },
  allocutus: {
    d1: [
      J("Allocutus. Mr. Olaniran-Cole?"),
      S("My Lord, the convict is a first offender, a husband, and the father of five children in Sapele. He has been in custody since his arrest."),
      S("I urge the court to temper justice with mercy. Section 18(3) permits a fine in place of imprisonment. We ask for it."),
      D("My Lord, the prosecution has no record of any previous conviction. We leave sentence to the court, and ask that any sum recovered be forfeited to the Federal Government."),
      LU("My Lord, I beg. I no go do am again.", "My Lord, I beg you. I won't do it again.")
    ],
    d2: [
      LA("My Lord, the convict is a trained engineer who lost his work when the company he served left the Delta. He has no previous conviction. He asks for mercy."),
      F("My Lord, I know what the smoke does. I knew it every night. I'm sorry for the creek.")
    ],
    d3: [
      LA("My Lord, the convict is a mother of two and a first offender. She asks the court to consider her children."),
      SO("My Lord, I kept the true record. I should have taken it to someone sooner.")
    ]
  },
  sentence: {
    d1: [
      J("Lucky Edafe. You drew other people's crimes out of a machine in a market, a little under the limit each time, and sent them upriver in sacks."),
      J("Your counsel asks for a fine. A fine would be paid by whoever is paying your counsel. I prefer a sentence nobody else can serve for you."),
      J("You are sentenced to seven years' imprisonment on count one. Time spent in custody counts towards it. Any sum recovered from you is forfeited to the Federal Government.")
    ],
    d2: [
      J("Felix Ugbekile. You are an engineer. You knew exactly what you were cooking, and exactly where the rest of it went."),
      J("You are sentenced to seven years' imprisonment on count two. Time spent in custody counts towards it."),
      D("My Lord, the prosecution will apply separately for the forfeiture of any vessel used, as the section requires.")
    ],
    d2_plea: [
      J("Felix Ugbekile. I have considered whether the sentence in your agreement is too light. You came into that box and told the truth about the creek. It is not too light."),
      J("In accordance with the plea agreement, you are sentenced to three years' imprisonment on count two as amended. Time spent in custody counts towards it."),
      D("My Lord, the prosecution will apply separately for the forfeiture of any vessel used, as the section requires.")
    ],
    d3: [
      J("Sotonye Jumbo. You wrote 'imported' in a book, month after month, beside diesel you knew had been cooked in a creek."),
      J("You are sentenced to five years' imprisonment on count three. Time spent in custody counts towards it.")
    ],
    d3_plea: [
      J("Sotonye Jumbo. In accordance with the plea agreement, you are sentenced to two years' imprisonment on count three as amended. Time spent in custody counts towards it."),
      J("You kept the true record. It is the only reason this court has heard of Tank 3 at all.")
    ]
  },
  close: [
    N("Outside Court 5, the corridor smells of floor polish and other people's verdicts."),
    D("Walk with me, Agent."),
    D("Whatever you think of today, something is written in a judge's hand now that wasn't before. A barge. A tank farm. A company. A driver's name, if anyone said it in that box."),
    K("And the man the driver drives for?"),
    D("Is not a party, as Mr. Olaniran-Cole reminded us eleven times. But records don't forget, and judges read each other's."),
    D("The application to freeze Riverstone's accounts goes in tomorrow. If anyone needed that money moved, they now have days, not weeks."),
    K("Then they'll move it themselves. They won't trust anyone else with it now."),
    D("Then be there when they do. Lawfully, Agent. I'd like to win the next one too."),
    N("Across the car park, a black Prado that has been idling since nine o'clock pulls out into the traffic.")
  ]
};

/* =========================================================================
   FIXES — between-hearing tasks in the hub. `missing` = what happens in court
   if a response that needs this fix is chosen without it.
   ========================================================================= */
C.fixes = {
  cert_pos: {
    title: "Section 84 certificate — terminal T4",
    who: 'DANLADI',
    lines: [
      D("The T4 log is a printout from the provider's system. Without a certificate it dies on the spot. Kubor."),
      D("Their compliance officer has to sign it: somebody responsible for the system, not you. I've written. She wants it collected in Lagos by noon tomorrow."),
      K("Lagos."),
      N("Night bus, a compliance office, a long read, a signature, a stamp. The certificate covers the terminal, the server, and the whole period.")
    ],
    missing: [
      N("Danladi turns the pages of her file twice. The certificate isn't there. Nobody went to get it."),
      J("Counsel? I'm waiting.")
    ]
  },
  bank_cert: {
    title: "Banker's books — the bank's own officer",
    who: 'DANLADI',
    lines: [
      D("Bank statements and BVN records are banker's books. Section 90(1)(e): an officer of the bank has to prove them and examine our copies against the books."),
      D("And because they're printouts, a section 84 certificate as well. The same officer can sign both."),
      N("A branch in the Central Business District. A compliance manager who reads every page twice, and stamps every page once.")
    ],
    missing: [
      N("Danladi looks for the bank's certificate. It is not in the file."),
      J("Counsel, banks have officers. Where is yours?")
    ]
  },
  ctc_cac: {
    title: "Certified true copy — CAC record",
    who: 'KELECHI',
    lines: [
      D("The CAC record is a public document. A printout from the portal won't do. We need a certified true copy from the Commission itself."),
      K("How long does that take?"),
      D("Officially, a few days. Unofficially, it depends who you ask and what they want. Pay nothing that doesn't come with a receipt."),
      N("The Commission's head office. A form, a fee, a receipt, a queue. The certified copy is ready on the third morning.")
    ],
    missing: [
      N("There is no certified copy in the file. Only the printout."),
      J("Counsel, a printout of a public document. You know what I am going to say.")
    ]
  },
  search_record: {
    title: "The search for exhibit 14",
    who: 'DANLADI',
    lines: [
      D("If the original drive is gone, section 89(c) lets us use the copy, but only after all possible search. 'We think it's at headquarters' is not a search."),
      D("So we write. The Director-General's office, the exhibit unit, the transfer team. Formally. Three letters, three dates."),
      N("Three replies come back on the same letterhead, in the same words: 'Exhibit 14 cannot be located at this time.' Each signed 'for the Director-General'."),
      K("They're not even pretending."),
      D("They don't need to. They only needed the court to think we never looked. Now it can't.")
    ],
    missing: [
      J("Counsel, have you written to anyone? Searched anywhere? Is there a single letter?"),
      N("There isn't.")
    ]
  },
  /* CN06: Mr. Igbinosa certifies the tracker in every save (lines_igbinosa). The Tobi `lines` are
     RETIRED, unused; they stay so old references resolve. */
  cert_tracker: {
    title: "Section 84 certificate — tracker log",
    who: 'TOBI',
    lines: [
      T("The tracker log? I can certify it. I set up the server it reports to. Device ID, server logs, uptime. It never dropped out once."),
      T("Give me an hour. I want every page initialled. If he's going to attack it, he'll have to attack me."),
      N("The certificate identifies the device on TEKENA 2 and the server, and confirms both operated properly throughout.")
    ],
    who_alt: 'IGBINOSA',
    lines_igbinosa: [
      I("Tracker log. Section 84. I will sign it when I have checked the server's records against every page."),
      I("You'll have it Thursday. If you want it faster, get it from somebody who doesn't read what he signs."),
      N("Thursday, 08:10. The certificate is on Danladi's desk, initialled on every page in green ink.")
    ],
    missing: [
      N("There is no certificate for the tracker log. The analyst was never asked."),
      J("Then I have a list of positions, Counsel, and no one to vouch for the machine that made it.")
    ]
  }
};

/* =========================================================================
   HUB — short scenes in Abuja between sittings
   ========================================================================= */
C.hub = {
  after_day1: [
    N("ABUJA · A GUEST HOUSE IN WUSE II · 21:30. The power has gone twice. The generator has opinions."),
    D("You did well. Mostly. He takes you apart on Monday, so tonight we decide which parts of you can afford to be taken."),
    K("Which parts can?"),
    D("The true ones. Those he can bruise. The lies, he kills."),
    D("And anything we're missing, get it before Monday. Certificates. Certified copies. Paper for that drive. I'll draft the letters. You chase the signatures."),
    N("The list is in your notebook. Every item on it costs time you don't have.")
  ],
  after_day2: [
    N("ABUJA · A SUYA SPOT OFF AMINU KANO CRESCENT · 22:10. Smoke, pepper, and a radio playing highlife to nobody."),
    D("Lucky testifies on Thursday. Olaniran-Cole will lead him gently and sit down. Then it's my turn."),
    D("You watched that man for an hour in that market. Give me one question. The one he can't answer without hurting himself."),
    K("And if I give you the wrong one?"),
    D("Then he walks out taller than he walked in. No pressure."),
    N("The suya man wraps the meat in yesterday's newspaper. On the front page, a photograph of Court 5's doors.")
  ]
};

V13.COURT_DATA = C;
})();
