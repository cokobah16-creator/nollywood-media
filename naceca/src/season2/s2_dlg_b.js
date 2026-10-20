/* =========================================================================
   NACECA · Season 2 · v13_dlg_b.js
   Case 11 · Black Rain (Ethiope creeks) and Case 12 · Paper Oil (Port
   Harcourt): dialogue, the five documents, the aftermath pages, the hub
   phone after each case, and the tips from the two sources these cases can
   make — NETS (Pa Timi) and TIDE (Chairman Ibinabo).
   Contract: s2/CASES.md. Data only: the game code decides when a key plays.
   Load after v12_docs.js (it assigns V12.DOCS).
   ========================================================================= */
(function(){
'use strict';
const V13 = window.V13 = window.V13 || {};
const V12 = window.V12 = window.V12 || {};
V12.DOCS = V12.DOCS || {};

/* ===================== DIALOGUE ===================== */
Object.assign(DIALOGUE, {

  /* ---------- CASE 11 · BLACK RAIN — DELTA · ETHIOPE CREEKS ---------- */

  // the landing at dusk, before they go in
  m11_timi: [
    { speaker:'NACECA SYSTEM',
      text:"Dusk at the landing. An old man draws in his net hand over hand. It comes out of the Ethiope black and heavy, and there is nothing in it." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Pa Timi. Fifty years on these creeks. The waterside says nobody reads the forks like him." },
    { speaker:'PA TIMI',
      text:"You are the people from the Sapele market. On this water, news is faster than engines." },
    { speaker:'PA TIMI',
      text:"My father could tell the hour by the colour of this creek. Brown in the morning. Gold in the evening." },
    { speaker:'PA TIMI',
      text:"Now it is one colour all day.",
      choices:[
        { text:"Let me take the other end, Pa.", tag:'kind',
          flag:{ s2_timi:'source' }, next:'m11_timi_source' },
        { text:"How much to take us up the creek tonight?", tag:'savvy',
          flag:{ s2_timi:'cold' }, next:'m11_timi_cold' },
      ] },
  ],
  m11_timi_source: [
    { speaker:'NACECA SYSTEM',
      text:"The net is cold and slick. When Kelechi lets go, his hands are black to the wrist." },
    { speaker:'PA TIMI',
      text:"Hm. Now you have touched it. City people take photograph and go." },
    { speaker:'PA TIMI',
      text:"I will not say the name of that place. On this water, the man who says names is the man they come looking for." },
    { speaker:'PA TIMI',
      text:"But I will tell you where my nets go black. Below the second bend. Above it, they still come up clean." },
    { speaker:'PA TIMI',
      text:"Two of the boys who cook there are from this landing. Their fathers fished with me. Remember they have mothers." },
    { speaker:'PA TIMI',
      text:"The man who minds the fast boat sleeps beside it, at the barge end. When trouble comes, he runs first. That kind always runs first." },
    { speaker:'PA TIMI',
      text:"We go after midnight, when the boys are tired and the fire is loud. I paddle the last part. Your engine sleeps." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"And after tonight, Pa? If I need to know what's moving on this water?" },
    { speaker:'PA TIMI',
      text:"Come and buy fish. If I tell you the nets are black, something is moving." },
  ],
  m11_timi_cold: [
    { speaker:'PA TIMI', mood:'evasive',
      text:"Twenty thousand. Fuel is your own." },
    { speaker:'PA TIMI', mood:'evasive',
      text:"My nets come up black below the second bend. That is what I know. It is what everybody knows." },
    { speaker:'PA TIMI',
      text:"I take you near, I wait, I bring you back. I did not see you. You did not see me." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Cheaper to say good evening, sir." },
  ],

  // radio: the approach
  m11_arrive: [
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Engine off. Paddles from here." },
    { speaker:'NACECA SYSTEM',
      text:"The smell arrives before the camp does: burnt diesel, rotten eggs, wet ash. Then the glow, orange through the mangrove roots, like a town on fire with no town in it." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Three drums burning. A barge at the far jetty. Count the boys, sir. Then count them again." },
  ],

  // the cooling drums
  m11_samples: [
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Cooling drum. That's tonight's product. Up the creek they sell it as 'dry fuel' or 'wet fuel', whichever the buyer wants to hear." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Three bottles, seals, labels. Four minutes to do it properly." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"The boy on the far drum turns around every two.",
      choices:[
        { text:"Properly. Label, photograph, and we both sign across the seal.", tag:'lawful',
          flag:{ s2_samples:'sealed' }, next:'m11_samples_sealed' },
        { text:"Grab a bottle. We go.", tag:'savvy',
          flag:{ s2_samples:'grabbed' }, next:'m11_samples_grabbed' },
      ] },
  ],
  m11_samples_sealed: [
    { speaker:'NACECA SYSTEM',
      text:"Bottle, label, photograph. On each label Kelechi writes COOLING DRUM 1 · 01:41 · K. / U., and both men sign across the tape." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"He turned. He saw two men writing. He decided he didn't." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"That bottle will survive a lawyer." },
  ],
  m11_samples_grabbed: [
    { speaker:'NACECA SYSTEM',
      text:"Kelechi dips a water bottle into the drum and screws the cap on. Warm through the plastic. No label, no seal." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Fast. In court somebody will ask how we know it came from this drum, and not from a jerrycan in Sapele." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Then I'll tell them." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Hm." },
  ],

  // Felix at the shelter
  m11_felix: [
    { speaker:'FELIX UGBEKILE',
      text:"Don't shout, Officer. The boys will run into the mangroves, and there are snakes in there older than this camp." },
    { speaker:'FELIX UGBEKILE',
      text:"Felix Ugbekile. B.Eng. Petroleum, Benin, 1996. Fourteen years a production engineer at a flow station. On a clear night you can see its flare from here." },
    { speaker:'FELIX UGBEKILE',
      text:"They laid me off in 2016 with a handshake and a calendar. A good calendar. Glossy." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"And now you cook crude in drums." },
    { speaker:'FELIX UGBEKILE',
      text:"I know what that smoke does before you tell me. Benzene. Sulphur. Soot in the lungs. I wrote safety reports for twelve years. Nobody read those either." },
    { speaker:'FELIX UGBEKILE', mood:'angry',
      text:"They pumped this creek for fifty years and left it like this, and I'm the one who'll be in the newspaper. Fine. Put me in.",
      choices:[
        { text:"Help me catch the people who buy from you.", tag:'savvy',
          flag:{ s2_felix:'cooperating' }, next:'m11_felix_coop' },
        { text:"Felix Ugbekile, you're under arrest.", tag:'lawful',
          flag:{ s2_felix:'arrested' }, next:'m11_felix_arrest' },
        { text:"Talk now, or every boy in this camp goes down with you.", tag:'harsh',
          effect:{ integrity:-4 }, flag:{ s2_felix:'threatened' }, next:'m11_felix_threat' },
      ] },
  ],
  m11_felix_coop: [
    { speaker:'FELIX UGBEKILE', mood:'relieved',
      text:"The people who buy from me. Ten years I've waited for an officer to ask that, instead of the other question." },
    { speaker:'FELIX UGBEKILE',
      text:"The barge is TEKENA 2. She calls at twenty camps like this one and takes forty-four drums from each. Do the arithmetic. I did." },
    { speaker:'FELIX UGBEKILE',
      text:"On Thursdays she discharges at the Riverstone tank farm in Port Harcourt. Every week. Like church." },
    { speaker:'FELIX UGBEKILE',
      text:"Her paper says the diesel came from a depot. The paper is mine. Riverstone sends the books already signed, and I fill in the rest. Neat handwriting is what I have left." },
    { speaker:'FELIX UGBEKILE',
      text:"The money comes back through Sapele. Cash, in sacks, through a changer. I never asked his name. I'm a coward, Officer. Not a fool." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"You'll say all of this again, on the record, with a lawyer beside you." },
    { speaker:'FELIX UGBEKILE',
      text:"Then write it down properly. If I'm going to be a witness, I'll be an accurate one." },
  ],
  m11_felix_arrest: [
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"For refining and dealing in petroleum products without lawful authority." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"You may remain silent. You may have a lawyer, and if you can't pay one, Legal Aid will send one. Your family will be told where you are." },
    { speaker:'FELIX UGBEKILE',
      text:"Ten years on this creek, and you're the first officer who said all of that. In order." },
    { speaker:'FELIX UGBEKILE',
      text:"Then I'll take the silence, thank you. Ask me again in Benin, with a lawyer. I may surprise you." },
  ],
  m11_felix_threat: [
    { speaker:'FELIX UGBEKILE', mood:'angry',
      text:"So that's how it's done on your side too. Good. I was beginning to think I was the only criminal on this creek." },
    { speaker:'FELIX UGBEKILE', mood:'angry',
      text:"TEKENA 2. The Riverstone tank farm, Port Harcourt. Thursdays. The money comes back through Sapele. There." },
    { speaker:'FELIX UGBEKILE',
      text:"Write it down exactly the way you got it. When you tell a judge I volunteered it, I'll be in the room." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Sir. The boys heard you." },
  ],

  // the escort bolts — the chase
  m11_escort_runs: [
    { speaker:'CAMP ESCORT', mood:'afraid',
      text:"Wahala! Police don enter camp! Una run!",
      textEn:"Trouble! Police in the camp! Run!" },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Boardwalk! He's yours, sir. I'll hold the camp." },
  ],
  m11_chase_caught: [
    { speaker:'CAMP ESCORT', mood:'afraid',
      text:"Oga, I no be anybody! Na boat I dey drive. Dem pay me make I watch barge, na all!",
      textEn:"Sir, I'm nobody! I just drive the boat. They pay me to watch the barge, that's all!" },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Then tell it to a lawyer. You're under arrest for guarding an illegal refinery. You can stay silent." },
    { speaker:'NACECA SYSTEM',
      text:"His phone landed face up in the mud, still unlocked. Last call, 00:52, eleven minutes: GODWIN — R.M.S." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"R.M.S. Riverstone Marine Services." },
  ],
  m11_chase_lost: [
    { speaker:'SGT. UCHE', portrait:'sergeant', mood:'angry',
      text:"Gone into the roots. By sunrise he'll be at a jetty in Koko with a story." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"And whoever he calls will know by breakfast." },
  ],

  // the camp: what happens to it (Uche and Pa Timi present)
  m11_camp_decide: [
    { speaker:'NACECA SYSTEM',
      text:"The fires are out. Eight boys sit in a row on the boardwalk, hands on their knees. The youngest has no beard yet." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Eight of them, sir. Oldest maybe twenty. Five thousand naira a night, they say." },
    { speaker:'CAMP BOY', mood:'afraid',
      text:"Oga, abeg. My mama dey sell fish for landing. If I no work, who go buy net for her?",
      textEn:"Sir, please. My mother sells fish at the landing. If I don't work, who'll buy her a net?" },
    { speaker:'PA TIMI',
      text:"That is Tari. His father fished beside me for twenty years. The creek fed his father. It does not feed him." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Your call, sir.",
      choices:[
        { text:"Call the Navy. They burn it at first light, so it never cooks again.", tag:'savvy',
          effect:{ agencyFavour:+4, publicTrust:-3, integrity:-1 }, flag:{ s2_camp:'navy' }, next:'m11_camp_navy' },
        { text:"Felix comes with us. The boys give statements and go home.", tag:'kind',
          effect:{ publicTrust:+4, integrity:+2 }, flag:{ s2_camp:'felix_only' }, next:'m11_camp_felix_only' },
        { text:"Everyone in this camp is under arrest.", tag:'harsh',
          effect:{ publicTrust:-4, heat:+8 }, flag:{ s2_camp:'mass' }, next:'m11_camp_mass' },
      ] },
  ],
  m11_camp_navy: [
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Navy says first light. They're bringing a photographer." },
    { speaker:'PA TIMI',
      text:"When they burn it, the oil in that pit runs into my water. Next month they build another camp, one bend up." },
    { speaker:'PA TIMI',
      text:"On television, it will look like winning." },
  ],
  m11_camp_felix_only: [
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Names, ages, where you live, what you saw tonight. Then go home. If anyone asks, you were witnesses — because you were." },
    { speaker:'CAMP BOY', mood:'relieved',
      text:"Oga, God bless you. I no go come back here again.",
      textEn:"Sir, God bless you. I won't come back here again." },
    { speaker:'PA TIMI',
      text:"Some of them will come back. Hunger has a long memory. But tonight their mothers will see them." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Statements done by four, sir. Felix is in the boat." },
  ],
  m11_camp_mass: [
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"All of them in custody, sir. We'll need three boats." },
    { speaker:'CAMP BOY', mood:'afraid',
      text:"Oga, abeg! Wetin I go tell my mama?",
      textEn:"Sir, please! What will I tell my mother?" },
    { speaker:'PA TIMI', mood:'angry',
      text:"By morning their mothers will be at the Area Command. I will tell them which officer to ask for." },
  ],

  // TEKENA 2 at the far jetty
  m11_barge: [
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"TEKENA 2. Loaded and low in the water. Crew of three in the deckhouse, asleep or pretending." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Tracker's in my bag. Magnet, fourteen days of battery." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Tag her and she shows us who buys. Seize her and we get a barge, three deckhands and a photograph.",
      choices:[
        { text:"Plant the tracker. Let her sail.", tag:'savvy',
          flag:{ s2_barge:'tagged' }, next:'m11_barge_tagged' },
        { text:"Seize her now.", tag:'lawful',
          effect:{ agencyFavour:+2 }, flag:{ s2_barge:'seized' }, next:'m11_barge_seized' },
      ] },
  ],
  m11_barge_tagged: [
    { speaker:'NACECA SYSTEM',
      text:"Under the stern rail, where the rust is thickest, the tracker takes hold with a soft clack. A green light blinks twice, then nothing." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Now we see where she sleeps." },
  ],
  m11_barge_seized: [
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Three deckhands on their knees, and a barge none of us can drive. The Navy will tow her to Warri." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"And by noon, whoever was waiting for her in Port Harcourt knows she isn't coming." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"A barge in the hand, sir." },
  ],

  // dawn on the water
  m11_end: [
    { speaker:'NACECA SYSTEM',
      text:"Dawn on the Ethiope. Behind the boat, black smoke leans to the north-east, the way the wind always takes it here." },
    { speaker:'PA TIMI',
      text:"When I was a boy, my father drank from this creek with his hand. Like this." },
    { speaker:'PA TIMI',
      text:"I don't tell my grandchildren. They will think I am lying to them." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"We'll come back, Pa." },
    { speaker:'PA TIMI',
      text:"Everybody comes back. Next time, bring the people who buy it. Not only the boys who cook it." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"That's where we're going, Pa." },
  ],

  /* ---------- CASE 12 · PAPER OIL — RIVERS · PORT HARCOURT WATERFRONT ---------- */

  // outside Riverstone's gate: warrant, or not
  m12_hauwa: [
    { speaker:'NACECA SYSTEM',
      text:"Riverstone's tanks stand white behind razor wire. Outside the gate, a woman in a black suit is eating bole and fish out of a sheet of newspaper." },
    { speaker:'BARRISTER DANLADI',
      text:"Agent Kelechi. Hauwa Danladi, NACECA Legal. Have some bole. The fish is from the woman by the gate, and she knows more about this place than either of us." },
    { speaker:'BARRISTER DANLADI',
      text:"Your problem is that gate. Private property. You go through it with a search warrant, or with a very good story for a judge." },
    { speaker:'BARRISTER DANLADI',
      text:"ACJA, section 146: a magistrate signs the warrant. The duty magistrate signs at home after six. Fifty minutes there and back, if Aba Road is feeling merciful." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Fifty minutes is a long time for a shredder, ma." },
    { speaker:'BARRISTER DANLADI',
      text:"It is. Evidence Act, sections 14 and 15: a judge may refuse what you find by walking past the law. The more deliberate the shortcut, the likelier she refuses.",
      choices:[
        { text:"Get the warrant.", tag:'lawful',
          flag:{ s2_warrant:'waited' }, next:'m12_hauwa_wait' },
        { text:"We go in now.", tag:'harsh',
          effect:{ integrity:-2 }, flag:{ s2_warrant:'went_in' }, next:'m12_hauwa_go' },
      ] },
  ],
  m12_hauwa_wait: [
    { speaker:'BARRISTER DANLADI',
      text:"Good. This company runs on paper: paper imports, paper owners, paper oil. We beat paper with better paper." },
    { speaker:'BARRISTER DANLADI',
      text:"Watch the gate. Nobody leaves with a box, a bag or a suspicious amount of enthusiasm. And finish my bole." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Slower, sir. But it holds." },
  ],
  m12_hauwa_go: [
    { speaker:'BARRISTER DANLADI',
      text:"Then I didn't hear this." },
    { speaker:'BARRISTER DANLADI',
      text:"I'll be two steps behind you, collecting whatever is left of my case. Touch nothing you can't explain to a judge." },
  ],
  m12_warrant_back: [
    { speaker:'BARRISTER DANLADI',
      text:"Signed at 18:22. The magistrate asked if I'd eaten. I lied to a judicial officer. Put that in nobody's report." },
    { speaker:'BARRISTER DANLADI',
      text:"This is Corporal Amina. If there is a woman to search in there, she does it. Not you. Not the sergeant. Her." },
    { speaker:'CPL. AMINA',
      text:"Evening, sir. I brought gloves, and a great deal of patience." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Office lights went on at minute twelve, sir. Nobody came out." },
  ],

  // the gate (code picks the version; reading DIALOGUE.m12_gate also returns the right one)
  m12_gate_warrant: [
    { speaker:'TANK FARM SECURITY',
      text:"Oga, office don close. Come back Monday.",
      textEn:"Sir, the office is closed. Come back Monday." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"NACECA. This is a search warrant, signed by a magistrate tonight. Read it. Then open the gate." },
    { speaker:'BARRISTER DANLADI',
      text:"Any hour of any day, Sunday included. Section 148. Monday is also included, if you insist." },
    { speaker:'TANK FARM SECURITY', mood:'evasive',
      text:"…Na Madam Sotonye get the office key. Make I open, make I call am.",
      textEn:"…Madam Sotonye has the office key. I'll open up and call her." },
  ],
  m12_gate_nowarrant: [
    { speaker:'TANK FARM SECURITY',
      text:"Oga, office don close. Una get paper?",
      textEn:"Sir, the office is closed. Do you have a paper?" },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"NACECA. Open the gate." },
    { speaker:'TANK FARM SECURITY', mood:'afraid',
      text:"If I open this gate without paper, na me dem go sack tomorrow. Abeg.",
      textEn:"If I open this gate without a paper, I'm the one they'll sack tomorrow. Please." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"…Sir." },
    { speaker:'NACECA SYSTEM',
      text:"The guard opens the gate and steps away from it, as if it might bite him later. Behind you, Barrister Danladi writes something down." },
  ],

  // after the warrant: the shredder (the code runs the strip-sorting minigame)
  m12_shred: [
    { speaker:'NACECA SYSTEM',
      text:"The manager's office. The shredder is still warm, and its bin is full to the lip with paper strips." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Fifty minutes. Somebody used them." },
    { speaker:'BARRISTER DANLADI',
      text:"Bag the bin whole. Every strip. Paper put back together is still the document — and twice as persuasive, because somebody tried to kill it." },
  ],

  // searching the manager — warrant branch, Corporal Amina present
  m12_search: [
    { speaker:'SOTONYE JUMBO', mood:'afraid',
      text:"I'm the manager. Sotonye Jumbo. Everything here is in order. Everything is filed. I file everything." },
    { speaker:'BARRISTER DANLADI',
      text:"Her handbag and her person, Agent. And before you move: ACJA, section 9(3). A woman is searched by a woman, and decently." },
    { speaker:'CPL. AMINA',
      text:"The side office has a door that closes, sir.",
      choices:[
        { text:"Corporal Amina, please.", tag:'lawful',
          flag:{ s2_search:'amina' }, next:'m12_search_amina' },
        { text:"I'll do it myself.", tag:'harsh',
          effect:{ integrity:-3 }, flag:{ s2_search:'self' }, next:'m12_search_self' },
      ] },
  ],
  // searching the manager — no-warrant branch, no woman officer on site
  m12_search_noamina: [
    { speaker:'SOTONYE JUMBO', mood:'afraid',
      text:"I'm the manager. Sotonye Jumbo. Do you have a warrant? Show me the warrant. I would like to read it." },
    { speaker:'BARRISTER DANLADI',
      text:"Her handbag and her person need searching. There's no woman officer here, because nobody went to the magistrate, because — never mind." },
    { speaker:'BARRISTER DANLADI',
      text:"ACJA, section 9(3): a woman is searched by a woman, and decently. Corporal Amina at the Area Command is forty minutes away. Wait for her, or don't search.",
      choices:[
        { text:"Call Corporal Amina. We wait.", tag:'lawful',
          flag:{ s2_search:'amina' }, next:'m12_search_wait' },
        { text:"Leave her bag. We don't search her tonight.", tag:'kind',
          next:'m12_search_skip' },
        { text:"I'll do it myself.", tag:'harsh',
          effect:{ integrity:-3 }, flag:{ s2_search:'self' }, next:'m12_search_self' },
      ] },
  ],
  m12_search_amina: [
    { speaker:'NACECA SYSTEM',
      text:"Five minutes behind a closed door. Corporal Amina comes out with a list in her own handwriting." },
    { speaker:'CPL. AMINA',
      text:"Two phones, car keys, reading glasses, a church bulletin. And three hundred and fifty thousand naira in an envelope, pencilled 'T3'." },
    { speaker:'BARRISTER DANLADI',
      text:"By a woman, decently, and on paper. Section 9(3) just paid for itself." },
  ],
  m12_search_wait: [
    { speaker:'NACECA SYSTEM',
      text:"Forty minutes. Sotonye sits very straight and does not touch her bag. Corporal Amina arrives with gloves and a great deal of patience." },
    { speaker:'CPL. AMINA',
      text:"Two phones, car keys, reading glasses, a church bulletin. And three hundred and fifty thousand naira in an envelope, pencilled 'T3'." },
    { speaker:'BARRISTER DANLADI',
      text:"Late, but by a woman, decently, and on paper. Late I can explain to a judge." },
  ],
  m12_search_skip: [
    { speaker:'SOTONYE JUMBO', mood:'relieved',
      text:"…Thank you. I — thank you." },
    { speaker:'BARRISTER DANLADI',
      text:"Whatever is in that bag goes home with her. That's the price of the right answer. It's usually worth paying." },
  ],
  m12_search_self: [
    { speaker:'SOTONYE JUMBO', mood:'angry',
      text:"Don't touch me! A woman searches a woman. You know the law — I know you know the law!" },
    { speaker:'NACECA SYSTEM',
      text:"Kelechi empties the handbag onto the desk and pats down her jacket. Phones, keys, glasses, an envelope of cash pencilled 'T3'. She doesn't look at him once." },
    { speaker:'SOTONYE JUMBO', mood:'angry',
      text:"My lawyer will hear about every second of this. I'll write it down for him. I write everything down." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Sir." },
  ],

  // the seizure inventory
  m12_inventory: [
    { speaker:'SOTONYE JUMBO',
      text:"Before you carry anything out — I want a list. Every item. I keep copies of everything. It's a sickness." },
    { speaker:'BARRISTER DANLADI',
      text:"It's also the law. ACJA, section 10: everything seized goes on an inventory, you both sign it, and she keeps a copy." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Thirty minutes, sir. Maybe forty.",
      choices:[
        { text:"Write it up. She signs, I sign, she keeps a copy.", tag:'lawful',
          flag:{ s2_inventory:'signed' }, next:'m12_inventory_signed' },
        { text:"No time. Bag it and go.", tag:'harsh',
          flag:{ s2_inventory:'skipped' }, next:'m12_inventory_skipped' },
      ] },
  ],
  m12_inventory_signed: [
    { speaker:'NACECA SYSTEM',
      text:"Thirty-one items. Sotonye reads every line twice, corrects one serial number, and signs. Her hand only shakes on the signature." },
    { speaker:'SOTONYE JUMBO', mood:'relieved',
      text:"Thank you. Nobody has given me a copy of anything in two years." },
  ],
  m12_inventory_skipped: [
    { speaker:'SOTONYE JUMBO', mood:'angry',
      text:"No list? Then how will anybody know what you took out of here — or what you brought in?" },
    { speaker:'BARRISTER DANLADI',
      text:"Her lawyer will write the list for you. From memory. Generously." },
  ],

  // the manager and her insurance
  m12_sotonye: [
    { speaker:'SOTONYE JUMBO', mood:'afraid',
      text:"I keep records. That's my job, and that's my problem. I can't see a thing without writing it down." },
    { speaker:'SOTONYE JUMBO',
      text:"When Tank 3 started receiving 'imports' with no vessel and no customs entry, I wrote down what really came in. On my own USB. In my car." },
    { speaker:'SOTONYE JUMBO',
      text:"In case somebody like you came one day. Or somebody like them." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Who is 'them'?" },
    { speaker:'SOTONYE JUMBO', mood:'evasive',
      text:"Mr. Godwin brings the paper and tells me what it says. He drives a Prado for a man whose name I will not say in this office." },
    { speaker:'SOTONYE JUMBO', mood:'afraid',
      text:"I have two children. My daughter writes WAEC in May. Tell me what happens to them if I talk.",
      choices:[
        { text:"Talk to us as a witness. I'll ask Barrister Danladi to deal fairly with you, and we'll keep your family safe.", tag:'kind',
          effect:{ integrity:+2 }, flag:{ s2_sotonye:'witness' }, next:'m12_sotonye_witness' },
        { text:"Sotonye Jumbo, you're under arrest.", tag:'lawful',
          flag:{ s2_sotonye:'arrested' }, next:'m12_sotonye_arrested' },
        { text:"Think about your children, madam. Who raises them while you're in prison?", tag:'harsh',
          effect:{ integrity:-4 }, flag:{ s2_sotonye:'pressured' }, next:'m12_sotonye_pressured' },
      ] },
  ],
  m12_sotonye_witness: [
    { speaker:'BARRISTER DANLADI',
      text:"I can't promise you an outcome, Mrs. Jumbo. I can promise to tell the judge exactly what you did tonight, and when you did it." },
    { speaker:'SOTONYE JUMBO', mood:'relieved',
      text:"Glovebox. The grey Corolla by the generator house. The envelope says 'INSURANCE'. I labelled it. Of course I labelled it." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Of course she did." },
  ],
  m12_sotonye_arrested: [
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"For receiving petroleum products without lawful authority, and for false entries in the Tank 3 intake log." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"You may remain silent. You may have a lawyer. Your family will be told where you are." },
    { speaker:'SOTONYE JUMBO', mood:'afraid',
      text:"My daughter is home alone. Call my sister in Rumuokoro. Please. Before you call anybody else." },
    { speaker:'NACECA SYSTEM',
      text:"Her car is in the yard. In the glovebox, an envelope labelled INSURANCE. Inside it, one USB stick." },
  ],
  m12_sotonye_pressured: [
    { speaker:'SOTONYE JUMBO', mood:'afraid',
      text:"You people are the same. Exactly the same. They also ask me about my children." },
    { speaker:'SOTONYE JUMBO', mood:'afraid',
      text:"Glovebox. The grey Corolla. An envelope that says 'INSURANCE'. Take it. Take it and go." },
    { speaker:'BARRISTER DANLADI',
      text:"Agent. A witness who talks because she's afraid of us is a witness her lawyer will adore." },
  ],

  // phone: the CAC search (Tobi if alive, else Igbinosa)
  m12_tobi_cac: [
    { speaker:'TOBI',
      text:"Kelechi — sorry. Agent. I pulled the CAC record on Riverstone Marine Services. Ninety-five percent: one Godwin Ereba." },
    { speaker:'TOBI',
      text:"Then I ran his BVN. One salary. ₦180,000 a month, from the Douglas-Akpan Foundation. Job title: driver." },
    { speaker:'TOBI',
      text:"I kept books for companies like this for six months before I understood them. This one doesn't even try. Somebody never expected anyone to look." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Send it all to Barrister Danladi. And Tobi — thank you." },
    { speaker:'TOBI', mood:'relieved',
      text:"You came back for me in Asaba. I'll be pulling records for you until I'm sixty." },
  ],
  m12_igbinosa_cac: [
    { speaker:'MR. IGBINOSA',
      text:"Agent. Igbinosa. The CAC search is back. Riverstone Marine Services Limited: ninety-five percent held by one Godwin Ereba." },
    { speaker:'MR. IGBINOSA',
      text:"His BVN shows one income. One hundred and eighty thousand naira monthly, from the Douglas-Akpan Foundation. Designation: driver." },
    { speaker:'MR. IGBINOSA',
      text:"Twenty-two years in forensics. I have never seen a driver buy a tank farm. Perhaps he saves very carefully." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Send it to Barrister Danladi." },
    { speaker:'MR. IGBINOSA',
      text:"Sent. It is a printout. She will want it certified before any court sees it. Lawyers are like that." },
  ],

  // the union shed by the jetty
  m12_ibinabo: [
    { speaker:'NACECA SYSTEM',
      text:"The union shed by the jetty: a tin roof, a whiteboard of boat numbers, and a woman in a red wrapper counting money into a ledger without looking up." },
    { speaker:'CHAIRMAN IBINABO',
      text:"You are the NACECA people who stood at Riverstone's gate from five o'clock. My drivers were watching you longer than you were watching that gate." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Good evening, madam." },
    { speaker:'CHAIRMAN IBINABO',
      text:"Chairman. Eleven years. 'Madam' is what men call me when they want a discount." },
    { speaker:'CHAIRMAN IBINABO', mood:'angry',
      text:"Since last year, boys in black T-shirts collect three thousand naira from every boat. 'Waterfront security levy.' Security from who? From them." },
    { speaker:'CHAIRMAN IBINABO',
      text:"The same boys ride the Big Man's boat when it comes from Bonny on Thursday nights. No lights." },
    { speaker:'CHAIRMAN IBINABO',
      text:"On Thursdays my drivers are off the water by ten. Nobody wrote that rule. Everybody obeys it." },
    { speaker:'CHAIRMAN IBINABO',
      text:"So. What do my drivers get for knowing things?",
      choices:[
        { text:"The levies stop, and your drivers are left alone. You have my word, in writing to Zonal tonight.", tag:'savvy',
          flag:{ s2_ibinabo:'source' }, next:'m12_ibinabo_source' },
        { text:"Your union collects dues on a jetty with no permit. Talk, or I start there.", tag:'harsh',
          flag:{ s2_ibinabo:'cold' }, next:'m12_ibinabo_cold' },
      ] },
  ],
  m12_ibinabo_source: [
    { speaker:'CHAIRMAN IBINABO',
      text:"Your word. I have a drawer full of words from men in uniform. I'll put yours on top." },
    { speaker:'CHAIRMAN IBINABO',
      text:"The Bonny boat ties up at Riverstone's old jetty after midnight. Two flying boats with her, six boys, guns. They load something small and heavy and leave before two." },
    { speaker:'CHAIRMAN IBINABO',
      text:"If I send you 'the tide is high', the Bonny boat is in. If I send nothing, it isn't. Don't call me. I call you." },
    { speaker:'CHAIRMAN IBINABO',
      text:"And Officer — if the levy boys are still on my jetty in two weeks, you will never find me again. Or my boats." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Two weeks, sir." },
  ],
  m12_ibinabo_cold: [
    { speaker:'CHAIRMAN IBINABO', mood:'angry',
      text:"Hm. You came to my shed to frighten my union with a permit." },
    { speaker:'CHAIRMAN IBINABO',
      text:"Thursday. Barges. No lights. Everybody on this water knows that much. Now go and lean on somebody who is afraid of you." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"She wasn't, sir." },
  ],

  // Hauwa: where Riverstone's money goes (code collects 'bank_trail')
  m12_bank: [
    { speaker:'BARRISTER DANLADI',
      text:"Riverstone's bank finally answered. Thirty-six transfers in three years, never once late, all to one company: Maitama Haven Properties Limited." },
    { speaker:'BARRISTER DANLADI',
      text:"Maitama Haven owns exactly one thing: a seven-bedroom house in Maitama, Abuja. No tenants. The electricity bill is paid every month anyway." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"A tank farm in Port Harcourt, paying for an empty mansion in Abuja." },
    { speaker:'BARRISTER DANLADI',
      text:"Very punctually. Before a court sees any of it, the bank's own officer certifies the statements. Banker's books have their own rituals." },
  ],

  // phone: the summons
  m12_summons: [
    { speaker:'MR. KUTI',
      text:"Agent Kelechi. Kuti, Office of the Director-General." },
    { speaker:'MR. KUTI',
      text:"The Director-General will see you in Abuja. Tomorrow. Ten o'clock." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"Does Commander Osagie know?" },
    { speaker:'MR. KUTI',
      text:"The Director-General's diary is not copied to Zonal Commands. He has followed your work with great interest. Ten o'clock, Agent." },
    { speaker:'NACECA SYSTEM',
      text:"The line goes dead before Kelechi can answer." },
  ],

  m12_end: [
    { speaker:'NACECA SYSTEM',
      text:"Night on the waterfront. Bole smoke and generator smoke, and somewhere out on the Bonny River, an engine running with no lights." },
    { speaker:'BARRISTER DANLADI',
      text:"Go to Abuja. Say very little. The moment you leave his office, write down every word he said, with the time." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"You think he'll say something?" },
    { speaker:'BARRISTER DANLADI',
      text:"Men like that always say something. They think the room belongs to them." },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Abuja. Smooth roads, they say." },
    { speaker:'AGENT KELECHI', portrait:'kelechi',
      text:"And the people?" },
    { speaker:'SGT. UCHE', portrait:'sergeant',
      text:"Not." },
  ],
});

/* The contract names one gate scene with two versions. Reading DIALOGUE.m12_gate
   returns the version that fits the warrant decision; assigning to it overrides.
   Not enumerable, so loops over DIALOGUE see only the two real keys. */
if(!Object.prototype.hasOwnProperty.call(DIALOGUE, 'm12_gate')){
  let gateOverride = null;
  Object.defineProperty(DIALOGUE, 'm12_gate', {
    configurable:true, enumerable:false,
    get(){
      if(gateOverride) return gateOverride;
      let wentIn = false;
      try{ wentIn = S.game.moralChoices.s2_warrant === 'went_in'; }catch(e){}
      return wentIn ? DIALOGUE.m12_gate_nowarrant : DIALOGUE.m12_gate_warrant;
    },
    set(v){ gateOverride = v; },
  });
}

/* ===================== DOCUMENTS ===================== */
Object.assign(PUZZLES, {

  // 11 · which fork hides the camp (skipped by the code if the camp's creek is already named)
  m11_route: {
    title:'ROUTE · THE ETHIOPE FORKS',
    screen:
`<span class="label">[ UCHE'S CHART · THE ETHIOPE ABOVE SAPELE · 19:05 ]</span>
<span class="label">[ BOAT: 40 HP OUTBOARD · TIMES FROM SAPELE WATERSIDE ]</span>

THE FORKS
─────────────────────────────────────
OGHO CHANNEL  south fork · 25 min · straight dredged cut · dries at low water
EKRE CREEK    middle fork · 40 min · two sharp bends · deep at every tide
OKO WATERS    north fork · 40 min · one long, lazy bend · deep
UGBEYI        fishing village on Ekre's north bank, between Ekre and Oko

WHAT WE HAVE
─────────────────────────────────────
Sapele jetty: the camp boatman buys fuel for forty minutes up, forty back
Wind after dark: steady from the <span class="red">south-west</span>
Tide: high at 23:10 · still falling at 01:00 · low near dawn
Ugbeyi women: "We wash at dawn. By noon the wrappers on the line are grey."
Pa Timi: "Below the second bend, my nets come up black."
`,
    prompt:`Three forks, one camp. Work out <b>which water hides it</b> from the times, the bends, the wind and what people have seen.`,
    options:[
      { text:'Ogho channel', hint:'Twenty-five minutes, not forty — and it dries on a falling tide. Nothing heavier than a canoe uses it after midnight.', correct:false },
      { text:'Ekre creek', hint:'Forty minutes; the only fork with a second bend; and smoke on a south-west wind lands on Ugbeyi, on its north bank.', correct:true },
      { text:'Oko waters', hint:'Forty minutes fits, but Oko has one bend, and it lies north of Ugbeyi: a south-west wind carries its smoke away from the village.', correct:false },
    ],
    onCorrect:{ intel:+16, integrity:+2, agencyFavour:+2, xp:80 },
    onWrong:{ integrity:-1 },
  },

  // 11 · the waybill book under Felix's lamp
  m11_waybills: {
    title:'WAYBILL BOOK · RIVERSTONE MARINE',
    screen:
`<span class="label">[ WAYBILL BOOK · RIVERSTONE MARINE SERVICES LTD ]</span>
<span class="label">[ UNDER FELIX'S LAMP · CARBON COPIES · LEAVES 0388–0466 ]</span>

FOLDED INSIDE THE COVER
─────────────────────────────────────
DELTA BAY DEPOT · NOTICE TO MASTERS AND AGENTS · dated 2 MARCH
<span class="red">JETTY 2 OUT OF SERVICE FROM 3 MARCH · PILING REPAIRS · LOAD AT JETTY 1</span>

THE LEAVES · product AGO · each signed "G.E. for R.M.S."
─────────────────────────────────────
No. 0389 · 24 FEB · Jetty 2 · AGO 180,000 L · TEKENA 2
No. 0397 · 17 MAR · Jetty 2 · AGO 180,000 L · TEKENA 2
No. 0458 · 22 SEP · Jetty 2 · AGO 180,000 L · TEKENA 2
No. 0462 · 29 SEP · Jetty 2 · AGO 180,000 L · TEKENA 2
No. 0466 · date blank · Jetty 2 · AGO 180,000 L · TEKENA 2 · ink still wet
Leaves 0390 to 0396 torn out
Every leaf stamped "LOADED · DELTA BAY DEPOT" · vessel's port of registry WARRI
`,
    prompt:`What makes these waybills <b>false</b> — not just suspicious?`,
    options:[
      { text:'Every leaf is signed by the same man, "G.E."', hint:'One clerk signing his company\'s waybills is normal. Remember the initials, though.', correct:false },
      { text:'They record loadings at Jetty 2 after the depot closed it', hint:'Jetty 2 was out of service from 3 March. Leaves dated after that still say Jetty 2.', correct:true },
      { text:'TEKENA 2 is registered in Warri, not Port Harcourt', hint:'A barge can be registered wherever her owner likes. Her home port proves nothing.', correct:false },
      { text:'Seven leaves have been torn out of the book', hint:'Suspicious, but a missing page proves nothing about the pages that are there.', correct:false },
    ],
    onCorrect:{ intel:+22, integrity:+3, agencyFavour:+4, evidenceId:'waybill_book', evidenceName:'Forged Riverstone waybills', xp:110 },
    onWrong:{ integrity:-1 },
  },

  // 12 · where Tank 3's diesel came from
  m12_log: {
    title:'TANK 3 · THREE RECORDS',
    screen:
`<span class="label">[ RIVERSTONE TANK FARM · TANK 3 · THREE RECORDS, ONE BARGE ]</span>
<span class="label">[ USB FROM THE MANAGER'S GLOVEBOX · ENVELOPE MARKED "INSURANCE" ]</span>

OFFICIAL INTAKE LOG · office copy, signed S. Jumbo
─────────────────────────────────────
17 SEP · TANK 1 · AGO 2,400,000 L · imported · MT CAPE ORIEL · customs C-1184
24 SEP · TANK 3 · AGO 180,000 L · "imported AGO" · vessel: — · customs: —
01 OCT · TANK 3 · AGO 180,000 L · "imported AGO" · vessel: — · customs: —

REAL LOADING LOG · the USB
─────────────────────────────────────
17 SEP 11:20 · T1 in from MT CAPE ORIEL · 2,400,000 L · customs C-1184
24 SEP 04:10 · T3 in from barge TEKENA 2 · 180,000 L · "Ethiope" · cash on discharge
01 OCT 03:55 · T3 in from barge TEKENA 2 · 180,000 L · "Ethiope" · cash on discharge

OTHER PAPER
─────────────────────────────────────
Camp waybills: TEKENA 2 left the Ethiope 22 SEP and 29 SEP · AGO 180,000 L each
Gate register: 25 SEP · T3 out · 5 tankers × 33,000 L · consignee "various"
`,
    prompt:`Where did Tank 3's diesel <b>really</b> come from?`,
    options:[
      { text:'Imported, as the intake log says', hint:'Tank 1\'s import has a vessel and a customs entry. Tank 3\'s "imports" have neither.', correct:false },
      { text:'Delta Bay Depot, as the waybills claim', hint:'Jetty 2 was closed — and the manager\'s own log says "Ethiope", not "depot".', correct:false },
      { text:'TEKENA 2: camp diesel out of the Ethiope creeks', hint:'Every Tank 3 "import" lands two days after TEKENA 2 sails, and the USB log names her.', correct:true },
      { text:'Moved across from Tank 1\'s imported stock', hint:'Tank 1 has its own vessel and customs entry. No line moves product from T1 to T3.', correct:false },
    ],
    onCorrect:{ intel:+24, integrity:+3, agencyFavour:+5, evidenceId:'loading_log', evidenceName:'The real loading log', xp:120 },
    onWrong:{ integrity:-1 },
  },

  // 12 · the bench test
  m12_sample: {
    title:'FIELD TEST · TANK 3 DIESEL',
    screen:
`<span class="label">[ LAB BENCH · RIVERSTONE QC ROOM · 19:20 ]</span>
<span class="label">[ SEALED SAMPLES · TESTED IN FRONT OF COUNSEL ]</span>

TEST            TANK 1 (import)      TANK 3
─────────────────────────────────────
Colour          1.5 · pale straw     8.0+ · black-brown
Density, 15 °C  0.842                0.861
Shake, 30 s     clear in 5 s         tan foam, still standing at 4 min
Settle, 10 min  clean bottom         black grit, 3 mm deep
Flash point     71 °C                49 °C (spec: min 66 °C)
Water test      no crackle           no crackle

BENCH NOTES
─────────────────────────────────────
Colour and flash point fail for many reasons: old stock, a dirty tank, a bad cut.
Refinery diesel loses its foam in seconds and leaves no grit.
Drum-cooked diesel holds the foam and drops the grit.
`,
    prompt:`What does the bench test show about Tank 3?`,
    options:[
      { text:'Imported diesel that has gone off in storage', hint:'Old stock darkens and loses flash point. It doesn\'t hold a foam or grow grit.', correct:false },
      { text:'Diesel cut with water', hint:'No crackle on the hot plate. And water settles clear, not black.', correct:false },
      { text:'Drum-cooked diesel from a creek camp', hint:'It holds a foam for four minutes and drops black grit. No refinery ships that.', correct:true },
      { text:'Kerosene sold as diesel', hint:'Kerosene is lighter and paler. Tank 3 is heavier and blacker than the import.', correct:false },
    ],
    onCorrect:{ intel:+18, integrity:+2, agencyFavour:+3, evidenceId:'tank3_sample', evidenceName:'Tank 3 diesel sample', xp:90 },
    onWrong:{ integrity:-1 },
  },

  // 12 · who owns Riverstone
  m12_cac: {
    title:'WHO OWNS RIVERSTONE?',
    screen:
`<span class="label">[ CAC SEARCH · PRINTOUT · RIVERSTONE MARINE SERVICES LTD · RC 1487203 ]</span>
<span class="label">[ WITH: BANK SALARY RECORD (BVN-LINKED) · FOUNDATION LETTERHEAD ]</span>

THE COMPANY
─────────────────────────────────────
Incorporated 14 AUG 2019 · share capital ₦10,000,000
Shareholder  GODWIN EREBA · 9,500,000 shares · 95%
Shareholder  BLESSING EREBA · 500,000 shares · 5%
Director     GODWIN EREBA · 4B Harbour Close (BQ), Old GRA, Port Harcourt
Secretary    T. Ikiriko &amp; Co., legal practitioners
Bank inflows, 2025: ₦4.1 billion

THE OWNER ON PAPER
─────────────────────────────────────
Salary  ₦180,000 a month · DOUGLAS-AKPAN FOUNDATION · post: DRIVER
No other income · no landed property · one car loan, 2021

THE LETTERHEAD
─────────────────────────────────────
Founder: Sen. Tamuno Douglas-Akpan · 4 Harbour Close, Old GRA, Port Harcourt
`,
    prompt:`The paper says one name. Who <b>really</b> owns Riverstone?`,
    options:[
      { text:'Godwin Ereba, 95% on the CAC record', hint:'On paper. A driver on ₦180,000 a month with no other income doesn\'t own a ₦4 billion tank farm.', correct:false },
      { text:'Blessing Ereba', hint:'Five percent, and the same problem as her husband: no money of her own in this.', correct:false },
      { text:'The Douglas-Akpan Foundation', hint:'The foundation pays the driver\'s wage. It holds no shares. Follow it to the man whose name is on it.', correct:false },
      { text:'Senator Tamuno Douglas-Akpan, through his driver', hint:'His foundation pays the "owner" a driver\'s wage, and the "owner" lives in the boys\' quarters of his house.', correct:true },
    ],
    onCorrect:{ intel:+26, integrity:+3, agencyFavour:+4, evidenceId:'cac_record', evidenceName:'CAC record — Riverstone Marine', xp:130 },
    onWrong:{ integrity:-1 },
  },
});

/* V12 document rules: `proof` substrings occur only on the proof line(s) */
Object.assign(V12.DOCS, {
  m11_route: {
    ask:'Which fork hides the camp? Pick it, then tap the line that <b>settles it</b>.',
    proof:['second bend', 'wrappers'],
    look:['second bend', 'wrappers', 'forty minutes', 'south-west', 'still falling', 'dries at low water', 'two sharp bends', 'lazy bend'],
    fail:{ mode:'continue', note:'You point at the wrong water. Pa Timi says nothing for a long minute, then turns the bow into Ekre himself — but an outboard has already been heard on the wrong creek.', effect:{ heat:+4 } },
  },
  m11_waybills: {
    ask:'What makes these waybills <b>false</b>, not just suspicious? Pick it, then tap the line that proves it.',
    proof:['OUT OF SERVICE', 'No. 0397', 'No. 0458', 'No. 0462'],
    look:['OUT OF SERVICE', 'No. 0389', 'No. 0397', 'date blank', 'torn out', 'WARRI'],
    fail:{ mode:'continue', note:'You bag the book without the reasoning. In court it is just "a book found in a camp" — until somebody explains what Jetty 2 was doing after March.' },
  },
  m12_log: {
    ask:'Where did Tank 3\'s diesel <b>really</b> come from? Pick it, then tap the record that names its source.',
    proof:['barge TEKENA 2'],
    look:['barge TEKENA 2', 'vessel: —', 'customs C-1184', 'left the Ethiope', 'Gate register'],
    fail:{ mode:'continue', note:'The USB goes into a bag with nobody able to say what it proves. The defence will call it "a manager\'s private spreadsheet".' },
  },
  m12_sample: {
    ask:'What does the bench test show? Pick it, then tap the result <b>no refinery could produce</b>.',
    proof:['tan foam', 'black grit'],
    look:['tan foam', 'black grit', 'black-brown', 'spec: min 66', 'no crackle', 'Refinery diesel'],
    fail:{ mode:'continue', note:'You bottle Tank 3 without saying what the bench showed. A defence chemist will call it "off-spec import, poorly stored".' },
  },
  m12_cac: {
    ask:'Who <b>really</b> owns Riverstone? Pick it, then tap the line that gives the nominee away.',
    proof:['₦180,000', 'Harbour Close'],
    look:['₦180,000', 'Harbour Close', '95%', '₦4.1 billion', 'No other income'],
    fail:{ mode:'continue', note:'You file the printout as it reads: a driver owns a tank farm. Barrister Danladi reads it twice. "Then we prove the obvious the long way."' },
  },
});

/* ===================== AFTERMATH ===================== */
/* headline(state): state may be S, S.game or moralChoices; falls back to the global S */
function mcOf(st){
  let g = null;
  if(st && st.game) g = st.game;
  else if(st && (st.moralChoices || st.flags)) g = st;
  else if(!st){ try{ g = S.game; }catch(e){} }
  if(!g) return (st && typeof st === 'object') ? st : {};
  return Object.assign({}, g.flags || {}, g.moralChoices || {});
}

V13.AFTER = Object.assign(V13.AFTER || {}, {
  m11:{
    headline:(state)=>{
      const m = mcOf(state), pub = 'DELTA CHRONICLE';
      const barge = m.s2_barge === 'seized' ? ' A barge, TEKENA 2, was towed to Warri.' : '';
      if(m.s2_camp === 'navy') return { pub, head:'Navy Burns Illegal Refinery on Ethiope Creek After NACECA Raid',
        ded:'Officials hailed the strike. At Ugbeyi landing, fishermen say the creek will carry the oil for a year.' + barge };
      if(m.s2_camp === 'mass') return { pub, head:'Teenagers Among Those Held in Ethiope Refinery Raid',
        ded:'Mothers gathered at the Sapele Area Command by dawn. "Where were you," one asked, "when the oil companies left?"' + barge };
      if(m.s2_camp === 'felix_only') return { pub, head:'NACECA Arrests Creek-Camp Boss, Sends Teenage Workers Home',
        ded:'"They are witnesses, not targets," an officer said. Mothers lined the Ugbeyi landing at first light.' + barge };
      return { pub, head:'NACECA Raids Illegal Refinery in the Ethiope Creeks',
        ded:'Officers reached the camp by canoe after midnight. Fishermen say there are more fires further up.' + barge };
    },
    tip:'Diesel or petrol sold far below the pump price, from jerrycans, drums or unmarked tankers, is often illegally refined. It wrecks engines and generators and its fumes are toxic. Buy from licensed stations and keep the receipt.',
    next:'Next — Port Harcourt, where TEKENA 2\'s camp diesel becomes "imported AGO" on Riverstone Marine\'s paper.',
  },
  m12:{
    headline:(state)=>{
      const m = mcOf(state), pub = 'PORT HARCOURT TIDE';
      const list = m.s2_inventory === 'skipped' ? ' Company lawyers say they were given no list of what was taken.' : '';
      if(m.s2_search === 'self') return { pub, head:'Tank-Farm Manager Says Male NACECA Officer Searched Her',
        ded:'The agency says it is "reviewing the procedure". Her lawyer says he is reviewing the agency.' + list };
      if(m.s2_warrant === 'went_in') return { pub, head:'Riverstone Marine Accuses NACECA of Entering Without a Warrant',
        ded:'The company calls the search "an invasion". NACECA says the diesel in Tank 3 "speaks for itself".' + list };
      const tail = m.s2_sotonye === 'witness' ? ' The tank-farm manager is said to be assisting investigators.'
        : m.s2_sotonye === 'arrested' ? ' The company has described its own manager as "a rogue employee".'
        : m.s2_sotonye === 'pressured' ? ' The manager\'s family says she "has not stopped shaking".' : '';
      return { pub, head:'Magistrate\'s Warrant: NACECA Seals Tank 3 at Riverstone Marine',
        ded:'Officers searched the waterfront tank farm overnight with a signed warrant.' + tail + list };
    },
    tip:'Before you invest in, lend to or sign with a company, run a CAC public search on it. If the 95% owner is a driver or a student on a small income, you are not dealing with the real owner. Ask who is.',
    next:'Next — Abuja. The Director-General will see you at ten o\'clock. He has followed your work with great interest.',
  },
});

/* ===================== HUB PHONE ===================== */
V13.PHONE = Object.assign(V13.PHONE || {}, {
  after_m11:[
    { who:'UCHE', text:"Kerosene, then bar soap, then kerosene again. My hands are still black. Yours?" },
    { who:'HAUWA', cond:"S.game.moralChoices.s2_samples!=='grabbed'",
      text:"Agent Kelechi, Hauwa Danladi, NACECA Legal. Zonal says you're coming to Port Harcourt. Before you touch a single door at Riverstone, call me. Before. Not after." },
    { who:'HAUWA', cond:"S.game.moralChoices.s2_samples==='grabbed'",
      text:"Agent Kelechi, Hauwa Danladi, NACECA Legal. I've seen your camp sample: a water bottle, no label, no seal. I've seen better chains of custody on a Christmas hamper. Call me before you touch a door at Riverstone." },
    { who:'PA TIMI', cond:"S.game.moralChoices.s2_timi==='source' && S.game.moralChoices.s2_camp==='felix_only'",
      text:"This is Ebi, Pa Timi's grandson, typing for him. Grandpa says: 'The boys slept at home. The nets are still black. Both things are true.'" },
    { who:'PA TIMI', cond:"S.game.moralChoices.s2_timi==='source' && S.game.moralChoices.s2_camp==='navy'",
      text:"This is Ebi, typing for Pa Timi. The Navy fire burned for two days. Grandpa says to tell you he is not angry with you. He says he is angry." },
    { who:'PA TIMI', cond:"S.game.moralChoices.s2_timi==='source' && S.game.moralChoices.s2_camp==='mass'",
      text:"This is Ebi, typing for Pa Timi. Three mothers came to our house asking where their sons are. Grandpa gave them your name." },
    { who:'TOBI', cond:"S.game.moralChoices.asaba==='rescue' && S.game.moralChoices.s2_barge==='tagged'",
      text:"Your tracker is ALIVE. TEKENA 2 passed Forcados at 05:40, six knots, heading east. If she holds this course she's in the Bonny River by Thursday." },
    { who:'OSAGIE', cond:"S.game.moralChoices.asaba!=='rescue' && S.game.moralChoices.s2_barge==='tagged'",
      text:"Igbinosa says your tracker is moving east past Forcados. He says he hasn't been this excited since 2009. He did not look excited." },
    { who:'EJIRO', cond:"S.game.moralChoices.s2_ejiro==='source'",
      text:"Oga, Thursday nobody come with sack. Market quiet like Sunday. But two men for black T-shirt dey ask who get T4.",
      textEn:"Sir, nobody came with sacks on Thursday. The market's as quiet as a Sunday. But two men in black T-shirts were asking who owns T4." },
    { who:'MUM', text:"Kelechi, Aunty Ngozi's generator in Warri has packed up. The mechanic says it's roadside diesel, 'black like engine oil'. Is it your people selling it?" },
  ],
  after_m12:[
    { who:'HAUWA', text:"The bank wants a court order before it certifies a single statement. Drafted. While you're in Abuja I'll be at the Federal High Court registry, which is the closest I get to a holiday." },
    { who:'HAUWA', cond:"S.game.moralChoices.s2_sotonye==='witness'",
      text:"Sotonye Jumbo is in a guest house in Rumuola with her daughter and a corporal. She has labelled everything in the room. Including the corporal." },
    { who:'IBINABO', cond:"S.game.moralChoices.s2_ibinabo==='source'",
      text:"Chairman Ibinabo. The levy boys came this morning and took three thousand from Ebiere's son. I am counting, Officer. Thirteen days left." },
    { who:'IBINABO', cond:"S.game.moralChoices.s2_ibinabo==='cold'",
      text:"Don't come to my shed again without paper. My drivers have been shown your face." },
    { who:'UCHE', text:"Kuti's office called me. They wanted your shirt size. I said I didn't know." },
    { who:'OSAGIE', text:"Kuti called me too, to tell me I'm not invited. With that man, ten o'clock means half past nine. Whatever he offers you, Kelechi, he's offering it because he's afraid." },
    { who:'MUM', text:"Abuja?! Wear the blue shirt, not the one whose collar is tired. Your uncle in Gwarinpa says the lifts in that building are always 'under maintenance'. Take the stairs and pray." },
  ],
});

/* ===================== SOURCE TIPS ===================== */
/* NETS = Pa Timi (through his grandson). TIDE = Chairman Ibinabo.
   `true:false` tips are the planted ones, for after the source is exposed. */
V13.TIPS = V13.TIPS || {};
function addTips(src, list){
  const arr = V13.TIPS[src] = Array.isArray(V13.TIPS[src]) ? V13.TIPS[src] : [];
  for(const t of list) if(!arr.some(x => x && x.text === t.text)) arr.push(t);
}
addTips('NETS', [
  { after:'m11', true:true,  text:"The barge passed Koko at first light, low in the water. She took the sea road east. Not Warri." },
  { after:'m11', true:false, text:"The barge turned back up the creek before dawn. She is hiding by the old dredge in Ogho channel." },
  { after:'m12', true:true,  text:"Men in a speedboat came to the landing asking which fisherman brought NACECA. Not creek men. They had Abuja in their mouths." },
  { after:'m12', true:false, text:"The Riverstone people have gone quiet. The barge men say the big men have left the creek business for good." },
  { after:'m13', true:true,  text:"The barge men drink at Koko on Saturdays. They say the Senator's driver pays them himself now, in cash, from a black jeep." },
  { after:'m13', true:false, text:"The barge men say the money goes to Lagos now. A man in Ikoyi counts it." },
  { after:'m13b', true:true, text:"Two boys from Felix's camp were given money to say NACECA beat them. Tari refused. He says he will tell the court the truth if you need him." },
  { after:'m13b', true:false, text:"Tari says Felix paid the men at the creek checkpoint every month, and he will swear to it. Put him in front of the judge." },
  { after:'m14', true:true,  text:"TEKENA 2 went down to the sea riding high, her tanks empty. But four men carried bags into the back cabin. Heavy bags. They held them like babies." },
  { after:'m14', true:false, text:"TEKENA 2 has gone to Escravos for repairs. She will not move for a month." },
]);
addTips('TIDE', [
  { after:'m12', true:true,  text:"The Senator's driver, Godwin, flies to Abuja on the second Thursday of every month and comes back on Saturday. My cousin sells him meat pie at the airport." },
  { after:'m12', true:false, text:"Godwin goes to Lagos every month, to the Senator's house in Ikoyi. Never Abuja." },
  { after:'m13', true:true,  text:"Godwin has booked the Thursday flight again. Business class, for a driver. He told my cousin he is carrying 'the Chairman's bag'. There is only one chairman on this waterfront, Officer, and it is not him." },
  { after:'m13', true:false, text:"Godwin has been sacked. A new driver does the Abuja runs now, and nobody knows his name." },
  { after:'m13b', true:true, text:"Two of the Senator's boys are asking on the waterfront where the Jumbo woman sleeps. Move her, Officer." },
  { after:'m13b', true:false, text:"The Jumbo woman's people say she has run to Ghana. Don't waste your boats looking." },
  { after:'m14', true:true,  text:"Thursday night. The Big Man's boat comes from Bonny with no lights: two flying boats, six boys with guns. They use Riverstone's old jetty, not the new one. My boats can carry your people in by water." },
  { after:'m14', true:false, text:"They have moved everything to Onne. Riverstone's jetty will be empty this week." },
]);

})();
