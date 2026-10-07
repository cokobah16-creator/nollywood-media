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
    { speaker:'COMMANDER ADAEZE', mood:'angry', text:"Careful. I don't need cowboys. I need convictions. Don't make me regret signing your posting." }
  ],
  hq_savvy: [
    { speaker:'COMMANDER ADAEZE', mood:'evasive', text:"Smart. I'll send word to AKS — they've been working the same ledger from the kidnapping side. Ikeja market. Go." }
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
  market_runner_escaped: [
    { speaker:'INFORMANT — TUNDE', portrait:'informant',
      text:"He don cut through Computer Village, oga. That boy know every back door for this market.",
      textEn:"He's cut through Computer Village, sir. That boy knows every back door in this market." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"We have the phone and the template. He'll surface again — and next time we'll know his face." },
  ],
  market_runner: [
    { speaker:'TEEN SUSPECT — KC', portrait:'teen',
      mood:'afraid', text:"Officer abeg! I no know wetin dey for that phone. Na person give me to hold am for am. I just dey hustle small data card sales!",
      textEn:"Officer, please! I don't know what's on that phone. Someone gave it to me to hold for them. I just sell data cards!" },
    { speaker:'TEEN SUSPECT — KC',
      mood:'afraid', text:"If you carry me go station… my mama dey sick. Abeg. I fit help you. I sabi the guy wey dey send the phishing message dem.",
      textEn:"If you take me to the station… my mum is sick. Please. I can help you. I know the guy who sends the phishing messages.",
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
  mansion_child_safe: [
    { speaker:'CHILD', portrait:'child', mood:'relieved',
      text:"...Okay. Your face get kindness. I go follow you.",
      textEn:"...Okay. You have a kind face. I'll come with you." },
  ],
  mansion_arrest: [
    { speaker:'SUSPECT — "CHIEF" OBI', portrait:'suspect',
      mood:'evasive', text:"My friend! Officer! Take am easy now. We fit reason this thing. Whatever number dey your head — I fit double am. Cash. Inside that drawer.",
      textEn:"My friend! Officer! Take it easy. We can work this out. Whatever number is in your head — I can double it. Cash. In that drawer." },
    { speaker:'SUSPECT — "CHIEF" OBI',
      mood:'angry', text:"You no need to embarrass me for my own house. Make we settle am like sensible people.",
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
      mood:'afraid', text:"Aunty… I want my daddy. Why you people get gun? I no do anything…" },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"It's okay. I'm a police officer — NACECA. You're safe. Walk with me — eyes on me — we're going outside to your aunty.",
      choices:[
        { text:"Take her hand gently and lead her to the safe zone.", effect:{integrity:+5, publicTrust:+8}, tag:'lawful', flag:{rescued:1, child_gentle:true}, next:'mansion_child_safe' },
        { text:"Tell her to stay put. Get back to the laptop.",       effect:{integrity:-4, publicTrust:-6}, tag:'harsh', next:null },
      ]
    }
  ],

  // Mission 4: Checkpoint Shakedown
  checkpoint_intro: [
    { speaker:'AKS LIAISON — INSP. CHIDI', portrait:'sergeant',
      text:"Kelechi, you made it. Welcome to the Bypass. AKS picked up signal: a livestock truck moving cattle north — but one of our informants says the cargo's not just cattle." },
    { speaker:'AKS LIAISON — INSP. CHIDI',
      mood:'evasive', text:"Driver's been here twenty minutes. Sweating like he's running a fever. I want you to verify his manifest — your eyes are fresher than mine. Then we open up the back together.",
      choices:[
        { text:"Understood. I'll work the documents first — proper sequence.", effect:{integrity:+4, agencyFavour:+3}, tag:'lawful', next:null },
        { text:"Forget the paper — pop the back doors now.",                     effect:{integrity:-3, agencyFavour:+2, force:+1}, tag:'harsh', next:null },
        { text:"Let me read him first. I want to see what he says before I look.", effect:{integrity:+2, publicTrust:+3}, tag:'savvy', next:null },
      ]
    }
  ],
  checkpoint_driver: [
    { speaker:'TRUCK DRIVER — MUSA', portrait:'driver',
      mood:'evasive', text:"Officer abeg na correct papers I get o. I dey carry cattle from Kano to Sapele. Five years I dey do this road. No problem at all.",
      textEn:"Officer, please, my papers are correct. I carry cattle from Kano to Sapele. Five years I've driven this road. Never any problem." },
    { speaker:'TRUCK DRIVER — MUSA',
      mood:'angry', text:"Wetin you wan check? Manifest dey for dashboard. Owner of cattle na one Alhaji for Kano. I just dey drive. I no know wetin dem put for back-back.",
      textEn:"What do you want to check? The manifest is on the dashboard. The cattle belong to an Alhaji in Kano. I just drive. I don't know what they put in the back.",
      choices:[
        { text:"I'll check the manifest. Stay with the vehicle.", effect:{integrity:+3}, tag:'lawful', next:null },
        { text:"You said you don't know what's in the back. That's interesting.", effect:{integrity:+2, publicTrust:+2}, tag:'savvy', next:null },
        { text:"Sit on the curb. Hands where I can see them.",   effect:{agencyFavour:+1, publicTrust:-2}, tag:'harsh', next:null },
      ]
    }
  ],
  checkpoint_musa_flip: [
    { speaker:'TRUCK DRIVER — MUSA', portrait:'driver',
      mood:'afraid', text:"...Oga. Na true. Na March I start. Dem give me the licence, dem give me the truck. One man for Benin Bypass dey load the back — I no dey look.",
      textEn:"...Sir. It's true. I started in March. They gave me the licence, they gave me the truck. A man on the Benin Bypass loads the back — I don't look." },
    { speaker:'TRUCK DRIVER — MUSA',
      mood:'afraid', text:"Dem call am 'Engineer'. Him dey wait for the filling station before Ugbowo junction. I fit show you the place. Abeg, tell them say I talk.",
      textEn:"They call him 'Engineer'. He waits at the filling station before Ugbowo junction. I can show you the place. Please, tell them I talked." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Then you'll say it again on the record. That's how you help yourself." },
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
      text:"Sir. The ledger from the Bypass — Musa's route lands here. The cartel's been using this shrine as a transfer point. They know nobody on patrol will breach it." },
    { speaker:'SGT. UCHE',
      text:"The custodian, Pa Eze — he's been here forty years. We don't know if he's a partner or a hostage to the situation. Talk to him before we move." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"And if he refuses access?" },
    { speaker:'SGT. UCHE',
      text:"Then it's your call, sir. We have probable cause. We can stack and breach. Or we can knock and announce. Or we can leave and come back with a state magistrate signed off. Each one costs different things." },
  ],
  shrine_intro: [
    { speaker:'PA EZE — CUSTODIAN', portrait:'merchant',
      text:"Welcome, my child. You wear the badge of the agency. You walk with rifles. You come here for what?" },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Pa Eze. We have intelligence that this shrine has been used — without your knowledge — to move stolen goods. We need access to the compound." },
    { speaker:'PA EZE',
      mood:'angry', text:"Without my knowledge. So now you know more about what happens here than the man who has tended this place since before your father was born." },
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
      mood:'angry', text:"Then enter. But know that what you walk over today will walk back over you, in some other life." },
    { speaker:'PA EZE',
      mood:'angry', text:"I will not bless this. The village will know. The radio will know. And the gods are not deaf." },
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
      mood:'angry', text:"Sir — by the time we get back, the cache walks. You know that." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      mood:'angry', text:"Then we move fast. Some procedures are slower because they have to be. Let's go." },
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
      mood:'evasive', text:"We have the cache. Pa Eze hasn't said a word since we breached. We got the evidence. We may have lost the village." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"That'll matter on the next operation, sir. These forests don't forget." },
  ],

  // ===== Mission 6: The Disappeared (Asaba) =====
  asaba_resolve_failed: [
    { speaker:'SGT. UCHE', portrait:'sergeant',
      mood:'afraid', text:"Van's gone. Fire service pulled Tobi out of that office, sir. Too late." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      mood:'afraid', text:"I waited. I should have picked one." },
    { speaker:'SGT. UCHE',
      mood:'angry', text:"Pick one next time. Any one. Standing still is the only wrong answer." },
  ],
  asaba_brief: [
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Asaba commercial warehouse. The shrine ledger you pulled from Pa Eze pointed here. Two things waiting for us inside, sir." },
    { speaker:'SGT. UCHE',
      text:"One: a fixer the cartel calls Ifeanyi. Books the routes, moves the cash, never touches a phone we can trace. He's our entry into the upper rung." },
    { speaker:'SGT. UCHE',
      text:"Two: an accountant. Tobi Onuoha. They grabbed him three days ago because he started asking questions about a transfer that wasn't supposed to leave a paper trail. He's still alive, last we heard." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"And we're going in two-up. That's what makes this hard." },
    { speaker:'SGT. UCHE',
      text:"That's what makes this hard. Once we breach, Ifeanyi runs for the loading bay. There's a van. He'll be in it inside thirty seconds. Tobi's in a side office that's already been doused — they're starting fires on their way out." },
    { speaker:'SGT. UCHE',
      text:"You can chase. You can rescue. Cannot do both. I'll take whichever you don't. But sir — I'm slower than you. The one you take, you take." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Understood. Breach when ready, sergeant." },
  ],
  asaba_resolve_chase: [
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Ifeanyi's cuffed. Got him in the dust before he made the door. Tobi — I pulled him out, sir. He's coughing up half a lung but he's breathing." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      mood:'afraid', text:"Both? You got both?" },
    { speaker:'SGT. UCHE',
      mood:'evasive', text:"This time. Don't bet on me being that fast every time we pull this kind of mission." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Logged. Bag the SIMs and the ledger crumbs, sergeant. We move them to the field office tonight." },
  ],
  asaba_resolve_chase_lost: [
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Ifeanyi's in custody. The interview alone is going to give us six new names by morning." },
    { speaker:'SGT. UCHE',
      mood:'afraid', text:"Tobi… I couldn't get to him in time. The smoke was too thick by the time Ifeanyi was secured. The accountant didn't make it." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      mood:'angry', text:"Get me his family contact. They hear it from us. From me. Tonight." },
    { speaker:'SGT. UCHE',
      text:"Yes, sir." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"And the next time we get intelligence like this, we go in heavier. Two squads. Three. We don't run another solo six-up where the choice is who lives." },
  ],
  asaba_resolve_rescue: [
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Tobi's stable. The medics are taking him to St. Theresa's. He kept saying thank you, sir. Kept saying it." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"And Ifeanyi?" },
    { speaker:'SGT. UCHE',
      mood:'angry', text:"Made the van. Cleared the bay before I could close the gap. He's in the wind." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Then we follow him. Not today. But Tobi can talk. The accountant knows what the fixer was protecting. That's a thread Ifeanyi can't cut from the inside of a getaway." },
    { speaker:'SGT. UCHE',
      text:"Yes, sir. Slower. But it holds." },
  ],

  /* ===================== MISSION 7 — NO SIGNAL ZONE ===================== */
  tower_brief_chase: [
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Ugbowo. The mast behind UNIBEN's back gate. Ifeanyi's phone gave us one number he never saved — a negotiator the boys call 'the Voice'. Every ransom call to the Ehigie family pinged this cell." },
    { speaker:'SGT. UCHE',
      text:"A student, Osas Ehigie. Taken at the campus gate on Friday. His mother gets a call every evening — a few seconds of the boy, then the Voice." },
    { speaker:'SGT. UCHE',
      text:"Then two nights ago the site went dark. Fibre cut, diesel drained. Not a fault, sir. Somebody wanted this tower blind while the calls kept coming." },
    { speaker:'SGT. UCHE',
      text:"Zonal asked our HQ to put a watch on this mast last month. Somebody at HQ said no." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"So the calls still route through here?" },
    { speaker:'SGT. UCHE',
      text:"On battery, in bursts. If we get the generator back and the engineer opens the cabinet, we can pull the timing data and put the handset on a map." },
    { speaker:'SGT. UCHE',
      text:"The site engineer is still inside — refused to leave his equipment. And the student's mother has been at that gate since yesterday." },
    { speaker:'SGT. UCHE',
      text:"One more thing. Whoever cut this tower knows it's the only way to find them. The moment those floodlights come on, sir, assume they come with it." },
  ],
  tower_brief_rescue: [
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Ugbowo. The mast behind UNIBEN's back gate. Tobi was awake in that office longer than they knew — he heard them say the next boy's calls would run through 'the tower at Ugbowo'." },
    { speaker:'SGT. UCHE',
      text:"A student, Osas Ehigie. Taken at the campus gate on Friday. His mother gets a call every evening — a few seconds of the boy, then someone they call the Voice." },
    { speaker:'SGT. UCHE',
      text:"Then two nights ago the site went dark. Fibre cut, diesel drained. Not a fault, sir. Somebody wanted this tower blind while the calls kept coming." },
    { speaker:'SGT. UCHE',
      text:"Zonal asked our HQ to put a watch on this mast last month. Somebody at HQ said no." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"So the calls still route through here?" },
    { speaker:'SGT. UCHE',
      text:"On battery, in bursts. If we get the generator back and the engineer opens the cabinet, we can pull the timing data and put the handset on a map." },
    { speaker:'SGT. UCHE',
      text:"The site engineer is still inside — refused to leave his equipment. And the student's mother has been at that gate since yesterday." },
    { speaker:'SGT. UCHE',
      text:"One more thing. Whoever cut this tower knows it's the only way to find them. The moment those floodlights come on, sir, assume they come with it." },
  ],
  tower_brief_cold: [
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Ugbowo. Benin Zonal Command handed us this one — a UNIBEN student, Osas Ehigie, taken at the campus gate on Friday. Every ransom call to his mother pings this one cell." },
    { speaker:'SGT. UCHE',
      text:"The negotiator never gives a name. To the family, it's just the Voice." },
    { speaker:'SGT. UCHE',
      text:"Then two nights ago the site went dark. Fibre cut, diesel drained. Not a fault, sir. Somebody wanted this tower blind while the calls kept coming." },
    { speaker:'SGT. UCHE',
      text:"Zonal asked our HQ to put a watch on this mast last month. Somebody at HQ said no." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"So the calls still route through here?" },
    { speaker:'SGT. UCHE',
      text:"On battery, in bursts. If we get the generator back and the engineer opens the cabinet, we can pull the timing data and put the handset on a map." },
    { speaker:'SGT. UCHE',
      text:"The site engineer is still inside — refused to leave his equipment. And the student's mother has been at that gate since yesterday." },
    { speaker:'SGT. UCHE',
      text:"One more thing. Whoever cut this tower knows it's the only way to find them. The moment those floodlights come on, sir, assume they come with it." },
  ],
  tower_mother: [
    { speaker:'MRS. EHIGIE', portrait:'mother',
      mood:'afraid', text:"Officer. Officer, please. They call me from seven. They let him say 'Mummy' and then they take the phone. Three days now." },
    { speaker:'MRS. EHIGIE',
      mood:'angry', text:"The telecom people say the network is bad. The police say they are 'working on it'. Tell me what you are doing. Tell me something true.",
      choices:[
        { text:"We will bring Osas home tonight, ma. I promise you.",
          effect:{publicTrust:+6, integrity:-3}, tag:'harsh', flag:{ tower_promise:true } },
        { text:"I can't promise you tonight. I can promise we're here for him and not for a headline. When the lights come on, get behind the security hut and stay there.",
          effect:{integrity:+5, publicTrust:+3}, tag:'lawful', flag:{ tower_promise:false } },
      ]
    },
    { speaker:'MRS. EHIGIE',
      mood:'evasive', text:"...Hm. God go follow you, my son.",
      textEn:"...Hm. God be with you, my son." },
  ],
  tower_engineer: [
    { speaker:'ENGR. OSARO', portrait:'engineer',
      mood:'afraid', text:"You people came. Good. I've been sitting with a dead site for two nights. They took the fibre with a cutlass — clean, like they do it for a living." },
    { speaker:'ENGR. OSARO',
      text:"Battery bank is at eleven percent. That's why the calls still pass — barely. Give me a running gen and the BTS cabinet is logging in ninety seconds." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Can you pull the timing data on one handset?" },
    { speaker:'ENGR. OSARO',
      text:"Timing advance on three sectors, plus handover history. Not GPS — but it puts a phone inside a few hundred metres. In Ugbowo that is a street." },
    { speaker:'ENGR. OSARO',
      text:"The gen is beside the hut. Red lever, then the green button. It will be loud, and the floodlights come on with it — I cannot separate them from here.",
      choices:[
        { text:"Stay in the hut, Engineer. Whatever you hear, you stay down. I'll run the cabinet.",
          effect:{integrity:+3, publicTrust:+2}, tag:'lawful', flag:{ tower_engineer:'shelter' } },
        { text:"I need you on the cabinet with me. You read it faster than I can.",
          effect:{intel:+6, agencyFavour:+3, publicTrust:-2}, tag:'savvy', flag:{ tower_engineer:'assist' } },
      ]
    },
    { speaker:'ENGR. OSARO',
      text:"Understood, oga officer.",
      textEn:"Understood, officer." },
  ],
  tower_ambush: [
    { speaker:'SGT. UCHE', portrait:'sergeant',
      mood:'afraid', text:"Kelechi! East fence — three shooters, maybe four. They were waiting for the lights. I have the gate; I cannot hold the fence and the gate." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      mood:'afraid', text:"I have a fix on the handset. The trace is still writing." },
    { speaker:'SGT. UCHE',
      mood:'angry', text:"Then you choose, sir. Now.",
      choices:[
        { text:"Hold the cabinet. Sixty seconds and we have the Voice on a map.",
          effect:{intel:+18, agencyFavour:+8, integrity:-2, publicTrust:-4, force:+1}, tag:'harsh',
          flag:{ tower:'hold' }, next:'tower_hold' },
        { text:"Get Osaro and Mrs. Ehigie behind the hut. We pull out with what the trace already gave us.",
          effect:{integrity:+6, publicTrust:+8, agencyFavour:-5}, tag:'lawful',
          flag:{ tower:'extract', rescued:2 }, next:'tower_extract' },
        { text:"Radio Benin Zonal. Armoured unit, now. We hold the hut and wait.",
          effect:{agencyFavour:+2, integrity:+2, publicTrust:-2}, tag:'savvy',
          flag:{ tower:'backup' }, next:'tower_backup' },
      ]
    }
  ],
  tower_hold: [
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Holding. Keep your head under that cabinet lid, sir." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      mood:'afraid', text:"Sector A... handover to the Ekosodin micro-cell... it's writing. It's writing." },
    { speaker:'SGT. UCHE',
      mood:'afraid', text:"They're pulling back — sirens on the Ugbowo road. Did we get it?" },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"We got it. The Voice is in Ekosodin. Three hundred metres of it." },
  ],
  tower_extract: [
    { speaker:'SGT. UCHE', portrait:'sergeant',
      mood:'afraid', text:"Moving! Engineer, madam — behind the hut, stay low!" },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Trace is partial. Sector A and the handover. North of the campus — Ekosodin, I'd bet my badge on it." },
    { speaker:'SGT. UCHE',
      text:"Then we bet the badge, not the civilians. That is the right order, sir." },
  ],
  tower_backup: [
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Zonal copies. Twelve minutes. We hold the hut." },
    { speaker:'—',
      text:"The floodlights draw fire for eleven of those minutes. Then an armoured unit's horn carries up the Ugbowo road, and the east fence goes quiet." },
    { speaker:'SGT. UCHE',
      text:"Twelve minutes we won't get back, sir. But everyone in this compound walks out." },
  ],
  tower_power_cut: [
    { speaker:'SGT. UCHE', portrait:'sergeant',
      mood:'angry', text:"They hit the gen. Lights gone — the cabinet's dead. We cannot sit in the dark with them on the fence.",
      choices:[
        { text:"Get Osaro and Mrs. Ehigie out through the gate. We leave with what we have.",
          effect:{integrity:+4, publicTrust:+4, agencyFavour:-6}, tag:'lawful',
          flag:{ tower:'cut_extract', rescued:2 }, next:'tower_cut_extract' },
        { text:"Radio Benin Zonal. We hold the hut until they arrive.",
          effect:{agencyFavour:+1, publicTrust:-3}, tag:'savvy',
          flag:{ tower:'cut_backup' }, next:'tower_cut_backup' },
      ]
    }
  ],
  tower_cut_extract: [
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Out the gate — go, go!" },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"The fibre photos and the sabotage report go to Zonal tonight. Osaro restores the site tomorrow, and we trace the next call." },
  ],
  tower_cut_backup: [
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Zonal copies. We hold." },
    { speaker:'—',
      text:"Fourteen minutes in the dark. The shooters are gone when the armoured unit arrives. The handset in Ekosodin stops calling at 21:10." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      mood:'angry', text:"We'll find another way to the Voice." },
  ],

  /* ===================== MISSION 8 — THE VOICE (SEASON 1 FINALE) ===================== */
  fin_brief_hold: [
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"We have the house, sir. Akintola Close, the blue gate at the east end. The cabinet data put the handset inside that compound every night this week." },
    { speaker:'SGT. UCHE',
      text:"Two men on the front gate. And something in the boys' quarters at the back they don't want the street to see." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Then that's where Osas is." },
    { speaker:'SGT. UCHE',
      text:"There's a back gate by the generator. Chained, most nights. Front is loud. Back needs luck — or someone who knows when the chain comes off." },
    { speaker:'SGT. UCHE', mood:'evasive',
      text:"One more thing. I requested backup from HQ an hour ago. Nobody has called back." },
  ],
  fin_brief_tail: [
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"The partial trace gives us this street, sir, not the house. But the Voice's phone moves. Every night a woman walks it from the junction to wherever they're holding him." },
    { speaker:'SGT. UCHE',
      text:"Burgundy jacket. Phone to her ear. We follow her, we find Osas. She sees us, they move him — or worse." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"So we stay invisible." },
    { speaker:'SGT. UCHE',
      text:"Keep your distance. She checks behind her. When she turns, you're just a man buying credit. Crouch if you have to." },
    { speaker:'SGT. UCHE', mood:'evasive',
      text:"And sir — HQ hasn't answered my request for backup. Not once tonight." },
  ],
  fin_kc: [
    { speaker:'TEEN SUSPECT — KC', portrait:'teen',
      text:"Oga Kelechi! Na me — KC. You no lock me up that day, so… I dey owe you.",
      textEn:"Officer Kelechi! It's me — KC. You didn't lock me up that day, so… I owe you." },
    { speaker:'TEEN SUSPECT — KC', mood:'evasive',
      text:"That woman wey stand for okada side — burgundy jacket? She dey buy credit for this kiosk every night. Same time. Then she waka go Akintola.",
      textEn:"The woman standing by the okada — burgundy jacket? She buys credit at this kiosk every night. Same time. Then she walks to Akintola." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Stay here, KC. Whatever you hear." },
  ],
  fin_tail_done: [
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"She's knocking. Blue gate. — Now, sir." },
    { speaker:'NACECA SYSTEM',
      text:"Courier detained without a sound. Her phone holds one saved number. No name. Just a letter: 'C'." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Blue gate. Let's get him out." },
  ],
  fin_tail_spotted: [
    { speaker:'SGT. UCHE', portrait:'sergeant', mood:'angry',
      text:"She made us. She's through the gate and screaming down that phone." },
    { speaker:'AGENT KELECHI', portrait:'kelechi', mood:'angry',
      text:"Then there's no time to be clever. Blue gate. Move." },
  ],
  fin_brief_call: [
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"No trace, no house, sir. But the Voice calls Mrs. Ehigie at nine every night. She gave us her phone." },
    { speaker:'SGT. UCHE',
      text:"Keep the Voice talking. Every second on the line, the van narrows the cell. Push too hard and the line goes dead." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"And if it goes dead?" },
    { speaker:'SGT. UCHE',
      text:"Then we knock on every gate in Ekosodin, and Osas hears us coming." },
    { speaker:'SGT. UCHE', mood:'evasive',
      text:"I asked HQ to authorise the trace. The Commander's office said they would 'look into it'. I didn't wait." },
  ],
  fin_call: [
    { speaker:'NACECA SYSTEM',
      text:"21:00. Mrs. Ehigie's phone lights up on the van's console. The trace begins." },
    { speaker:'THE VOICE', trace:8,
      text:"Mama Osas. Have you found the money — or have you found the police?",
      choices:[
        { text:"This is Agent Kelechi, NACECA. Mrs. Ehigie is safe. Let me speak to Osas.", trace:30, effect:{integrity:+2}, tag:'lawful' },
        { text:"The money is ready. Tell me where.", trace:25, tag:'savvy' },
        { text:"We already know where you are.", trace:5, effect:{publicTrust:-1}, tag:'harsh' },
      ]
    },
    { speaker:'THE VOICE', trace:8,
      text:"How formal. The boy is fine. He's a clever boy — too clever. He has something that belongs to me.",
      choices:[
        { text:"What could a student have that you'd risk all this for?", trace:30, tag:'savvy' },
        { text:"Name your price. We'll pay it.", trace:20, tag:'lawful' },
        { text:"You'll hang for this.", trace:0, hangup:true, tag:'harsh', next:'fin_call_hangup' },
      ]
    },
    { speaker:'THE VOICE', trace:8,
      text:"Copies. Files he should never have opened. Bring them to me and he walks home. Bring police and he doesn't.",
      choices:[
        { text:"Let me hear his voice first. Then we deal.", trace:30, effect:{integrity:+1}, tag:'lawful' },
        { text:"Where do we bring them?", trace:15, tag:'savvy' },
      ]
    },
    { speaker:'THE VOICE', trace:8,
      text:"…You still don't recognise my voice, do you? Good night, Agent." },
    { speaker:'AGENT KELECHI', portrait:'kelechi', mood:'afraid',
      text:"That voice. I know that voice." },
  ],
  fin_call_hangup: [
    { speaker:'THE VOICE',
      text:"Then we're finished talking." },
    { speaker:'NACECA SYSTEM',
      text:"The line goes dead. The trace stops short." },
  ],
  fin_call_locked: [
    { speaker:'NACECA SYSTEM',
      text:"TRACE LOCKED — Akintola Close, Ekosodin. Blue gate, east end. Call recorded in full." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Got her. Go, sir." },
  ],
  fin_call_partial: [
    { speaker:'NACECA SYSTEM',
      text:"TRACE INCOMPLETE — Akintola Close, one of four compounds. The blue gate is the only one with men on it." },
    { speaker:'SGT. UCHE', portrait:'sergeant', mood:'angry',
      text:"It's enough to find him. Not enough to surprise them." },
  ],
  fin_front: [
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Two on the gate, sir. Loud or nothing." },
    { speaker:'AGENT KELECHI', portrait:'kelechi', mood:'angry', effect:{force:+1, agencyFavour:+2},
      text:"Loud. NACECA! Down — get down!" },
  ],
  fin_back: [
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Musa's 'Engineer' said the generator man takes this chain off at nine to run the diesel… He was telling the truth." },
    { speaker:'AGENT KELECHI', portrait:'kelechi', effect:{integrity:+2},
      text:"Quiet. Straight to the quarters." },
  ],
  fin_osas: [
    { speaker:'OSAS EHIGIE', mood:'afraid',
      text:"Don't — please. Are you police? Real police?" },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"NACECA. Your mother sent us. Can you walk?" },
    { speaker:'OSAS EHIGIE', mood:'afraid',
      text:"It's not a gang. They keep saying 'Madam'. Madam wants the drive. Madam says the agency will never come here." },
    { speaker:'OSAS EHIGIE', mood:'relieved',
      text:"I hid it in my shoe. Payroll copies — a fixer, a chief, a man they call the Engineer. And the same initials at the top of every page. 'C.A.'" },
    { speaker:'AGENT KELECHI', portrait:'kelechi', mood:'afraid',
      text:"…Stay behind me." },
  ],
  fin_reveal: [
    { speaker:'THE VOICE',
      text:"Put the drive on the ground, Kelechi. Gently." },
    { speaker:'AGENT KELECHI', portrait:'kelechi', mood:'afraid',
      text:"…Commander?" },
    { speaker:'COMMANDER ADAEZE',
      text:"I told you on your first day. I don't need cowboys. I need control." },
    { speaker:'COMMANDER ADAEZE', mood:'evasive',
      text:"Obi. The Engineer. Ifeanyi. Every one of them was a source. I kept them close so I could keep them in line. Do you know how many kidnappings never happened because I knew who to call?",
      choices:[
        { text:"And when their money came, you kept that close too.", effect:{integrity:+4}, tag:'lawful' },
        { text:"Then talk to me. Tell me how it started.", effect:{agencyFavour:+1}, tag:'savvy', flag:{ fin_bodycam:true } },
        { text:"You put a student in a box to save your career.", effect:{publicTrust:+2, agencyFavour:-2}, tag:'harsh' },
      ]
    },
    { speaker:'COMMANDER ADAEZE', mood:'angry',
      text:"That boy opened files he couldn't understand. I have kept this agency alive for twenty years. I protected you. Who do you think signed your posting?" },
    { speaker:'COMMANDER ADAEZE', mood:'evasive',
      text:"Give me the drive. Walk out with me. Tomorrow you're a Superintendent, and tonight never happened.",
      choices:[
        { text:"No, ma. Commander Adaeze, you are under arrest.", effect:{integrity:+6, publicTrust:+4}, tag:'lawful' },
        { text:"Superintendent. Say that once more — for the body-cam.", effect:{agencyFavour:-2}, tag:'savvy', flag:{ fin_bodycam:true } },
        { text:"Uche. Cuff her.", effect:{force:+1, publicTrust:-1}, tag:'harsh' },
      ]
    },
  ],
  fin_end_proven: [
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Hands where I can see them, ma." },
    { speaker:'COMMANDER ADAEZE', mood:'afraid',
      text:"You think this ends with me? You have no idea who I answer to." },
    { speaker:'AGENT KELECHI', portrait:'kelechi', mood:'angry',
      text:"Then you can tell the court. It starts with you." },
  ],
  fin_end_contested: [
    { speaker:'COMMANDER ADAEZE', mood:'evasive',
      text:"One piece of evidence and a frightened boy. My lawyers will be home before you are." },
    { speaker:'AGENT KELECHI', portrait:'kelechi', mood:'angry',
      text:"Then they'll find the door locked." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"It'll hold long enough to stop her making calls, sir. That's tonight's win." },
  ],
  fin_end_unproven: [
    { speaker:'COMMANDER ADAEZE', mood:'evasive',
      text:"A frightened boy and a hunch, Kelechi. That is all you have." },
    { speaker:'SGT. UCHE', portrait:'sergeant', mood:'angry',
      text:"We can't hold her on what we know, sir." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Then we tell Zonal everything we know. Tonight. In writing." },
    { speaker:'NACECA SYSTEM',
      text:"02:14 — Benin Zonal Command relieves Cdr. Adaeze of command pending inquiry." },
  ],

  /* ===================== COLD OPEN — "THE TRANSFER" ===================== */
  co_plate_partial: [
    { speaker:'AGENT KELECHI', portrait:'kelechi', mood:'angry', text:"Partial. K-J-A, one, then the rain took it." },
    { speaker:'COMMANDER ADAEZE (RADIO)', text:"Partial is something. Good. Come in." },
  ],
  co_plate_none: [
    { speaker:'AGENT KELECHI', portrait:'kelechi', mood:'afraid', text:"No. He was gone before I reached the road." },
    { speaker:'COMMANDER ADAEZE (RADIO)', mood:'evasive', text:"Then we work with what you saw. Good. Come in." },
  ],
  co_plate_driver: [
    { speaker:'AGENT KELECHI', portrait:'kelechi', text:"The rider. Red cap, a scar down his left cheek." },
    { speaker:'COMMANDER ADAEZE (RADIO)', text:"Faces are better than plates. Good. Come in." },
  ],
  /* ===================== MISSION 1 — THE FIELD OFFICE (tutorial beats) ===================== */
  hq_board: [
    { speaker:'NACECA SYSTEM',
      text:"The case board. Last night's photo is already pinned: a man in a blue shirt with a brown folder, rain across the lens." },
    { speaker:'NACECA SYSTEM',
      text:"Strings run from the photo to three POS agents in Ikeja and two SIMs registered to a dead grandmother." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Everything on this board runs through that market." },
  ],
  hq_phone: [
    { speaker:'NACECA SYSTEM',
      text:"Your phone. Two new messages." },
    { speaker:'TEXT · MUM',
      text:"Did you get home safe? You didn't call. Eat something before work o." },
    { speaker:'TEXT · TUNDE',
      text:"Oga Kelechi! Tunde here. That SIM boy don show for Ikeja market this morning. Come before 10.",
      textEn:"Officer Kelechi! It's Tunde. That SIM boy turned up at Ikeja market this morning. Come before 10." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Ikeja, then. After the Commander." },
  ],
};
