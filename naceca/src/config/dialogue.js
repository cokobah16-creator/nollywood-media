/* =========================================================================
   NACECA · config/dialogue.js
   Auto-extracted from game.js by split_modules.py
   Edit the modules; run build.py to rebuild naceca.html.
   ========================================================================= */
/* ===================== 4. DATA: DIALOGUE ===================== */
const DIALOGUE = {
  // Mission 1: Lagos HQ Briefing
  hq_intro: [
    { speaker:'COMMANDER ADAEZE', portrait:'commander',
      text:"Agent Kelechi. Welcome to NACECA. I won't waste your morning — we have a live case." },
    { speaker:'COMMANDER ADAEZE', portrait:'commander',
      text:"A ransom payout was traced through three POS agents in Ikeja, two SIMs registered under a dead grandmother, and a crypto wallet that emptied into a Lekki mansion." },
    { speaker:'COMMANDER ADAEZE', portrait:'commander',
      text:"Your first field op is a market patrol. Talk to our informant. Scan whatever phone he points you to. Then we move on the mansion at night.",
      choices:[
        { text:"Yes ma'am. Lawful procedure first — I want this to hold up in court.",  effect:{integrity:+5, agencyFavour:+2}, tag:'lawful', next:'hq_lawful' },
        { text:"I'll get it done however it needs doing. Politicians fund these boys.", effect:{agencyFavour:+5, integrity:-3}, tag:'harsh', next:'hq_harsh' },
        { text:"Understood. Permission to bring the Anti-Kidnapping liaison in early?", effect:{integrity:+3, publicTrust:+3}, tag:'savvy', next:'hq_savvy' },
      ]
    }
  ],
  hq_lawful: [
    { speaker:'COMMANDER ADAEZE', text:"Good. Chain of custody, Kelechi. That's how we put the big ones away. Move out — Ikeja market." }
  ],
  hq_harsh: [
    { speaker:'COMMANDER ADAEZE', text:"Careful. I don't need cowboys. I need convictions. Don't make me regret signing your posting." }
  ],
  hq_savvy: [
    { speaker:'COMMANDER ADAEZE', text:"Smart. I'll send word to AKS — they've been working the same ledger from the kidnapping side. Ikeja market. Go." }
  ],

  // Mission 2: Market intro & informant
  market_intro: [
    { speaker:'INFORMANT — TUNDE', portrait:'informant',
      text:"Oga Kelechi! You came. The boy I told you about — that one in the orange shirt by the phone-charging stand. He's been moving SIMs for a syndicate." },
    { speaker:'INFORMANT — TUNDE',
      text:"He doesn't know I clocked him. His phone is sitting on the counter. If you're quick and quiet, you scan it. Just don't make me a marked man here.",
      choices:[
        { text:"Stay back. I'll handle it without naming you.", effect:{integrity:+4, publicTrust:+3}, tag:'lawful', next:null },
        { text:"Bring him in now. I'll explain at HQ.",         effect:{agencyFavour:+2, publicTrust:-4, integrity:-2}, tag:'harsh', next:null },
      ]
    }
  ],
  market_runner: [
    { speaker:'TEEN SUSPECT — KC', portrait:'teen',
      text:"Officer abeg! I no know wetin dey for that phone. Na person give me to hold am for am. I just dey hustle small data card sales!" },
    { speaker:'TEEN SUSPECT — KC',
      text:"If you carry me go station… my mama dey sick. Abeg. I fit help you. I sabi the guy wey dey send the phishing message dem.",
      choices:[
        { text:"Cuff him. Procedure first — he can talk at HQ.", effect:{integrity:+4, agencyFavour:+3, publicTrust:-2}, tag:'lawful',
          flag:{ choice:'detain' }, next:null },
        { text:"Let him cooperate as an informant. Sign the form.", effect:{integrity:+2, publicTrust:+6}, tag:'savvy',
          flag:{ choice:'flip' }, next:null },
        { text:"Slap the phone out his hand. Make him talk now.", effect:{integrity:-8, publicTrust:-6, agencyFavour:+2}, tag:'harsh',
          flag:{ choice:'force', force:1 }, next:null },
      ]
    }
  ],

  // Mission 3: Mansion raid pre-breach
  mansion_pre_breach: [
    { speaker:'SQUAD LEAD — SGT. UCHE', portrait:'sergeant',
      text:"Kelechi. Mansion's lit up. Two upstairs, one downstairs by the desk — that's our principal. There's a child in the living room. House staff in the kitchen." },
    { speaker:'SQUAD LEAD — SGT. UCHE',
      text:"Your call on entry. We can knock-and-announce, breach quiet, or go loud. Each one shifts how this lands.",
      choices:[
        { text:"Knock-and-announce. Civilians inside.", effect:{integrity:+6, publicTrust:+5, agencyFavour:-2}, tag:'lawful',
          flag:{ entry:'knock' }, next:null },
        { text:"Quiet breach. Lockpick the side door.",  effect:{integrity:+2, publicTrust:+2, agencyFavour:+3}, tag:'savvy',
          flag:{ entry:'quiet' }, next:null },
        { text:"Loud breach. Don't give him time to wipe.", effect:{integrity:-4, publicTrust:-4, agencyFavour:+5, force:+1}, tag:'harsh',
          flag:{ entry:'loud' }, next:null },
      ]
    }
  ],
  mansion_arrest: [
    { speaker:'SUSPECT — "CHIEF" OBI', portrait:'suspect',
      text:"My friend! Officer! Take am easy now. We fit reason this thing. Whatever number dey your head — I fit double am. Cash. Inside that drawer." },
    { speaker:'SUSPECT — "CHIEF" OBI',
      text:"You no need to embarrass me for my own house. Make we settle am like sensible people.",
      choices:[
        { text:"Read him his rights. Cuff with restraint.",        effect:{integrity:+8, publicTrust:+6, agencyFavour:+3}, tag:'lawful',  flag:{arrest:'professional', force:0}, next:null },
        { text:"Down on the ground. Knee on his back.",            effect:{integrity:-4, publicTrust:-3, agencyFavour:+4, force:+1}, tag:'harsh', flag:{arrest:'forceful', force:1}, next:null },
        { text:"Take the cash. Walk away. Forget the file.",       effect:{integrity:-30, publicTrust:-10, agencyFavour:-15}, tag:'harsh', flag:{arrest:'bribe'}, next:null },
        { text:"Offer informant deal. Names of the politicians.",  effect:{integrity:+4, publicTrust:+4, agencyFavour:-5}, tag:'savvy',
          requires:'crisis', flag:{arrest:'informant'}, next:null },
      ]
    }
  ],
  mansion_civilian: [
    { speaker:'CHILD', portrait:'child',
      text:"Aunty… I want my daddy. Why you people get gun? I no do anything…" },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"It's okay. I'm a police officer — NACECA. You're safe. Walk with me — eyes on me — we're going outside to your aunty.",
      choices:[
        { text:"Take her hand gently and lead her to the safe zone.", effect:{integrity:+5, publicTrust:+8}, tag:'lawful', flag:{rescued:1}, next:null },
        { text:"Tell her to stay put. Get back to the laptop.",       effect:{integrity:-4, publicTrust:-6}, tag:'harsh', next:null },
      ]
    }
  ],

  // Mission 4: Checkpoint Shakedown
  checkpoint_intro: [
    { speaker:'AKS LIAISON — INSP. CHIDI', portrait:'sergeant',
      text:"Kelechi, you made it. Welcome to the Bypass. AKS picked up signal: a livestock truck moving cattle north — but one of our informants says the cargo's not just cattle." },
    { speaker:'AKS LIAISON — INSP. CHIDI',
      text:"Driver's been here twenty minutes. Sweating like he's running a fever. I want you to verify his manifest — your eyes are fresher than mine. Then we open up the back together.",
      choices:[
        { text:"Understood. I'll work the documents first — proper sequence.", effect:{integrity:+4, agencyFavour:+3}, tag:'lawful', next:null },
        { text:"Forget the paper — pop the back doors now.",                     effect:{integrity:-3, agencyFavour:+2, force:+1}, tag:'harsh', next:null },
        { text:"Let me read him first. I want to see what he says before I look.", effect:{integrity:+2, publicTrust:+3}, tag:'savvy', next:null },
      ]
    }
  ],
  checkpoint_driver: [
    { speaker:'TRUCK DRIVER — MUSA', portrait:'driver',
      text:"Officer abeg na correct papers I get o. I dey carry cattle from Kano to Sapele. Five years I dey do this road. No problem at all." },
    { speaker:'TRUCK DRIVER — MUSA',
      text:"Wetin you wan check? Manifest dey for dashboard. Owner of cattle na one Alhaji for Kano. I just dey drive. I no know wetin dem put for back-back.",
      choices:[
        { text:"I'll check the manifest. Stay with the vehicle.", effect:{integrity:+3}, tag:'lawful', next:null },
        { text:"You said you don't know what's in the back. That's interesting.", effect:{integrity:+2, publicTrust:+2}, tag:'savvy', next:null },
        { text:"Sit on the curb. Hands where I can see them.",   effect:{agencyFavour:+1, publicTrust:-2}, tag:'harsh', next:null },
      ]
    }
  ],
  checkpoint_resolve: [
    { speaker:'AKS LIAISON — INSP. CHIDI', portrait:'sergeant',
      text:"Compartment behind the cattle. Two AKs, a sealed envelope of cash, and a hand-written ledger — names, drop locations, dates. This is the route." },
    { speaker:'AKS LIAISON — INSP. CHIDI',
      text:"What do we do with Musa? He's small fish. But small fish swim in formation.",
      choices:[
        { text:"Arrest him. He carried the cargo — he answers for it.",     effect:{integrity:+4, agencyFavour:+5, publicTrust:-2}, tag:'lawful',
          flag:{ checkpoint:'arrest_driver' }, next:null },
        { text:"Flip him. Wire him up — he leads us to the next handoff.",   effect:{integrity:+2, publicTrust:+5, agencyFavour:-2}, tag:'savvy',
          flag:{ checkpoint:'flip_driver' }, next:null },
        { text:"Let him drive on with surveillance. Trace the whole route.", effect:{integrity:+5, publicTrust:+3, agencyFavour:-3}, tag:'savvy',
          requires:'crisis', flag:{ checkpoint:'tail_driver' }, next:null },
      ]
    }
  ],

  // ===== Mission 5: Forest Shrine =====
  shrine_uche: [
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Ma. The ledger from the Bypass — Musa's route lands here. The cartel's been using this shrine as a transfer point. They know nobody on patrol will breach it." },
    { speaker:'SGT. UCHE',
      text:"The custodian, Pa Eze — he's been here forty years. We don't know if he's a partner or a hostage to the situation. Talk to him before we move." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"And if he refuses access?" },
    { speaker:'SGT. UCHE',
      text:"Then ma'am decides. We have probable cause. We can stack and breach. Or we can knock and announce. Or we can leave and come back with a state magistrate signed off. Each one costs different things." },
  ],
  shrine_intro: [
    { speaker:'PA EZE — CUSTODIAN', portrait:'merchant',
      text:"Welcome, my child. You wear the badge of the agency. You walk with rifles. You come here for what?" },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Pa Eze. We have intelligence that this shrine has been used — without your knowledge — to move stolen goods. We need access to the compound." },
    { speaker:'PA EZE',
      text:"Without my knowledge. So now you know more about what happens here than the man who has tended this place since before your father was born." },
    { speaker:'PA EZE',
      text:"This ground is not a warehouse. It is a covenant. People come here to bury grief, to carry shame they cannot carry alone, to ask for things only the old gods can give. What do you want to do?",
      choices:[
        { text:"Pa, I'm sorry. I would not enter without your blessing. May I ask your guidance?",
          effect:{integrity:+4, publicTrust:+5, agencyFavour:-2}, tag:'lawful',
          flag:{ shrine:'negotiate' },
          next:'shrine_negotiate' },
        { text:"This is a NACECA operation. We have probable cause. We're entering — with or without your blessing.",
          effect:{integrity:-3, publicTrust:-6, agencyFavour:+4, force:+2}, tag:'harsh',
          flag:{ shrine:'force' },
          next:'shrine_force' },
        { text:"You're right, Pa. We'll come back with a state magistrate's order. Tomorrow.",
          effect:{integrity:+5, publicTrust:+3, agencyFavour:-5}, tag:'lawful',
          flag:{ shrine:'leave' },
          next:'shrine_leave' },
      ]
    }
  ],
  shrine_negotiate: [
    { speaker:'PA EZE', portrait:'merchant',
      text:"Heh. The badge brought a person, not a weapon. That is rare." },
    { speaker:'PA EZE',
      text:"There are men who come at night. They bring drums. They bring jerry-cans. They tell me they are paying respects to the deities." },
    { speaker:'PA EZE',
      text:"I am old, child. I am not stupid. I have known for two seasons that what they bring is not respect." },
    { speaker:'PA EZE',
      text:"You may enter. Take what you must take. But step around the central fire — that one is real. And do not raise your voice in this place." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Thank you, Pa. We'll honor that." },
    { speaker:'NACECA SYSTEM', portrait:'kelechi',
      text:"Access granted. The compound is open. Step around the fire pit. Search the libation pots and the cache behind the shrine.",
      effect:{ flag:{ shrine_access:'granted_negotiate' }, intel:+22 } },
  ],
  shrine_force: [
    { speaker:'PA EZE', portrait:'merchant',
      text:"Then enter. But know that what you walk over today will walk back over you, in some other life." },
    { speaker:'PA EZE',
      text:"I will not bless this. The village will know. The radio will know. And the gods are not deaf." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Sgt. Uche, stack on the gate. Knock-and-announce. We move." },
    { speaker:'NACECA SYSTEM', portrait:'kelechi',
      text:"Forced entry. Evidence accessible — but the region's trust meter has shifted. Some of this footage will be on the local station tonight.",
      effect:{ flag:{ shrine_access:'granted_force' }, intel:+10 } },
  ],
  shrine_leave: [
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"We pull back. Sgt. Uche, secure a perimeter at fifty yards. Quiet. Nobody enters the compound until we have a signed warrant." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Ma — by the time we get back, the cache walks. You know that." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Then we move fast. Some procedures are slower because they have to be. Let's go." },
    { speaker:'NACECA SYSTEM', portrait:'kelechi',
      text:"Operation paused. The case file remains open. Some evidence may be lost — but the precedent is clean.",
      effect:{ flag:{ shrine_access:'left' }, intel:+4 } },
  ],
  shrine_complete_negotiate: [
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"We have the cache. The ledger from the pots ties three more compounds in Edo to the same network. Pa Eze's been more useful than half the magistrates in this state." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"And the village will remember it. Word travels through these forests faster than any of our reports do." },
  ],
  shrine_complete_force: [
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"We have the cache. Pa Eze hasn't said a word since we breached. We got the evidence. We may have lost the village." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"That'll matter on the next operation, ma. These forests don't forget." },
  ],

  // ===== Mission 6: The Disappeared (Asaba) =====
  asaba_brief: [
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Asaba commercial warehouse. The shrine ledger you pulled from Pa Eze pointed here. Two things waiting for us inside, ma." },
    { speaker:'SGT. UCHE',
      text:"One: a fixer the cartel calls Ifeanyi. Books the routes, moves the cash, never touches a phone we can trace. He's our entry into the upper rung." },
    { speaker:'SGT. UCHE',
      text:"Two: an accountant. Tobi Onuoha. They grabbed him three days ago because he started asking questions about a transfer that wasn't supposed to leave a paper trail. He's still alive, last we heard." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"And we're going in two-up. That's what makes this hard." },
    { speaker:'SGT. UCHE',
      text:"That's what makes this hard. Once we breach, Ifeanyi runs for the loading bay. There's a van. He'll be in it inside thirty seconds. Tobi's in a side office that's already been doused — they're starting fires on their way out." },
    { speaker:'SGT. UCHE',
      text:"You can chase. You can rescue. Cannot do both. I'll take whichever you don't. But ma — I'm slower than you. The one you take, you take." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Understood. Breach when ready, sergeant." },
  ],
  asaba_resolve_chase: [
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Ifeanyi's cuffed. Got him in the dust before he made the door. Tobi — I pulled him out, ma. He's coughing up half a lung but he's breathing." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Both? You got both?" },
    { speaker:'SGT. UCHE',
      text:"This time. Don't bet on me being that fast every time we pull this kind of mission." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Logged. Bag the SIMs and the ledger crumbs, sergeant. We move them to the field office tonight." },
  ],
  asaba_resolve_chase_lost: [
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Ifeanyi's in custody. The interview alone is going to give us six new names by morning." },
    { speaker:'SGT. UCHE',
      text:"Tobi… I couldn't get to him in time. The smoke was too thick by the time Ifeanyi was secured. The accountant didn't make it." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Get me his family contact. They hear it from us. From me. Tonight." },
    { speaker:'SGT. UCHE',
      text:"Yes, ma." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"And the next time we get intelligence like this, we go in heavier. Two squads. Three. We don't run another solo six-up where the choice is who lives." },
  ],
  asaba_resolve_rescue: [
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Tobi's stable. The medics are taking him to St. Theresa's. He kept saying thank you, ma. Kept saying it." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"And Ifeanyi?" },
    { speaker:'SGT. UCHE',
      text:"Made the van. Cleared the bay before I could close the gap. He's in the wind." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Then we follow him. Not today. But Tobi can talk. The accountant knows what the fixer was protecting. That's a thread Ifeanyi can't cut from the inside of a getaway." },
    { speaker:'SGT. UCHE',
      text:"Yes, ma. Slower. But it holds." },
  ],
};

