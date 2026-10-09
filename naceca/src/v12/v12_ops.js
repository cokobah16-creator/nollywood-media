/* =========================================================================
   NACECA · v12 operations table — the checkerboard returns as the detective brain
   Suspects, evidence, money and places sit on a grid, one board per case
   (LAGOS · THE ROUTE · THE VOICE). Pencilling links is free scratch work.
   FILE sends the pencilled links to the magistrate, who judges each one on
   its own: a link that holds is inked; a wrong one is struck off — a strike
   on that case and Integrity −2. Three strikes and the case's warrant is
   refused until new evidence turns up. Some cards on the table have nothing
   to do with the ring, and two key leads per case only appear after real
   fieldwork (a clean scan, a witness who talks).
   Senior Agent hides the answer-shaped help (role tags, open theory
   questions, Uche's nudges, analysts' notes); Recruit keeps it.
   Inked chains become theories, and theories change cases: the Lekki
   briefing, the warrant, Tobi's smoke clock, the finale.
   Once the Voice is on the table, a sealed accusation can go to Zonal.
   ========================================================================= */
(function(){
'use strict';
const V12 = window.V12;
const ev = id => () => V12.hasEv(id);
const mis = m => () => V12.started(m);
const any = (...fs) => () => fs.some(f => f());
const FL = () => (S.game && S.game.flags) || {};
const MC = () => (S.game && S.game.moralChoices) || {};
const ic = (n, c) => (typeof icon === 'function' ? icon(n, c) : '');
const esc = s => (V12.esc ? V12.esc(s) : String(s));
// Recruit keeps the deduction hints; Senior Agent (the default) hides them
const recruit = () => {
  try{ if(typeof isRecruit === 'function') return !!isRecruit(); }catch(e){}
  return !!(S && S.game && S.game.difficulty === 'recruit');
};
V12.opsRecruit = recruit;
const clean = id => V12.hasEv(id) && V12.evQ(id) !== 'weak';                 // contested evidence never opens a lock
const docSeen = k => !!(S.game.docSeen && S.game.docSeen[k]);
const docClean = k => !!(S.game.docClean && S.game.docClean[k]);
const sideDone = (mid, qid) => !!(S.game.sideBest && S.game.sideBest[mid] && S.game.sideBest[mid][qid]);
const street = id => { try{ return typeof V12.street === 'function' ? V12.street(id) : null; }catch(e){ return null; } };
const kcFairNow = () => MC().market_runner === 'caught' && ['detain', 'flip'].includes(MC().choice);

/* ---------- the nodes ----------
   dossier: neutral facts (always shown; a string, or a function of what you've seen)
   note:    the analyst's conclusion (Recruit only)
   lock:    fieldwork that must be done before the card is on the table
   herring: not part of the ring — no true links (logic only, never shown) */
const N = [
  // LAGOS
  { id:'s_obi',     kind:'suspect',  g:['lagos','voice'], tag:'PRINCIPAL', name:'"Chief" Obi', meta:'Lekki mansion · titled chief',
    dossier:'Chief E. Obi, titled Akaeze of Umuoji. Lives in a mansion in Lekki, Old GRA.',
    note:'He runs the Lagos end of the ring. Follow the wallet: it was registered to a Lekki address.' },
  { id:'s_kc',      kind:'suspect',  g:['lagos'], tag:'COURIER', name:'KC (teen)', meta:'Ikeja market · data cards', req:mis('m1'),
    dossier:'Sells data cards at the Ikeja market. Tunde says he moves SIMs for a syndicate.',
    note:'The phone on his counter is where today\'s case starts. Whose SIMs is he carrying?' },
  { id:'s_mama',    kind:'suspect',  g:['lagos','route'], tag:'GHOST', name:'"Mama Florence"', meta:'dead pensioner · SIMs in her name',
    dossier:'Florence Adeyemi, a pensioner who died in 2019. SIMs are still being registered in her name. Case file: three of them pinged towers within 800 m of the Lekki mansion.',
    note:'A dead woman can\'t buy SIMs. Somebody is using her name, and her SIMs sleep in Lekki.' },
  { id:'s_madam',   kind:'suspect',  g:['lagos','voice'], tag:'UNKNOWN', name:'"Madam"', meta:'named in the courier\'s draft',
    req:()=>!!FL().v12_madam || V12.inked('e_notebook','e_madam'),
    dossier:'Nobody has met Madam. The courier\'s unsent draft was for Madam: "Tell Madam it\'s clean."',
    note:'Obi pays "C.A." every Friday, and the night things were "clean", Madam was the one told. Same person?' },
  { id:'e_phish',   kind:'evidence', g:['lagos'], tag:'CYBER', name:'Phishing Template', meta:'bank spoof · fake login page', req:mis('m2'),
    lock:{ kind:'scan', what:'a clean scan of the phone on KC\'s counter', test:()=>docClean('market_phone_scan') || clean('phishing_template') },
    dossier:'From the phone on KC\'s counter: a Crestline Bank spoof text, a copy of the bank\'s login page in the gallery, and a list of 200+ numbers to text.',
    note:'Staged from KC\'s phone. Whose SIMs did the texts go out on?' },
  { id:'e_kcsims',  kind:'evidence', g:['lagos'], tag:'SIM BATCH', name:'KC\'s SIM Batch', meta:'50 SIMs · one registrant', req:mis('m2'),
    lock:{ kind:'witness', what:'KC\'s statement after a fair arrest, or a SCAN sweep for the SIM sleeves',
      test:()=>!!FL().kc_statement || !!FL().kc_sweep || sideDone('m2', 'm2_sims') || (V12.hasEv('kc_sims') && kcFairNow()) },
    dossier:()=>'Fifty SIMs from one batch. Every one is registered to the same name: Florence Adeyemi, deceased.'
      + (FL().kc_statement ? ' KC, in his statement: the batch was his to sell.' : '')
      + (FL().kc_sweep || sideDone('m2', 'm2_sims') ? ' Torn sleeves from the batch behind the stalls, and an empty 50-SIM dealer tray.' : ''),
    note:'KC\'s batch, in a dead pensioner\'s name.' },
  { id:'e_madam',   kind:'evidence', g:['lagos','voice'], tag:'PHONE', name:'"Tell Madam it\'s clean"', meta:'dropped in Mushin', req:ev('co_madam'),
    dossier:'A cracked phone in a puddle where the okada stood in Mushin, the night before day one. One unsent draft, saved Mon 05 Oct at 23:14: "Tell Madam it\'s clean."',
    note:'Who was told it was clean, and what else was ticked off that night?' },
  { id:'e_laptop',  kind:'evidence', g:['lagos'], tag:'DEVICE', name:'Obi\'s Laptop', meta:'imaged after the wipe', req:ev('laptop'),
    dossier:'Seized in the study at Lekki and imaged by NACECA forensics: ledger files, a wallet seed, a SIM batch database.',
    note:'Obi\'s own laptop. A wallet seed is the key to a crypto wallet.' },
  { id:'e_notebook',kind:'evidence', g:['lagos'], tag:'PAPER', name:'Obi\'s Notebook', meta:'initials and amounts', req:ev('obi_notebook'),
    dossier:'Spiral notebook seized at Lekki, in Obi\'s hand. Every Friday the same entry: "C.A. — 2,500,000". One more on Monday 05 Oct, ticked. Also "POS ×3" and "ENGR".',
    note:'The last C.A. entry is the night of the Mushin drop.' },
  { id:'e_wallet',  kind:'money',    g:['lagos'], tag:'CRYPTO', name:'Wallet 0xE7…91A', meta:'0.62 BTC out',
    dossier:'Emptied 0.62 BTC into three OTC desks the night before the Ikeja POS cash-out spike. Registered to a Lekki address.',
    note:'Who in Lekki holds this wallet? And where did the BTC come out as cash?' },
  { id:'m_pos',     kind:'money',    g:['lagos'], tag:'POS', name:'Ikeja POS Cash-outs', meta:'₦5M+ a day · three agents',
    dossier:'Three POS agents in Ikeja cashed out more than ₦5M a day, in windows that line up with two ransom payouts.',
    note:'The cash-outs came the day after the wallet emptied.' },
  { id:'e_cash',    kind:'money',    g:['lagos'], tag:'CASH', name:'₦12.4M in Bundles', meta:'Obi\'s coffee table', req:ev('cash'),
    dossier:'₦1,000 bundles and US dollars, bank bands torn off. Counted on the coffee table at the Lekki mansion.',
    note:'Cash at Obi\'s house, on Obi\'s table.' },
  { id:'l_mushin',  kind:'place',    g:['lagos'], tag:'NODE', name:'Mushin Compound', meta:'the white van · the girl', req:mis('m0'),
    dossier:'The night before day one: a compound with a white minivan, a masked man and a girl of about eight. An okada waited on the road for the courier.',
    note:'Where the courier dropped his phone.' },
  { id:'l_market',  kind:'place',    g:['lagos'], tag:'NODE', name:'Ikeja Market', meta:'Computer Village · SIM sellers', req:mis('m1'),
    dossier:'Computer Village spills into this market. Data cards, SIM sellers, POS stands.',
    note:'KC works here, and so do three busy POS agents.' },
  { id:'l_lekki',   kind:'place',    g:['lagos'], tag:'NODE', name:'Lekki Mansion', meta:'Obi\'s house',
    dossier:'Obi\'s house in Old GRA. Lit up most nights, with a generator house at the side.',
    note:'Whose SIMs ping the towers around this house?' },
  // LAGOS · leads that go nowhere
  { id:'s_tunde',   kind:'suspect',  g:['lagos'], tag:'INFORMANT', name:'Tunde', meta:'Ikeja market · informant', herring:true, facts:['l_market'],
    req:()=>!!S.game._marketTunde || V12.hasEv('phishing_template') || V12.started('m3'),
    dossier:'Your informant at the Ikeja market. He pointed out the boy and the phone on his counter, and knew the boy moves SIMs for a syndicate. He asked not to be named.',
    note:'He came to you. Does any SIM, wallet or cash-out on this table carry his name?' },
  { id:'e_bvn',     kind:'evidence', g:['lagos'], tag:'SMS', name:'"Re-validate BVN"', meta:'UNKNOWN-BANK · inbox', herring:true, facts:['s_kc','l_market'],
    req:()=>docSeen('market_phone_scan') || V12.hasEv('phishing_template'),
    dossier:'From the scan of the phone on KC\'s counter. In the inbox, from "UNKNOWN-BANK": "ATTN: Re-validate BVN. Reply with full DOB+PIN. Urgent." No link, no page behind it.',
    note:'Reply-with-your-PIN, no link, no cloned page behind it. Is that the template you were briefed on?' },
  { id:'m_coop',    kind:'money',    g:['lagos'], tag:'COOPERATIVE', name:'Grace Divine Cooperative', meta:'Allen Avenue · 30% a month', herring:true, facts:['l_market'],
    req:()=>!!street('ponzi') || (S.game.completedMissions || []).includes('m2'),   // the flyers are all over the market
    dossier:()=>'Flyers at the Ikeja market: put in ₦20,000, collect ₦26,000 in four weeks. "Poultry, crypto, importation." Everyone who joined first has been paid.'
      + (street('ponzi') === 'warned' ? ' Paid, Sister Ngozi admits, out of the new members\' contributions.' : '')
      + (street('ponzi') === 'flagged' ? ' Office on Allen Avenue, second floor. The fraud desk has the flyer.' : ''),
    note:'Thirty percent a month, paid from the next person\'s deposit. The ring\'s money, or somebody else\'s fraud?' },
  { id:'s_ada',     kind:'suspect',  g:['lagos'], tag:'NAME ON A PEN', name:'Ada', meta:'gold pen · Obi\'s study', herring:true, facts:['s_obi','l_lekki'],
    req:()=>docSeen('mansion_safe') || V12.hasEv('safe_drives') || docSeen('night_click') || V12.started('m4'),
    dossier:'A gold pen in Obi\'s study, engraved "To Ada, 22·03·86". On his calendar, his wife\'s birthday is circled: 22 March.',
    note:'Obi\'s books pay initials, not first names. Does any entry fit hers?' },
  // THE ROUTE
  { id:'s_musa',    kind:'suspect',  g:['route'], tag:'TRANSPORTER', name:'Musa', meta:'cattle lorry driver', req:mis('m4'),
    dossier:()=>'Drives a cattle lorry, Kano to Sapele. Licence first issued 11 March 2026; three logbook entries.'
      + (docSeen('checkpoint_lie') ? ' The lorry is registered to Sapele Haulage Nig. Ltd.' : ''),
    note:'He drives for someone else. Who loads his lorry, and what rode in it?' },
  { id:'s_engineer',kind:'suspect',  g:['route','voice'], tag:'PICKUP', name:'"The Engineer"', meta:'known by a title', req:any(mis('m4'), ()=>FL().co_heard === 'engineer'),
    lock:{ kind:'witness', what:'a witness at the checkpoint',
      test:()=>(!!FL().musa_tip && V12.evQ('musa_statement') !== 'weak') || MC().checkpoint === 'flip_driver' || FL().co_heard === 'engineer' },
    dossier:()=>{
      const f = FL(), t = ['Known only as "the Engineer".'];
      if(f.co_heard === 'engineer') t.push('In Mushin, someone said: "Engineer changed it."');
      if(f.musa_tip || MC().checkpoint === 'flip_driver') t.push('Musa: he loads the back of the lorries and waits at the filling station before Ugbowo junction.');
      return t.join(' ');
    },
    note:'He loads Musa\'s lorry. His pickup is by Ugbowo.' },
  { id:'s_ifeanyi', kind:'suspect',  g:['route'], tag:'FIXER', name:'Ifeanyi', meta:'books routes · moves cash', req:mis('m6'),
    dossier:'The cartel\'s fixer, by Uche\'s briefing. Books the routes, moves the cash, never touches a phone you can trace.',
    note:'He ran the Asaba warehouse. What did his crew leave in it?' },
  { id:'e_ledger',  kind:'evidence', g:['route'], tag:'PAPER', name:'Ransom Route Ledger', meta:'from the false panel', req:ev('ransom_ledger'),
    dossier:'Names, drop points and dates in a hand-written ledger, from the welded compartment in Musa\'s lorry. The next drop after the Bypass: a forest shrine at Ozalla.',
    note:'It rode in Musa\'s lorry, and it points to the shrine.' },
  { id:'e_weld',    kind:'evidence', g:['route'], tag:'RECEIPT', name:'Welder\'s Receipt', meta:'Sapele Haulage · chassis rail', req:mis('m4'),
    lock:{ kind:'scan', what:'a SCAN sweep around the lorry', test:()=>!!FL().weld_receipt || sideDone('m4', 'm4_weld') },
    dossier:'Logged beside the lorry on the Bypass: fresh welds on the chassis rail, and a welder\'s receipt made out to Sapele Haulage Nig. Ltd.',
    note:'Somebody paid to build that compartment. Whose lorry is it on paper?' },
  { id:'e_shrine',  kind:'evidence', g:['route'], tag:'PAPER', name:'Forest Route Ledger', meta:'from the shrine cache', req:ev('e_shrine_ledger'),
    dossier:'Ledger from the padlocked cache behind the Ozalla shrine. The next leg: a commercial warehouse in Asaba.',
    note:'Shrine to Asaba.' },
  { id:'e_asims',   kind:'evidence', g:['route'], tag:'SIM BATCH', name:'24 Pre-activated SIMs', meta:'the Asaba crate', req:ev('asaba_sims'),
    dossier:'Twenty-four pre-activated SIMs from one batch, in a crate at the Asaba warehouse. Every one registered to a pensioner who died in 2019: Florence Adeyemi.',
    note:'The same name as KC\'s batch in Lagos.' },
  { id:'l_bypass',  kind:'place',    g:['route'], tag:'NODE', name:'Benin Bypass', meta:'Anti-Kidnapping Squad checkpoint', req:mis('m4'),
    dossier:'Where the Anti-Kidnapping Squad stopped the cattle lorry.',
    note:'The ledger was pulled here.' },
  { id:'l_shrine',  kind:'place',    g:['route'], tag:'NODE', name:'Ozalla Shrine', meta:'forest transfer point', req:mis('m5'),
    dossier:'A shrine at Ozalla used as fear-cover. Jerry-cans of cash behind it.',
    note:'The Bypass ledger named this place.' },
  { id:'l_asaba',   kind:'place',    g:['route'], tag:'NODE', name:'Asaba Warehouse', meta:'the disappeared', req:mis('m6'),
    dossier:'A warehouse in Asaba, where they held Tobi Onuoha, the accountant who asked about a transfer.',
    note:'The forest ledger\'s next leg.' },
  // THE ROUTE · leads that go nowhere
  { id:'s_rabiu',   kind:'suspect',  g:['route'], tag:'CONSIGNOR', name:'Alh. Rabiu Mukhtar', meta:'Kano · on the waybill', herring:true, facts:['s_musa','l_abattoir'],
    req:()=>docSeen('checkpoint_manifest') || docSeen('checkpoint_lie') || V12.hasEv('broken_seal') || V12.started('m5'),
    dossier:'Named on waybill KN-2026-04481 as consignor: 42 head of White Fulani, Kano to Sapele. Musa says the cattle belong to "one Alhaji for Kano".',
    note:'The cattle check out: 42 head. The extra 2,420 kg didn\'t. Whose lorry was it hidden in?' },
  { id:'l_abattoir',kind:'place',    g:['route'], tag:'CONSIGNEE', name:'Delta Riverside Abattoir', meta:'Sapele · on the waybill', herring:true, facts:['s_rabiu','s_musa'],
    req:()=>docSeen('checkpoint_manifest') || docSeen('checkpoint_lie') || V12.hasEv('broken_seal') || V12.started('m5'),
    dossier:'Named on the waybill as consignee: Delta Riverside Abattoir Ltd. The route on the papers ends at Sapele.',
    note:'That\'s where the cattle were going. Where did the ledger say the next drop was?' },
  { id:'s_levy',    kind:'suspect',  g:['route'], tag:'LEVY', name:'The "Levy" Boy', meta:'Bypass queue · ₦5,000 a truck', herring:true, facts:['l_bypass'],
    req:()=>!!street('levy'),
    dossier:'Works the truck queue on the Bypass, collecting ₦5,000 from every truck as a "union levy". No receipt. His card reads "Edo Transport Revenue Agent"; the hologram is a sticker and the number is a mobile line.',
    note:'Every truck in the queue paid him. The cartel\'s toll, or a separate hustle?' },
  { id:'s_paeze',   kind:'suspect',  g:['route'], tag:'CUSTODIAN', name:'Pa Eze', meta:'Ozalla shrine · forty years', herring:true, facts:['l_shrine'], req:mis('m5'),
    dossier:()=>'Custodian of the Ozalla shrine for forty years. Uche, before you went in: "We don\'t know if he\'s a partner or a hostage to the situation."'
      + (MC().shrine === 'negotiate' ? ' He told you himself: men come at night with drums and jerry-cans, and he has known for two seasons that what they bring is not respect.' : ''),
    note:'He tends the ground. Who brought the jerry-cans, and in what cars?' },
  // THE VOICE
  { id:'s_voice',   kind:'suspect',  g:['voice'], tag:'NEGOTIATOR', name:'"The Voice"', meta:'ransom caller · no name', req:mis('m7'),
    dossier:'Calls Mrs. Ehigie every evening at seven. Every call pinged the Ugbowo cell. Always the same words: "Nobody needs to be a hero."',
    note:'Find the handset, and you find the Voice.' },
  { id:'e_cdr',     kind:'evidence', g:['voice'], tag:'TELECOM', name:'Ugbowo Call Records', meta:'IMEI 35-***-88', req:mis('m7'),
    lock:{ kind:'scan', what:'a clean call trace from the tower cabinet', test:()=>docClean('tower_call_trace') || clean('tower_cdr') },
    dossier:'Sector timing and handover from the Ugbowo cabinet: IMEI 35-***-88 hands over to the Ekosodin micro-cell. It dialled one Lekki number twice.',
    note:'The handset sleeps in Ekosodin. Whose Lekki number did it call?' },
  { id:'e_efe',     kind:'evidence', g:['voice'], tag:'STATEMENT', name:'Efe\'s Statement', meta:'UNIBEN student · 10% cut', req:mis('m7'),
    lock:{ kind:'witness', what:'a witness at the UNIBEN gate', test:()=>V12.hasEv('efe_statement') },
    dossier:()=>'A UNIBEN student. Data entry for a payroll company: money comes into his account, he passes it to the "staff" on their list and keeps ten percent. Osas Ehigie got him the job, and said one of the payrolls had a name on it that "should not be there".'
      + (V12.started('t7') ? ' Later, from Osas\'s notes in his bag: one payroll line reads "C.A. — LAGOS — MONTHLY".' : ''),
    note:'Students paid to move "payroll" money: the payroll Osas copied. Whose initials head it?' },
  { id:'e_drive',   kind:'evidence', g:['voice'], tag:'DRIVE', name:'Osas\'s Flash Drive', meta:'payroll copies', req:ev('fin_drive'),
    dossier:'Payroll copies Osas hid in his shoe: a fixer, a chief, the Engineer, and the same initials at the top of every page: "C.A."',
    note:'"C.A." again: the name Obi paid every Friday.' },
  { id:'e_courier', kind:'evidence', g:['voice'], tag:'PHONE', name:'Courier\'s Phone', meta:'one saved number', req:ev('fin_courier_phone'),
    dossier:'The woman in the burgundy jacket carried one saved number. No name, just a letter: "C".',
    note:'She relays the calls. "C" is who she reports to.' },
  { id:'l_ugbowo',  kind:'place',    g:['voice'], tag:'NODE', name:'Ugbowo Tower', meta:'sabotaged mast', req:mis('m7'),
    dossier:'The mast behind the UNIBEN gate. Fibre cut with a cutlass, diesel drained.',
    note:'Every call pinged this cell.' },
  { id:'l_ekosodin',kind:'place',    g:['voice'], tag:'NODE', name:'Ekosodin', meta:'north of the UNIBEN fence', req:any(ev('tower_cdr'), mis('m8')),
    dossier:'Student lodges, kiosks and compounds behind blue gates, north of the UNIBEN fence.',
    note:'Where the handset hands over.' },
  // THE VOICE · leads that go nowhere
  { id:'s_osaro',   kind:'suspect',  g:['voice'], tag:'SITE ENGINEER', name:'Engr. Osaro', meta:'Ugbowo mast · the cabinet', herring:true, facts:['l_ugbowo','e_cdr'],
    req:()=>!!S.game._towerEngineer || docSeen('tower_call_trace') || V12.started('t7'),
    dossier:'Site engineer at the Ugbowo mast. Sat with the dead site for two nights after the fibre was cut, "clean, like they do it for a living". Runs the BTS cabinet the trace came from.',
    note:'An engineer, but which one? Where was he while the handset was handing over in the north?' },
  { id:'l_hall3',   kind:'place',    g:['voice'], tag:'HOSTEL', name:'UNIBEN Hall 3', meta:'south-east of the mast', herring:true, facts:['e_cdr','l_ugbowo'],
    req:()=>docSeen('tower_call_trace') || V12.hasEv('tower_cdr'),
    dossier:'Hostel block south-east of the mast. On the trace, Sector B faces it: TA 2, about 1.1 km, signal weak.',
    note:'Which sector read strong, and where did the handset hand over?' },
  { id:'l_isihor',  kind:'place',    g:['voice'], tag:'MARKET', name:'Isihor Junction', meta:'west · the Lagos road', herring:true, facts:['e_cdr','l_ugbowo'],
    req:()=>docSeen('tower_call_trace') || V12.hasEv('tower_cdr'),
    dossier:'Market at Isihor junction, west of the mast on the Lagos road. On the trace, Sector C faces it: TA 14, about 7.7 km.',
    note:'What did Sector C actually see?' },
];
const NODE = Object.fromEntries(N.map(n => [n.id, n]));
const KIND_LABEL = { suspect:'PERSON', evidence:'EVIDENCE', money:'MONEY', place:'PLACE' };

/* ---------- the true links ---------- */
const L = [
  ['s_kc','l_market',8,'KC works the Ikeja market'],
  ['s_kc','e_phish',12,'KC\'s phone was staging the template'],
  ['s_mama','e_phish',10,'the phishing texts went out on her SIMs'],
  ['e_kcsims','s_kc',10,'the batch was KC\'s'],
  ['e_kcsims','s_mama',12,'every SIM in the batch is in her name'],
  ['s_mama','l_lekki',14,'her SIMs sleep in the Lekki mansion'],
  ['s_obi','l_lekki',8,'Obi\'s house'],
  ['s_obi','e_wallet',14,'the wallet is Obi\'s',1],
  ['e_wallet','m_pos',12,'BTC out the night before the POS cash-outs',1],
  ['m_pos','l_market',10,'the cash-outs ran through Ikeja agents',1],
  ['s_obi','e_laptop',12,'Obi\'s own laptop'],
  ['e_cash','l_lekki',8,'seized at the mansion',1],
  ['e_laptop','l_lekki',4,'seized in the study at Lekki'],
  ['e_notebook','l_lekki',4,'seized at Lekki'],
  ['e_notebook','m_pos',8,'"POS ×3" in the notebook: Obi pays the cash-outs',1],
  ['e_wallet','l_lekki',6,'the wallet is registered to a Lekki address',1],
  ['e_cash','s_obi',8,'Obi\'s cash',1],
  ['e_madam','l_mushin',6,'dropped in Mushin'],
  ['e_notebook','s_obi',8,'Obi\'s own handwriting'],
  ['e_notebook','e_madam',16,'the Monday entry ticked in the notebook is the night of "Tell Madam it\'s clean"'],
  ['s_madam','e_notebook',10,'"C.A." is paid every Friday'],
  ['s_madam','e_madam',10,'the message was for Madam'],
  ['s_musa','l_bypass',8,'stopped on the Bypass'],
  ['s_musa','e_ledger',14,'the ledger rode in his lorry'],
  ['e_ledger','l_bypass',6,'pulled at the checkpoint'],
  ['s_musa','s_engineer',12,'the Engineer loads Musa\'s lorry'],
  ['e_weld','s_musa',12,'the lorry Musa drives belongs to Sapele Haulage, the firm that paid for the welds'],
  ['e_weld','e_ledger',10,'the ledger rode in the compartment Sapele Haulage paid to weld'],
  ['e_weld','l_bypass',6,'logged at the checkpoint'],
  ['e_ledger','l_shrine',12,'the ledger\'s next drop is the shrine'],
  ['e_shrine','l_shrine',6,'pulled from the shrine cache'],
  ['e_shrine','l_asaba',12,'the forest ledger points to Asaba'],
  ['s_ifeanyi','l_asaba',10,'Ifeanyi ran the warehouse'],
  ['s_ifeanyi','e_asims',10,'his crate'],
  ['e_asims','s_mama',12,'the same dead pensioner again'],
  ['e_asims','l_asaba',6,'in a crate at the Asaba warehouse'],
  ['s_voice','l_ugbowo',10,'every call pinged the Ugbowo cell'],
  ['s_voice','e_cdr',16,'the negotiator\'s handset is in the records'],
  ['e_cdr','l_ugbowo',6,'pulled from the tower cabinet'],
  ['e_cdr','l_ekosodin',12,'the handset hands over to Ekosodin'],
  ['e_cdr','s_obi',12,'the handset dialled Obi\'s number twice'],
  ['s_engineer','l_ugbowo',10,'his pickup is by the Ugbowo junction'],
  ['e_madam','s_voice',14,'the Madam in Mushin is the Voice on the calls'],
  ['s_madam','s_voice',18,'Madam and the Voice are one person'],
  ['e_drive','s_madam',16,'"C.A." at the top of every payroll page'],
  ['e_efe','e_drive',12,'the payroll Efe moved money for is the one Osas copied'],
  ['e_efe','s_madam',14,'Osas\'s note, through Efe: "C.A. — LAGOS — MONTHLY"'],
  ['e_courier','s_voice',14,'her one saved number: "C"'],
  ['s_voice','l_ekosodin',10,'the Voice calls from Ekosodin'],
].map(([a,b,intel,hint,money]) => ({ a, b, intel, hint, money:!!money }));
const key = (a, b) => a < b ? a + '|' + b : b + '|' + a;
const LINK = Object.fromEntries(L.map(l => [key(l.a, l.b), l]));
// a herring's own facts (Tunde works the market, Ada is Obi's wife) are true but say nothing
// about the crime: filing one is set aside, with no strike. Linking a herring into the crime costs one.
const FACT = new Set(N.filter(n => n.herring && n.facts).flatMap(n => n.facts.map(f => key(n.id, f))));
V12.OPS_NODES = N; V12.OPS_LINKS = L;

/* ---------- theories: inked chains that change cases ---------- */
const T = [
  { id:'t_sims',  q:'Where do KC\'s SIMs lead?',        name:'KC\'s SIMs reach the mansion', links:[['e_kcsims','s_kc'],['e_kcsims','s_mama'],['s_mama','l_lekki']],
    effect:'Uche will know the suspect count at Lekki, and where the laptop is.' },
  { id:'t_money', q:'Whose money moves through Ikeja?',  name:'The ransom money runs through Obi', links:[['s_obi','e_wallet'],['e_wallet','m_pos'],['m_pos','l_market']], weight:25,
    effect:'The money trail carries your warrant application.', on:()=>{ S.game.intelScore = (S.game.intelScore || 0) + 15; } },
  { id:'t_madam', q:'Who was told it was "clean"?',     name:'Madam is paid out of Obi\'s ring', links:[['e_notebook','e_madam'],['s_madam','e_notebook'],['s_madam','e_madam']],
    effect:'"Madam" is a person, and Obi pays Madam every Friday.' },
  { id:'t_route', q:'Where does the ledger lead?',      name:'One route: Bypass → Shrine → Asaba', links:[['s_musa','e_ledger'],['e_ledger','l_shrine'],['e_shrine','l_asaba']],
    effect:'At Asaba you\'ll know which office Tobi is in: 8 more seconds on the smoke clock.' },
  { id:'t_voice', q:'Who is Madam to the Voice?',       name:'Madam is the Voice', links:[['e_madam','s_voice'],['s_madam','s_voice'],['s_voice','e_cdr']],
    effect:'The "Tell Madam" phone becomes evidence against the Voice.' },
];
V12.OPS_THEORIES = T;

/* ---------- cases ---------- */
const CASES = ['lagos', 'route', 'voice'];
const CASE_NAME = { lagos:'LAGOS', route:'THE ROUTE', voice:'THE VOICE' };
const CASE_OF = { m0:'lagos', m1:'lagos', m2:'lagos', m3:'lagos', m3n:'lagos', h2:'lagos',
  m4:'route', h4:'route', m5:'route', h5:'route', m6:'route', h6:'route',
  m7:'voice', h7:'voice', t7:'voice', m8:'voice' };
const SIGN_AT = 60, STRIKE_COST = 12, MAX_STRIKES = 3, INTEGRITY_COST = 2;
// past three the warrant is already refused: say so rather than print "4/3"
const strikeOf = n => n <= MAX_STRIKES ? `${n}/${MAX_STRIKES}` : `${n} (warrant refused)`;
const blankCase = () => ({ strikes:0, pen:0, forgiven:false, refused:null, lifted:0 });
V12.CASE_NAME = CASE_NAME;

/* ---------- state ---------- */
V12.ops = ()=>{
  if(!S.game.ops || typeof S.game.ops !== 'object'){
    S.game.ops = { pencils:[], inked:[], theories:{}, tries:0, sinceInk:0, group:null };
    // links confirmed on the old cork board carry over as ink
    for(const l of (S.game._ebLinks || [])){ if(l && l.correct){ const k = key(l.a, l.b); if(LINK[k] && !S.game.ops.inked.includes(k)) S.game.ops.inked.push(k); } }
  }
  const o = S.game.ops;
  if(!Array.isArray(o.pencils)) o.pencils = [];
  if(!Array.isArray(o.inked)) o.inked = [];
  if(!o.theories || typeof o.theories !== 'object') o.theories = {};
  if(!Array.isArray(o.struck)) o.struck = [];
  if(!Array.isArray(o.noted)) o.noted = [];
  if(!o.struckCase || typeof o.struckCase !== 'object') o.struckCase = {};
  if(!o.unlocked || typeof o.unlocked !== 'object') o.unlocked = {};
  if(!o.cases || typeof o.cases !== 'object') o.cases = {};
  for(const c of CASES){
    let x = o.cases[c];
    if(!x || typeof x !== 'object') x = o.cases[c] = blankCase();
    else { const b = blankCase(); for(const k in b) if(x[k] === undefined) x[k] = b[k]; }
  }
  if(!(o.v >= 2)){
    // a save from before the beta: every ink stays, and a card that already carries ink
    // stays on the table even though its lead is now behind fieldwork
    for(const k of o.inked) for(const id of String(k).split('|')) if(NODE[id] && NODE[id].lock) o.unlocked[id] = true;
    o.pencils = o.pencils.filter(k => !o.inked.includes(k));
    o.v = 2;
  }
  return o;
};
V12.inked = (a, b) => V12.ops().inked.includes(key(a, b));
V12.theory = id => !!V12.ops().theories[id];

/* what's on the table: the story has reached it, and its fieldwork (if any) is done */
const reqOk = n => { try{ return !n.req || !!n.req(); }catch(e){ return false; } };
const lockOk = n => {
  if(!n.lock) return true;
  const o = V12.ops();
  if(o.unlocked[n.id]) return true;
  let ok = false; try{ ok = !!n.lock.test(); }catch(e){}
  if(ok && reqOk(n)) o.unlocked[n.id] = true;          // once the fieldwork is in, the lead stays on the table
  return ok;
};
const visible = n => !!n && reqOk(n) && lockOk(n);
const needsWork = n => !!n.lock && reqOk(n) && !lockOk(n);
V12.opsVisible = id => visible(NODE[id]);

const inCase = (n, c) => !!n && n.g.includes(c);
const linkIn = (k, c) => { const [a, b] = k.split('|'); return inCase(NODE[a], c) && inCase(NODE[b], c); };
const caseInked = c => V12.ops().inked.filter(k => LINK[k] && linkIn(k, c));
const caseTheories = c => T.filter(t => V12.ops().theories[t.id] && t.links.every(([a, b]) => linkIn(key(a, b), c)));
const caseVisibleIds = c => N.filter(n => inCase(n, c) && visible(n)).map(n => n.id);
const caseLocked = c => N.filter(n => inCase(n, c) && needsWork(n));

// a pencilled pair belongs to the case you're looking at, if both cards are in it
function caseForPair(a, b){
  const ga = (NODE[a] || {}).g || [], gb = (NODE[b] || {}).g || [];
  const common = ga.filter(x => gb.includes(x));
  const cur = caseForView();
  if(common.includes(cur)) return cur;
  if(common.length) return common[0];
  if(ga.includes(cur) || gb.includes(cur)) return cur;
  return ga[0] || cur || 'lagos';
}

/* three strikes: refused until something new is on the table */
function refreshRefusal(c, quiet){
  const cs = V12.ops().cases[c];
  if(!cs || !cs.refused) return false;
  const snap = cs.refused, vis = caseVisibleIds(c), ink = caseInked(c).length;
  // a dead end turning up is not new evidence: only a real lead or a new link that holds reopens it
  if(vis.some(id => !(NODE[id] && NODE[id].herring) && !(snap.vis || []).includes(id)) || ink > (snap.ink || 0)){
    cs.refused = null; cs.lifted = (cs.lifted || 0) + 1;
    V12.log('warrant_review', { c });
    if(!quiet) setTimeout(()=>toast('WARRANT REVIEW', CASE_NAME[c] + ': new evidence. The magistrate will look at it again.', 2800), 1900);
    return true;
  }
  return false;
}
V12.opsRefresh = ()=>{ try{ V12.ops(); N.forEach(n => visible(n)); CASES.forEach(c => refreshRefusal(c)); }catch(e){ console.warn('[ops] refresh', e); } };

/* ---------- the board API (shared with casework and wayfinding) ---------- */
V12.caseOf = mid => CASE_OF[mid] || null;
V12.caseStrikes = c => { const cs = V12.ops().cases[c]; return cs ? (cs.strikes || 0) : 0; };
V12.caseCards = (c, opt) => N.filter(n => inCase(n, c) && (!(opt && opt.visible) || visible(n)))
  .map(n => ({ id:n.id, name:n.name, kind:n.kind, herring:!!n.herring }));
V12.caseLockedLeads = c => caseLocked(c).map(n => ({ id:n.id, kind:n.lock.kind }));
V12.warrantFor = c => {
  const o = V12.ops(), cs = o.cases[c];
  if(!cs) return { strength:0, signed:false, refused:false, strikes:0, need:'' };
  refreshRefusal(c);
  const inkN = caseInked(c).length;
  const th = caseTheories(c).reduce((s, t) => s + (t.weight || 15), 0);
  const keys = N.filter(n => n.lock && inCase(n, c) && visible(n)).length;
  const strength = clamp(Math.round(inkN * 10 + th + keys * 10 - cs.strikes * STRIKE_COST), 0, 100);
  const refused = !!cs.refused, signed = !refused && strength >= SIGN_AT;
  // Senior gets a plain, always-true ask; Recruit is told where the missing strength is
  let need = refused ? 'Find new evidence' : signed ? 'Ready to sign' : 'Needs stronger evidence';
  if(!refused && !signed && recruit()){
    const open = L.some(l => { const k = key(l.a, l.b); return !o.inked.includes(k) && linkIn(k, c) && visible(NODE[l.a]) && visible(NODE[l.b]); });
    need = open ? 'Ink more links' : caseLocked(c).length ? 'Do the fieldwork' : 'Work the case: new leads to come';
  }
  return { strength, signed, refused, strikes:cs.strikes, need };
};
V12.warrant = () => V12.warrantFor('lagos').signed;

/* ---------- the candidates for the Voice (shared with the finale) ---------- */
V12.CANDIDATES = [
  { id:'adaeze',  name:'Cdr. Adaeze',  role:'NACECA Commander, Lagos',   art:'adaeze_neutral' },
  { id:'uche',    name:'Sgt. Uche',    role:'Your squad lead',           art:'uche_neutral' },
  { id:'osaro',   name:'Engr. Osaro',  role:'Ugbowo site engineer',      art:'osaro_neutral' },
  { id:'obi',     name:'"Chief" Obi',  role:'In custody since Lekki',    art:'obi_neutral' },
  { id:'ifeanyi', name:'Ifeanyi',      role:'The cartel\'s fixer',       art:'ifeanyi_neutral' },
  { id:'chidi',   name:'Insp. Chidi',  role:'Anti-Kidnapping Squad liaison, Benin Bypass', art:'chidi_neutral' },
];
V12.art = id => (typeof PORTRAIT_ART !== 'undefined' && PORTRAIT_ART[id]) || '';

/* documents remember being read, and being read cleanly (contested reads don't open leads) */
if(typeof V12.openDoc === 'function' && !V12.openDoc._ops){
  const openDoc = V12.openDoc;
  V12.openDoc = function(spec, done){
    try{
      if(spec && spec.key){
        const k = spec.key, solved = spec.onSolved;
        (S.game.docSeen = S.game.docSeen || {})[k] = true;
        spec = Object.assign({}, spec, { onSolved(){ (S.game.docClean = S.game.docClean || {})[k] = true; if(typeof solved === 'function') return solved.apply(this, arguments); } });
      }
    }catch(e){ console.warn('[ops] doc', e); }
    return openDoc.call(this, spec, done);
  };
  V12.openDoc._ops = true;
}

/* ---------- UI ---------- */
const GROUPS = [ { id:'lagos', label:'LAGOS' }, { id:'route', label:'THE ROUTE' }, { id:'voice', label:'THE VOICE' }, { id:'all', label:'ALL' } ];
const COLS = [ { kind:'suspect', label:'SUSPECTS' }, { kind:'evidence', label:'EVIDENCE' }, { kind:'money', label:'MONEY' }, { kind:'place', label:'PLACES' } ];
const UI = { sel:null, view:'board', group:null, flash:null };

function ensure(){
  let ov = document.getElementById('screen-ops'); if(ov) return ov;
  ov = V12.el('div', 'overlay', `<div class="overlay-bg"></div>
    <div class="ops-frame" id="ops-frame">
      <div class="ops-head">
        <div class="ops-title"><b>OPERATIONS TABLE</b><span>NACECA-2026/0034 · Serpent's Route</span></div>
        <div class="ops-tabs" id="ops-tabs"></div>
        <div class="ops-btns"><button class="ops-b" id="ops-notes">NOTES</button><button class="ops-b gold" id="ops-seal">SEAL</button><button class="ops-b x" id="ops-close" aria-label="Close">${ic('close')}</button></div>
      </div>
      <div class="ops-main">
        <div class="ops-board" id="ops-board"><div class="ops-inner" id="ops-inner"></div></div>
        <div class="ops-side" id="ops-side"></div>
      </div>
      <div class="ops-foot" id="ops-foot"></div>
      <div class="ops-modal" id="ops-modal"></div>
    </div>`);
  ov.id = 'screen-ops';
  document.getElementById('game-root').appendChild(ov);
  ov.querySelector('#ops-close').addEventListener('click', V12.closeOps);
  ov.querySelector('#ops-notes').addEventListener('click', ()=>{ UI.view = UI.view === 'notes' ? 'board' : 'notes'; render(); });
  ov.querySelector('#ops-seal').addEventListener('click', ()=>sealModal());
  window.addEventListener('resize', ()=>{ if(ov.classList.contains('show')) drawLinks(); });
  return ov;
}
function defaultGroup(){
  const m = S.game.currentMission || '';
  const c = V12.caseOf(m);
  if(c) return c;
  if(V12.started('m7')) return 'voice';
  if(V12.started('m4')) return 'route';
  return 'lagos';
}
function caseForView(){ return UI.group && UI.group !== 'all' ? UI.group : defaultGroup(); }
V12.openOps = function(group, sel){
  ensure(); V12.ops();
  UI.group = group || UI.group || defaultGroup(); UI.sel = sel && NODE[sel] && visible(NODE[sel]) ? sel : null; UI.view = 'board';
  if(typeof musicForScene === 'function') musicForScene('investigation');
  showOverlay('screen-ops');
  render();
  requestAnimationFrame(drawLinks);
  V12.log('ops_open', { m:S.game.currentMission });
};
V12.closeOps = function(){
  const m = document.getElementById('ops-modal'); if(m) m.classList.remove('show');
  showOverlay(null);
  if(S.game.currentMission && ENGINE.movementEnabled !== false){ showHUD(true); if(typeof musicForScene === 'function') musicForScene(S.game.currentMission === 'm3n' ? 'investigation' : S.game.currentMission); }
  else if(typeof musicForScene === 'function') musicForScene('title');
  if(V12._onOpsClose){ const f = V12._onOpsClose; V12._onOpsClose = null; try{ f(); }catch(e){} }
};
window.openCaseFile = function(){
  if(S.game.currentMission === 'm1' && typeof completeObjective === 'function'){ completeObjective('o_casefile'); S.game._hqCaseFile = true; }
  V12.openOps();
};
window.openEvidenceBoard = function(){ V12.openOps(); };
// coming back from the capability screen returns to the table
const sb = document.getElementById('btn-skills-back');
if(sb) sb.addEventListener('click', ()=>{ if(V12._returnOps){ V12._returnOps = false; setTimeout(()=>V12.openOps(), 40); } });

const hasInk = id => V12.ops().inked.some(k => k.split('|').includes(id));
// Senior Agent: a role tag is a conclusion, so it shows only once the card carries ink
const tagOf = n => (recruit() || hasInk(n.id)) ? n.tag : KIND_LABEL[n.kind];
const dossierOf = n => { try{ return typeof n.dossier === 'function' ? n.dossier() : (n.dossier || ''); }catch(e){ return ''; } };

function render(){
  const ov = ensure(), o = V12.ops();
  ov.querySelector('#ops-tabs').innerHTML = GROUPS.map(g => `<button class="ops-tab ${UI.group === g.id ? 'on' : ''}" data-g="${g.id}">${g.label}</button>`).join('');
  ov.querySelectorAll('.ops-tab').forEach(b => b.addEventListener('click', ()=>{ UI.group = b.dataset.g; UI.sel = null; UI.view = 'board'; render(); requestAnimationFrame(drawLinks); }));
  const sealB = ov.querySelector('#ops-seal');
  const canSeal = visible(NODE.s_voice) && !S.game._finOsas;
  sealB.style.display = canSeal || S.game.sealed ? '' : 'none';
  sealB.innerHTML = S.game.sealed ? `SEALED ${ic('check')}` : 'SEAL ACCUSATION';
  sealB.classList.toggle('done', !!S.game.sealed);
  ov.querySelector('#ops-notes').classList.toggle('on', UI.view === 'notes');
  const inner = ov.querySelector('#ops-inner');
  if(UI.view === 'notes'){ inner.innerHTML = notesHTML(); inner.classList.add('notes'); }
  else {
    inner.classList.remove('notes');
    CASES.forEach(c => refreshRefusal(c));
    const inTab = n => UI.group === 'all' || n.g.includes(UI.group);
    const nodes = N.filter(n => inTab(n) && visible(n));
    // no number: a count that skipped the dead ends would tell you which new cards are dead ends
    const hidden = N.some(n => inTab(n) && !reqOk(n));
    const linksOf = id => o.inked.filter(k => k.split('|').includes(id)).length;
    const counts = recruit();
    inner.innerHTML = caseStrip(caseForView()) + `<div class="ops-cols">${COLS.map(c => {
      const list = nodes.filter(n => n.kind === c.kind);
      return `<div class="ops-col k-${c.kind}"><div class="ops-colh">${c.label}</div>${list.map(n => `
        <button class="ops-chip k-${n.kind} ${UI.sel === n.id ? 'sel' : ''} ${V12.evQ(evIdOf(n)) === 'weak' ? 'weak' : ''} ${o.seen && !o.seen[n.id] ? 'new' : ''}" data-id="${n.id}">
          <span class="t">${tagOf(n)}</span><span class="n">${n.name}</span><span class="m">${n.meta}</span>${counts && linksOf(n.id) ? `<span class="c">${linksOf(n.id)}</span>` : ''}
        </button>`).join('') || '<div class="ops-empty">—</div>'}</div>`;
    }).join('')}</div><svg class="ops-svg" id="ops-svg"></svg>${hidden ? '<div class="ops-more">More leads may turn up as the case moves</div>' : ''}`;
    o.seen = o.seen || {}; nodes.forEach(n => { o.seen[n.id] = true; });
    inner.querySelectorAll('.ops-chip').forEach(b => b.addEventListener('click', ()=>tapNode(b.dataset.id)));
  }
  side(); foot();
  requestAnimationFrame(drawLinks);
}
const evIdOf = n => ({ e_phish:'phishing_template', e_kcsims:'kc_sims', e_madam:'co_madam', e_laptop:'laptop', e_notebook:'obi_notebook', e_cash:'cash', e_ledger:'ransom_ledger', e_shrine:'e_shrine_ledger', e_asims:'asaba_sims', e_cdr:'tower_cdr', e_drive:'fin_drive', e_courier:'fin_courier_phone', e_efe:'efe_statement' })[n.id] || '';

/* the case slip: warrant stamp, strength, strikes, and the leads still out in the field */
const stampWord = w => w.refused ? 'refused' : w.signed ? 'signed' : 'pending';
function stampHTML(w, sm){ const s = stampWord(w); return `<span class="bd-stamp s-${s}${sm ? ' sm' : ''}">${s.toUpperCase()}</span>`; }
function strikesHTML(n){
  const marks = Array.from({ length:MAX_STRIKES }, (_, i) => `<span class="bd-x ${i < n ? 'on' : ''}">${i < n ? ic('cross') : ''}</span>`).join('');
  return `<span class="bd-strikes" role="img" aria-label="${n} of ${MAX_STRIKES} strikes">${marks}</span><b class="bd-strk-n">${Math.min(n, MAX_STRIKES)}/${MAX_STRIKES}</b>`;
}
function caseStrip(c){
  const w = V12.warrantFor(c), cs = V12.ops().cases[c] || blankCase();
  const locked = caseLocked(c);
  const nL = locked.length;
  const lockHTML = nL ? `<div class="bd-locked">${ic('lock')}<span><b>${nL}</b> lead${nL > 1 ? 's' : ''} need${nL > 1 ? '' : 's'} fieldwork${recruit() ? `: ${locked.map(n => esc(n.lock.what)).join('; ')}.` : '.'}</span></div>` : '';
  return `<div class="bd-case" data-case="${c}" data-warrant="${stampWord(w)}">
    <div class="bd-case-l"><span class="bd-case-n">${CASE_NAME[c]} · WARRANT</span>${stampHTML(w)}</div>
    <div class="bd-case-m">
      <div class="bd-str"><span>STRENGTH</span><b>${w.strength}</b><i class="bd-bar" aria-hidden="true"><i style="width:${w.strength}%"></i></i></div>
      <div class="bd-need">${esc(w.need)}</div>
    </div>
    <div class="bd-case-r"><span class="bd-strk-l">STRIKES</span>${strikesHTML(cs.strikes)}${cs.pen ? `<span class="bd-pen">INTEGRITY −${cs.pen}</span>` : ''}</div>
    ${lockHTML}
  </div>`;
}

function tapNode(id){
  const o = V12.ops();
  if(!UI.sel){ UI.sel = id; if(typeof sfxBlip === 'function') sfxBlip(); render(); return; }
  if(UI.sel === id){ UI.sel = null; render(); return; }
  const k = key(UI.sel, id);
  if(o.inked.includes(k)){ toast('ALREADY INKED', (LINK[k] || {}).hint || '', 1800); UI.sel = id; render(); return; }
  if(o.struck.includes(k)){ toast('STRUCK OFF', 'The magistrate already refused that link.', 1800); if(typeof sfxFail === 'function') sfxFail(); UI.sel = null; render(); return; }
  if(o.noted.includes(k)){ toast('SET ASIDE', 'True, but the magistrate ruled it isn\'t evidence of the crime.', 2000); UI.sel = null; render(); return; }
  const i = o.pencils.indexOf(k);
  if(i >= 0){ o.pencils.splice(i, 1); toast('ERASED', '', 900); UI.sel = null; render(); return; }
  if(o.pencils.length >= 6){ toast('SIX PENCILS IS THE LIMIT', 'File or erase one before you draw another', 2000); if(typeof sfxFail === 'function') sfxFail(); return; }
  o.pencils.push(k); o.tries = (o.tries || 0) + 1; o.sinceInk = (o.sinceInk || 0) + 1;
  if(typeof sfxClick === 'function') sfxClick();
  V12.log('pencil', { k });
  UI.sel = null;
  render();
}

/* FILE: the magistrate judges every pencilled link on its own */
function fileLinks(){
  const o = V12.ops();
  const pens = o.pencils.filter(k => { const [a, b] = k.split('|'); return visible(NODE[a]) && visible(NODE[b]); });
  o.pencils = [];
  if(!pens.length){ render(); return null; }
  const good = pens.filter(k => LINK[k] && !o.inked.includes(k));
  const bad = pens.filter(k => !LINK[k]);
  const res = [];
  // links that hold go on first: a refusal from an earlier filing can lift on them,
  // but a link filed alongside a third strike doesn't wipe that strike away
  let intel = 0;
  const wasRefused = CASES.filter(c => o.cases[c].refused);
  if(good.length){ intel = inkLinks(good, { quiet:true, ruling:true }); good.forEach(k => res.push({ k, ok:true })); }
  const lifted = wasRefused.filter(c => !o.cases[c].refused);
  const hitCases = new Set();
  for(const k of bad){
    const [a, b] = k.split('|');
    const c = caseForPair(a, b), cs = o.cases[c];
    if(o.struck.includes(k)){ res.push({ k, ok:false, again:true, c }); continue; }   // never costs twice
    if(FACT.has(k)){
      if(!o.noted.includes(k)) o.noted.push(k);
      res.push({ k, ok:false, noted:true, c });
      V12.log('noted', { k, c });
      continue;
    }
    o.struck.push(k); o.struckCase[k] = c;
    const money = (NODE[a] && NODE[a].kind === 'money') || (NODE[b] && NODE[b].kind === 'money');
    if(money && V12.has('money') && !cs.forgiven){
      cs.forgiven = true;
      res.push({ k, ok:false, forgiven:true, c });
      V12.log('strike_forgiven', { k, c });
      continue;
    }
    cs.strikes += 1; cs.pen = (cs.pen || 0) + INTEGRITY_COST;
    applyEffect({ integrity:-INTEGRITY_COST });
    res.push({ k, ok:false, strike:cs.strikes, c });
    hitCases.add(c);
    V12.log('strike', { k, c, n:cs.strikes });
  }
  // a refusal is stamped after the whole filing, so it waits for evidence that comes later
  const refusedNow = [];
  for(const c of hitCases){
    const cs = o.cases[c];
    if(cs.strikes >= MAX_STRIKES){
      const fresh = !cs.refused;
      cs.refused = { vis:caseVisibleIds(c), ink:caseInked(c).length, at:S.game.currentMission || null };
      if(fresh) refusedNow.push(c);
      V12.log('warrant_refused', { c });
    }
  }
  const nOk = res.filter(r => r.ok).length, struck = res.filter(r => !r.ok && !r.again && !r.noted), nNoted = res.filter(r => r.noted).length;
  const costs = struck.filter(r => r.strike);
  if(nOk && typeof sfxComplete === 'function') sfxComplete();
  if(costs.length){ if(typeof sfxFail === 'function') sfxFail(); if(typeof haptic === 'function') haptic([60, 40, 60]); }
  else if(nOk && typeof haptic === 'function') haptic([20, 40, 20]);
  const parts = [];
  if(nOk) parts.push(`+${intel} INTEL`);
  if(costs.length) parts.push(`INTEGRITY −${costs.length * INTEGRITY_COST}`);
  costs.forEach(r => parts.push(`${CASE_NAME[r.c]} STRIKE ${strikeOf(r.strike).toUpperCase()}`));
  if(struck.some(r => r.forgiven)) parts.push('ONE MONEY LINK FORGIVEN');
  if(nNoted) parts.push(nNoted === 1 ? 'ONE LINK SET ASIDE' : nNoted + ' LINKS SET ASIDE');
  const big = nOk && struck.length ? `FILED · ${nOk} INKED · ${struck.length} STRUCK` : nOk ? (nOk === 1 ? 'LINK INKED' : nOk + ' LINKS INKED') : struck.length ? 'STRUCK OFF' : nNoted ? 'SET ASIDE' : 'FILED';
  const sheet = !!document.getElementById('ops-modal');
  if(!sheet) toast(big, parts.join(' · '), 3000);
  if(nOk) stamp('INKED'); else if(struck.length) stamp('STRUCK', 'bad');
  if(typeof V12.m2TableCheck === 'function') V12.m2TableCheck();
  if(refusedNow.length && !sheet) setTimeout(()=>toast('WARRANT REFUSED', refusedNow.map(c => CASE_NAME[c]).join(', ') + ': three strikes. Bring new evidence.', 3200), 3100);
  V12.log('file', { n:pens.length, ok:nOk, struck:struck.length, noted:nNoted });
  // a filing is on the record: save it, so a reload can't take a strike back
  // (not before the campaign's first save point, so a fresh game never overwrites an older save early)
  if(typeof saveGame === 'function' && (S.game.completedMissions || []).includes('m1')) try{ saveGame(true); }catch(e){}
  render();
  rulingModal(res, refusedNow, lifted.filter(c => !o.cases[c].refused));
  return res;
}
V12.fileLinks = fileLinks;
V12.pencil = (a, b) => { const o = V12.ops(), k = key(a, b); if(!o.pencils.includes(k) && !o.inked.includes(k) && !o.struck.includes(k) && !o.noted.includes(k)){ o.pencils.push(k); o.tries = (o.tries || 0) + 1; o.sinceInk = (o.sinceInk || 0) + 1; } return k; };

function inkLinks(keys, opt){
  opt = opt || {};
  const o = V12.ops();
  let intel = 0;
  const fresh = [];
  for(const k of keys){
    const pi = o.pencils.indexOf(k); if(pi >= 0) o.pencils.splice(pi, 1);
    if(!o.inked.includes(k)){ o.inked.push(k); fresh.push(k); intel += (LINK[k] || {}).intel || 0; }
  }
  if(!fresh.length) return 0;
  o.sinceInk = 0;
  const before = V12.intelTier();
  S.game.intelScore = (S.game.intelScore || 0) + intel;
  if(typeof awardXP === 'function') awardXP(12 * fresh.length);
  UI.flash = fresh.slice();
  if(!opt.quiet){
    if(typeof sfxComplete === 'function') sfxComplete();
    if(typeof haptic === 'function') haptic([20,40,20]);
    toast(fresh.length === 1 ? 'LINK INKED' : fresh.length + ' LINKS INKED', `+${intel} INTEL · ` + fresh.map(k => (LINK[k] || {}).hint).filter(Boolean)[0], 2400);
    stamp('INKED');
  }
  const late = opt.quiet && !opt.ruling;
  if(typeof unlock === 'function') unlock('first_ink');
  V12.log('ink', { keys:fresh, intel });
  // theories
  for(const t of T){
    if(o.theories[t.id]) continue;
    if(t.links.every(([a, b]) => o.inked.includes(key(a, b)))){
      o.theories[t.id] = Date.now();
      if(t.on) try{ t.on(); }catch(e){}
      setTimeout(()=>toast('THEORY CONFIRMED', t.name.toUpperCase(), 2800), late ? 200 : 3400);
      V12.log('theory', { id:t.id });
    }
  }
  const after = V12.intelTier();
  if(after > before){ const x = V12.INTEL_TIERS[after - 1]; setTimeout(()=>toast(x.name, x.text, 3000), late ? 400 : 6200); }
  if(o.inked.length >= 3 && typeof completeObjective === 'function') completeObjective('o4_table');
  // a new link that holds is new evidence for a refused warrant
  CASES.forEach(c => refreshRefusal(c, !!opt.ruling));
  if(V12.onInk) try{ V12.onInk(fresh); }catch(e){}
  if(!opt.ruling && document.getElementById('screen-ops') && document.getElementById('screen-ops').classList.contains('show')) render();
  return intel;
}
V12.inkLinks = (pairs, quiet)=>inkLinks(pairs.map(([a, b]) => key(a, b)).filter(k => LINK[k]), { quiet:!!quiet });
function stamp(word, cls){
  const f = document.getElementById('ops-frame'); if(!f) return;
  const s = V12.el('div', 'ops-stamp' + (cls ? ' bd-' + cls : ''), word || 'INKED'); f.appendChild(s); setTimeout(()=>s.remove(), 1400);
}

const nm = id => NODE[id] ? NODE[id].name : id;
function rulingModal(res, refusedNow, lifted){
  const m = document.getElementById('ops-modal'); if(!m || !res || !res.length) return;
  const rows = res.map(r => {
    const [a, b] = r.k.split('|');
    if(r.ok) return `<li class="ok">${ic('check')}<div><b>INKED</b><em>${esc(nm(a))} — ${esc(nm(b))}</em><span>${esc((LINK[r.k] || {}).hint || '')}</span></div></li>`;
    if(r.noted) return `<li class="noted">${ic('doc')}<div><b>SET ASIDE</b><em>${esc(nm(a))} — ${esc(nm(b))}</em><span>True, but not evidence of the crime. No strike.</span></div></li>`;
    const why = r.again ? 'Already struck off. No further cost.'
      : r.forgiven ? 'Follow the Money: forgiven. No strike, no Integrity cost.'
      : `${CASE_NAME[r.c]} strike ${strikeOf(r.strike)} · Integrity −${INTEGRITY_COST}`;
    return `<li class="bad">${ic('cross')}<div><b>STRUCK OFF</b><em>${esc(nm(a))} — ${esc(nm(b))}</em><span>${why}</span></div></li>`;
  }).join('');
  const cases = [...new Set(res.map(r => r.c || caseForPair(...r.k.split('|'))))];
  const wr = cases.map(c => { const w = V12.warrantFor(c); return `<div class="bd-rw"><span class="bd-rw-n">${CASE_NAME[c]}</span>${stampHTML(w, true)}<span class="bd-rw-s">STRENGTH <b>${w.strength}</b> · ${esc(w.need)}</span></div>`; }).join('');
  const lift = (lifted || []).map(c => `<p class="bd-lifted">${ic('unlock')}<span><b>WARRANT REVIEW.</b> New evidence: the magistrate will look at the ${CASE_NAME[c]} warrant again.</span></p>`).join('');
  const ref = (refusedNow || []).map(c => `<p class="bd-refused">${ic('warning')}<span><b>THREE STRIKES.</b> The magistrate refuses the ${CASE_NAME[c]} warrant until you bring new evidence: a new lead, or a new link that holds.</span></p>`).join('');
  m.innerHTML = `<div class="ops-mbox bd-ruling" role="dialog" aria-label="The magistrate's ruling">
    <div class="ops-h">THE MAGISTRATE'S RULING</div>
    <ul class="bd-rul">${rows}</ul>${lift}${ref}<div class="bd-rws">${wr}</div>
    <div class="ops-mact"><button class="bd-btn" id="bd-rul-ok">BACK TO THE TABLE</button></div></div>`;
  m.classList.add('show');
  m.querySelector('#bd-rul-ok').onclick = ()=>{ m.classList.remove('show'); requestAnimationFrame(drawLinks); };
}

function drawLinks(){
  const inner = document.getElementById('ops-inner'), svg = document.getElementById('ops-svg');
  if(!inner || !svg || UI.view !== 'board') return;
  const o = V12.ops(), R = inner.getBoundingClientRect();
  const cols = [...inner.querySelectorAll('.ops-col')];
  // routing needs the four columns side by side; the narrow 2×2 layout falls back to plain curves
  const oneRow = cols.length > 1 && cols.every(c => Math.abs(c.getBoundingClientRect().top - cols[0].getBoundingClientRect().top) < 4);
  const box = id => { const el = inner.querySelector(`.ops-chip[data-id="${id}"]`); if(!el) return null; const r = el.getBoundingClientRect(); return { col: cols.indexOf(el.closest('.ops-col')), l:r.left - R.left, r:r.right - R.left, t:r.top - R.top, b:r.bottom - R.top, cx:(r.left + r.right)/2 - R.left, cy:(r.top + r.bottom)/2 - R.top }; };
  const all = o.inked.map(k => [k, 'ink']).concat(o.struck.map(k => [k, 'struck']), o.pencils.map(k => [k, 'pen']));
  const isFar = (A, B)=> oneRow && Math.abs(A.col - B.col) >= 2;
  // the floor: a channel under every card (and under the "more leads" line) where long links run
  let floor = 0;
  inner.querySelectorAll('.ops-chip,.ops-more').forEach(el => { floor = Math.max(floor, el.getBoundingClientRect().bottom - R.top); });
  const nFar = all.filter(([k]) => { const [a, b] = k.split('|'); const A = box(a), B = box(b); return A && B && isFar(A, B); }).length;
  inner.style.paddingBottom = nFar ? (34 + nFar * 6) + 'px' : '';
  svg.setAttribute('width', inner.scrollWidth); svg.setAttribute('height', inner.scrollHeight);
  svg.style.height = inner.scrollHeight + 'px';
  const GUT = 11, RR = 5;
  let fi = 0;
  const path = (A, B)=>{
    if(oneRow ? A.col === B.col : Math.abs(A.cx - B.cx) < 8){
      // same column: a loop out into the gutter on the right
      const [U, D] = A.cy < B.cy ? [A, B] : [B, A], x = Math.max(U.r, D.r), bend = 14;
      return `M${U.r} ${U.cy} C${x + bend} ${U.cy} ${x + bend} ${D.cy} ${D.r} ${D.cy}`;
    }
    const [P, Q] = (oneRow ? A.col < B.col : A.cx < B.cx) ? [A, B] : [B, A];
    if(!isFar(P, Q)){ const mx = (P.r + Q.l) / 2; return `M${P.r} ${P.cy} C${mx} ${P.cy} ${mx} ${Q.cy} ${Q.l} ${Q.cy}`; }
    // two or more columns apart: down the gutter, along the floor, up the gutter — never across a card
    const i = fi++, off = (i % 5 - 2) * 2;
    const x1 = P.r + GUT + off, x2 = Q.l - GUT - off, y = floor + 16 + i * 6;
    return `M${P.r} ${P.cy} H${x1 - RR} Q${x1} ${P.cy} ${x1} ${P.cy + RR} V${y - RR} Q${x1} ${y} ${x1 + RR} ${y} H${x2 - RR} Q${x2} ${y} ${x2} ${y - RR} V${Q.cy + RR} Q${x2} ${Q.cy} ${x2 + RR} ${Q.cy} H${Q.l}`;
  };
  let html = '';
  for(const [k, cls] of all){
    const [a, b] = k.split('|'); const A = box(a), B = box(b); if(!A || !B) continue;
    const hl = UI.sel && (a === UI.sel || b === UI.sel) ? ' hl' : ''; const fl = UI.flash && UI.flash.includes(k) ? ' flash' : '';
    html += `<path class="${cls}${hl}${fl}" data-k="${k}" d="${path(A, B)}"/>`;
  }
  svg.innerHTML = html;
  // a struck line carries a cross at its middle, so it never reads by colour alone
  let marks = '';
  svg.querySelectorAll('path.struck').forEach(p => {
    try{ const len = p.getTotalLength(), pt = p.getPointAtLength(len / 2); marks += `<g class="bd-xmark" transform="translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})"><circle r="7"/><path d="M-3.2 -3.2L3.2 3.2M3.2 -3.2L-3.2 3.2"/></g>`; }catch(e){}
  });
  if(marks) svg.insertAdjacentHTML('beforeend', marks);
  UI.flash = null;
}

function side(){
  const el = document.getElementById('ops-side'), o = V12.ops();
  if(UI.view === 'notes'){ el.innerHTML = `<div class="ops-h">CASE NOTES</div><p class="ops-p">Your personnel file, the case background, every piece of evidence and the calls you made. Tap NOTES again to go back to the table.</p>`; return; }
  if(UI.sel){
    const n = NODE[UI.sel];
    const other = k => k.split('|').find(x => x !== n.id);
    const mine = o.inked.filter(k => k.split('|').includes(n.id)).map(k => `<li class="ink"><b>${esc(nm(other(k)))}</b><span>${(LINK[k] || {}).hint || ''}</span></li>`).join('');
    const struck = o.struck.filter(k => k.split('|').includes(n.id)).map(k => `<li class="bd-struck"><span class="bd-tag-x">${ic('cross')}STRUCK</span><span>${esc(nm(other(k)))}</span></li>`).join('');
    const noted = o.noted.filter(k => k.split('|').includes(n.id)).map(k => `<li class="bd-noted"><span class="bd-tag-n">SET ASIDE</span><span>${esc(nm(other(k)))}</span></li>`).join('');
    const pens = o.pencils.filter(k => k.split('|').includes(n.id)).map(k => `<li class="pen">pencilled to ${esc(nm(other(k)))} <button class="ops-erase" data-k="${k}">erase</button></li>`).join('');
    const weak = V12.evQ(evIdOf(n)) === 'weak';
    const note = recruit() && n.note ? `<div class="bd-note"><b>${ic('search')} ANALYST'S NOTE</b><span>${n.note}</span></div>` : '';
    el.innerHTML = `<div class="ops-kind k-${n.kind}">${tagOf(n)}</div><div class="ops-name">${n.name}</div><p class="ops-p bd-facts">${dossierOf(n)}</p>${note}
      ${weak ? '<p class="ops-weak">CONTESTED — the defence will attack how this was obtained.</p>' : ''}
      <div class="ops-h">LINKS</div><ul class="ops-ul">${mine}${struck}${noted}${pens}${!mine && !struck && !noted && !pens ? '<li class="none">Nothing yet.</li>' : ''}</ul>
      <p class="ops-tip">Tap another card to pencil a link from <b>${n.name}</b>. Tap this card again to put it down.</p>`;
    el.querySelectorAll('.ops-erase').forEach(b => b.addEventListener('click', ()=>{ const i = o.pencils.indexOf(b.dataset.k); if(i >= 0) o.pencils.splice(i, 1); render(); }));
    return;
  }
  const rec = recruit();
  // Senior Agent sees only theories it has proven; Recruit also sees the open questions
  const th = T.filter(t => o.theories[t.id] || (rec && t.links.every(([a, b]) => visible(NODE[a]) && visible(NODE[b]))));
  const objs = (S.game.objectives || []);
  const mid = S.game.currentMission, mname = (MISSIONS.find(m => m.id === mid) || {}).name;
  el.innerHTML = `
    <div class="ops-h">THEORIES</div>
    ${th.length ? th.map(t => o.theories[t.id]
      ? `<div class="ops-th done"><b>${ic('check')} ${t.name}</b><span>${t.effect}</span></div>`
      : `<div class="ops-th"><b>${t.q}</b><span>Unconfirmed</span></div>`).join('') : `<p class="ops-p">${rec ? 'No theories yet. Link what you\'ve found.' : 'No theories proven yet. Inked chains of links become theories.'}</p>`}
    <div class="ops-h">HOW IT WORKS</div>
    <p class="ops-p">Tap two cards to pencil a link. Pencils are free: erase and redraw as you like, up to six at a time.</p>
    <p class="ops-p">When you're sure, <b>FILE</b> them. A filed link tells the magistrate the two are connected in the crime, not just that they know each other. A link that holds is inked. One that is true but says nothing about the crime is set aside, at no cost. A wrong one is struck off: a strike on the case and <b>Integrity −${INTEGRITY_COST}</b>${V12.has('money') ? ' (Follow the Money forgives your first wrong money link on each case)' : ''}. Three strikes and the warrant is refused until you bring new evidence.</p>
    <p class="ops-p">Not every lead on this table belongs to the ring.</p>
    ${mid && objs.length ? `<div class="ops-h">${(mname || 'OPERATION').toUpperCase()}</div><div id="ops-objs"><div>${objs.map(x => `<div class="so ${x.done ? 'done' : ''}">${x.text}</div>`).join('')}</div></div>` : ''}
    <div class="ops-h">REPUTATION</div>${V12.repBars()}
    <button class="ops-b gold wide" id="ops-caps">CAPABILITIES · ${S.player.skillPoints || 0} PT${(S.player.skillPoints || 0) === 1 ? '' : 'S'}</button>
    ${hintHTML()}`;
  const objHost = el.querySelector('#ops-objs'); if(objHost && typeof sideCaseFile === 'function') try{ sideCaseFile(objHost); }catch(e){}
  el.querySelector('#ops-caps').addEventListener('click', ()=>{ V12._returnOps = true; openSkillTree(); });
}
// Sgt. Uche's nudge is a Recruit crutch
function hintHTML(){
  if(!recruit()) return '';
  const o = V12.ops(), cs = o.cases[caseForView()] || {};
  if((o.sinceInk || 0) < 5 && !(cs.strikes > 0)) return '';
  const m = S.game.currentMission;
  const h = m === 'm2' ? 'Start with what you found today. Whose name is on KC\'s SIMs — and where do her SIMs sleep at night?'
    : m === 'm3n' ? 'Put Obi\'s notebook next to the courier\'s phone. Same night?'
    : ['m4','m5','m6'].includes(m) ? 'Follow the paper: where did each ledger say to go next?'
    : ['m7','t7','m8'].includes(m) ? 'Every call pinged one tower. Where does the handset sleep?'
    : 'Pick one suspect and ask three things: where was he, what did he carry, who paid him?';
  return `<div class="ops-hint" data-hint="uche"><img src="${V12.art('uche_neutral')}" alt=""><div><b>SGT. UCHE</b>${h}</div></div>`;
}
function foot(){
  const el = document.getElementById('ops-foot'), o = V12.ops(), tier = V12.intelTier();
  const next = V12.INTEL_TIERS[tier], n = o.pencils.length;
  el.innerHTML = `<button class="bd-file" id="ops-file" ${n ? '' : 'disabled'}>${ic('stamp')}<span>${n ? `FILE ${n} LINK${n > 1 ? 'S' : ''}` : 'FILE LINKS'}</span></button>
    <span class="f"><b>${n}</b>/6 PENCILLED</span><span class="f"><b>${o.inked.length}</b> INKED</span>
    <span class="f">INTEL <b>${S.game.intelScore || 0}</b>${next ? ` · next: ${next.name} at ${next.at}` : ''}</span>
    <button class="ops-b" id="ops-erase-all" ${n ? '' : 'disabled'}>ERASE PENCILS</button>`;
  el.querySelector('#ops-erase-all').addEventListener('click', ()=>{ o.pencils = []; render(); });
  el.querySelector('#ops-file').addEventListener('click', ()=>{ if(V12.ops().pencils.length) fileLinks(); });
}

// case-file rows may carry emoji (older config) or icon names: draw them as line icons either way
const NOTE_ICON = { '🪪':'id', '✉️':'envelope', '✉':'envelope', '⚖️':'scales', '⚖':'scales', '📁':'folder', '🏦':'bank', '📱':'phone', '💰':'coins', '🔬':'scan' };
const noteIco = s => { if(typeof s === 'string' && s.trim().startsWith('<svg')) return s; const k = (typeof ICONS !== 'undefined' && ICONS[s]) ? s : NOTE_ICON[s]; return k ? ic(k) : esc(s || ''); };
function notesHTML(){
  const rows = [...CASE_ENTRIES_BASE];
  for(const e of (S.game.evidence || [])) rows.push({ ico:'scan', nm:'EVIDENCE — ' + e.name, ds: V12.evQ(e.id) === 'weak' ? 'Logged, but contested: the defence will attack how it was obtained.' : 'Logged in chain of custody.' });
  const mc = S.game.moralChoices || {};
  const ds = [
    mc.choice === 'detain' ? 'Detained KC.' : '', mc.choice === 'flip' ? 'Signed KC as an informant.' : '', mc.choice === 'force' ? 'Used force on KC.' : '',
    mc.market_runner === 'escaped' ? 'KC got away.' : '',
    mc.entry ? ({ knock:'Knock-and-announce at Lekki.', quiet:'Quiet breach at Lekki.', loud:'Loud breach at Lekki.' })[mc.entry] : '',
    mc.arrest ? ({ professional:'Arrested Obi with restraint.', forceful:'Forceful takedown of Obi.', informant:'Flipped Obi.', bribe:'Took Obi\'s money.' })[mc.arrest] : '',
    mc.checkpoint ? ({ arrest_driver:'Arrested Musa.', flip_driver:'Flipped Musa.', tail_driver:'Let Musa drive on under watch.' })[mc.checkpoint] : '',
    mc.asaba ? ({ rescue:'Pulled Tobi out of the fire.', chase:'Chased Ifeanyi.', failed:'Lost both at Asaba.' })[mc.asaba] || '' : '',
    mc.tower ? 'At Ugbowo: ' + mc.tower.replace('_', ' ') + '.' : '',
    S.game.sealed ? `Sealed accusation filed: ${(V12.CANDIDATES.find(c => c.id === S.game.sealed.who) || {}).name}.` : '',
  ].filter(Boolean).join(' ');
  if(ds) rows.push({ ico:'scales', nm:'YOUR DECISIONS', ds });
  return `<div class="ops-notes">${rows.map(e => `<div class="case-row"><div class="ico">${noteIco(e.icon || e.ico)}</div><div class="body"><div class="nm">${e.nm}</div><div class="ds">${e.ds}</div></div></div>`).join('')}</div>`;
}

/* ---------- the sealed accusation ---------- */
function sealModal(){
  const m = document.getElementById('ops-modal');
  if(S.game.sealed){
    const c = V12.CANDIDATES.find(x => x.id === S.game.sealed.who) || {};
    m.innerHTML = `<div class="ops-mbox"><div class="ops-h">SEALED REPORT · BENIN ZONAL</div><p class="ops-p">You named <b>${c.name}</b> as the Voice. Sealed reports can't be withdrawn.</p><button class="btn ghost" id="seal-ok">CLOSE</button></div>`;
    m.classList.add('show'); m.querySelector('#seal-ok').onclick = ()=>m.classList.remove('show'); return;
  }
  let pick = null;
  m.innerHTML = `<div class="ops-mbox wide">
    <div class="ops-h">WHO IS THE VOICE?</div>
    <p class="ops-p">A sealed report goes to Benin Zonal tonight, before anyone else knows what you think. You can't take it back. If you're right, it will matter.</p>
    <div class="acc-grid">${V12.CANDIDATES.map(c => `<button class="acc-card" data-id="${c.id}"><img src="${V12.art(c.art)}" alt=""><b>${c.name}</b><span>${c.role}</span></button>`).join('')}</div>
    <div class="ops-mact"><button class="btn ghost" id="seal-cancel">NOT YET</button><button class="btn primary" id="seal-go" disabled>SEAL IT</button></div></div>`;
  m.classList.add('show');
  m.querySelectorAll('.acc-card').forEach(b => b.addEventListener('click', ()=>{ pick = b.dataset.id; m.querySelectorAll('.acc-card').forEach(x => x.classList.toggle('sel', x === b)); m.querySelector('#seal-go').disabled = false; if(typeof sfxClick === 'function') sfxClick(); }));
  m.querySelector('#seal-cancel').onclick = ()=>m.classList.remove('show');
  m.querySelector('#seal-go').onclick = ()=>{
    if(!pick) return;
    const go = m.querySelector('#seal-go');
    if(!go.dataset.armed){ go.dataset.armed = '1'; go.textContent = 'TAP AGAIN TO SEAL'; return; }
    S.game.sealed = { who:pick, at:S.game.currentMission, before:!S.game._finOsas, t:Date.now() };
    m.classList.remove('show');
    toast('REPORT SEALED', 'It goes to Benin Zonal tonight.', 2400);
    if(typeof saveGame === 'function') saveGame(true);
    V12.log('sealed', { who:pick, m:S.game.currentMission });
    render();
  };
}

})();
