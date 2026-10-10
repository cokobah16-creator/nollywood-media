/* =========================================================================
   NACECA · v13 data — content for the investigation layer ("The Case File")
   Everything here is data: v13_intel.js, v13_desk.js, v13_briefing.js and
   v13_court.js read it. Canon: the Voice is Commander Adaeze. Clues may point
   at her ("Madam", "CONTROL", "C.A."); none may name her before the reveal.
   ========================================================================= */

/* ---- 1. Evidence model: what each logged item IS ----
   tier: confirmed · probable · allegation · rumour
   e: electronic (needs an Evidence Act 2011 s.84 certificate to be admitted)   */
const INTEL_ITEMS = {
  phishing_template: { m:'m2', kind:'DIGITAL',   tier:'confirmed', e:true,  src:"KC's phone — forensic scan, Ikeja charging stand" },
  laptop:            { m:'m3', kind:'DEVICE',    tier:'confirmed', e:true,  src:"Chief Obi's study, Lekki" },
  cash:              { m:'m3', kind:'PHYSICAL',  tier:'confirmed',          src:'Coffee table, Lekki living room' },
  safe_drives:       { m:'m3', kind:'DEVICE',    tier:'confirmed', e:true,  src:'Wall safe, Lekki study' },
  broken_seal:       { m:'m4', kind:'PHYSICAL',  tier:'confirmed',          src:'Livestock truck, Benin Bypass' },
  ransom_ledger:     { m:'m4', kind:'DOCUMENT',  tier:'confirmed',          src:'Rear compartment, livestock truck' },
  concealed_arms:    { m:'m4', kind:'PHYSICAL',  tier:'confirmed',          src:'Rear compartment, livestock truck' },
  musa_statement:    { m:'m4', kind:'TESTIMONY', tier:'probable',           src:'Musa, roadside interview with AKS' },
  shrine_pots:       { m:'m5', kind:'PHYSICAL',  tier:'confirmed',          src:'Libation pots, Ozalla shrine' },
  shrine_cache:      { m:'m5', kind:'PHYSICAL',  tier:'confirmed',          src:'Jerry-cans, Ozalla shrine' },
  e_shrine_ledger:   { m:'m5', kind:'DOCUMENT',  tier:'confirmed',          src:'Inside the jerry-can cache' },
  asaba_sims:        { m:'m6', kind:'PHYSICAL',  tier:'confirmed',          src:'Asaba warehouse, office shelf' },
  asaba_runner:      { m:'m6', kind:'PERSON',    tier:'confirmed',          src:'Arrested in the warehouse yard' },
  asaba_hostage:     { m:'m6', kind:'WITNESS',   tier:'probable',           src:'Recovered from the smoke' },
  tower_fibre:       { m:'m7', kind:'PHYSICAL',  tier:'confirmed',          src:'Fibre backhaul, Ugbowo mast' },
  tower_cdr:         { m:'m7', kind:'TELECOM',   tier:'confirmed', e:true,  src:'BTS cabinet, Ugbowo mast' },
  tower_fix:         { m:'m7', kind:'TELECOM',   tier:'probable',  e:true,  src:'Live sector timing, Ugbowo mast' },
  fin_drive:         { m:'m8', kind:'DEVICE',    tier:'confirmed', e:true,  src:"Osas's pocket, Akintola Close" },
  fin_courier_phone: { m:'m8', kind:'DEVICE',    tier:'confirmed', e:true,  src:'Taken from the courier, Ekosodin' },
  fin_recording:     { m:'m8', kind:'TELECOM',   tier:'confirmed', e:true,  src:'Field-office recording of the evening call' },
  // v12 evidence
  co_madam:          { m:'m0', kind:'DEVICE',    tier:'probable',  e:true,  src:'Cracked phone in a Mushin puddle, the night before' },
  kc_sims:           { m:'m2', kind:'PHYSICAL',  tier:'confirmed',          src:'SIM sleeves behind the Ikeja stalls' },
  obi_notebook:      { m:'m3', kind:'DOCUMENT',  tier:'confirmed',          src:"Chief Obi's study, beside the cash" },
  osas_voicemail:    { m:'m3n',kind:'TELECOM',   tier:'probable',  e:true,  src:'Your desk phone, Lagos HQ, 23:40' },
  // what the investigation itself produces (added to the case between operations)
  inv_gatehouse:     { m:'m3', kind:'DOCUMENT',  tier:'probable',           src:'Lekki estate gatehouse logbook', inv:true },
  inv_ca:            { m:'m6', kind:'DOCUMENT',  tier:'confirmed',          src:'CAC records and NFIU returns', inv:true },
  inv_engineer:      { m:'m5', kind:'TELECOM',   tier:'confirmed', e:true,  src:"The Engineer's call records, pulled off the books", inv:true },
  inv_stakeout:      { m:'m5', kind:'PHOTO',     tier:'probable',  e:true,  src:'Surveillance van, Zuma Court, Wuse II', inv:true },
  inv_invoice:       { m:'m5', kind:'DOCUMENT',  tier:'confirmed',          src:"Apex Corporate Services' out-tray", inv:true },
};
const INV_NAMES = {
  inv_gatehouse:'Lekki Gatehouse Log — Pool Car LND-412-KJ',
  inv_ca:'C.A. Consulting — CAC Record and Money Trail',
  inv_engineer:"The Engineer's Call Log — 41 Calls to CONTROL",
  inv_stakeout:'Zuma Court Stakeout Photographs',
  inv_invoice:'Apex Invoice — C.A. Consulting to the Foundation',
};
const TIER_LABEL = { confirmed:'CONFIRMED', probable:'PROBABLE', allegation:'ALLEGATION', rumour:'RUMOUR' };
const TIER_WEIGHT = { confirmed:3, probable:2, allegation:1, rumour:0 };

/* ---- 2. Phones: recovered handsets as investigative objects ----
   Flag what matters. rel:true items are real leads; the rest is someone's life. */
const PHONES = [
  { id:'kc', name:"KC's phone", model:'Tecno Spark · cracked screen', needs:'phishing_template', items:[
    { id:'kc_msg_engineer', sec:'MESSAGES', from:'Engineer', text:'New batch. 400 numbers. Same BVN script. Dont use your own line.', rel:true, why:'KC runs the template; the Engineer supplies the numbers.' },
    { id:'kc_msg_mama', sec:'MESSAGES', from:'Mama', text:'Did you eat? Bring bread when you are coming.', rel:false },
    { id:'kc_msg_control', sec:'MESSAGES', from:'CONTROL', text:'Hold the new SIMs till Friday. No calls from the market.', rel:true, why:'Someone saved only as CONTROL gives KC orders.', card:'a_control' },
    { id:'kc_call_control', sec:'CALLS', from:'CONTROL', text:'3 calls this week · 19:00 · 19:02 · 19:04', rel:true, why:"CONTROL calls at seven — the same hour the ransom calls reach Mrs. Ehigie." },
    { id:'kc_call_data', sec:'CALLS', from:'Chinedu Data', text:'12 calls · various times', rel:false },
    { id:'kc_ph_gate', sec:'PHOTOS', from:'Camera', text:'Selfie at a black gate, Lekki Phase 1. A brass plate on the pillar: OBI.', rel:true, why:"KC has stood at Chief Obi's gate.", link:['s_kc','l_lekki'] },
    { id:'kc_ph_van', sec:'PHOTOS', from:'Camera', text:'Blurry shot of a dark-blue Toyota Sienna at the charging stand. Friday, 18:50.', rel:true, why:'The SIM drop vehicle, photographed by the courier himself.' },
    { id:'kc_ph_match', sec:'PHOTOS', from:'Camera', text:'Teslim Balogun Stadium, terraces. Thumbs up.', rel:false },
    { id:'kc_bank_150k', sec:'BANK ALERTS', from:'Moniepoint', text:"Credit ₦150,000.00 · From ODOGWU VENTURES · Narr: SIM LOGISTICS", rel:true, why:'A payment you can follow.', money:'n_kc' },
    { id:'kc_bank_airtime', sec:'BANK ALERTS', from:'Bank', text:'Debit ₦2,500.00 · Airtime recharge', rel:false },
    { id:'kc_del_control', sec:'DELETED', from:'(recovered fragment)', text:"…dont ever call CONTROL from this line. if they pick you, you dont know me…", rel:true, why:'KC was told to protect CONTROL above everyone.' },
  ]},
  { id:'musa', name:"Musa's phone", model:'Itel button phone + old Samsung', needs:'ransom_ledger', items:[
    { id:'musa_ride_asaba', sec:'RIDE HISTORY', from:'Bolt', text:'Benin Bypass → Riverview Suites, Asaba · 2 weeks ago, 23:40', rel:true, why:'Musa was in Asaba recently.' },
    { id:'musa_ph_hotel', sec:'PHOTOS', from:'Camera', text:'Musa outside Riverview Suites, Asaba. The Niger Bridge lights behind him.', rel:true, why:'He says he has never been to Asaba. His own camera disagrees.' },
    { id:'musa_call_engineer', sec:'CALLS', from:'Engineer', text:'02:10 · 02:14 · 02:31 — every pickup night', rel:true, why:'The Engineer calls before each pickup.' },
    { id:'musa_msg_home', sec:'MESSAGES', from:'Home', text:'The children ask when you are coming back. Aisha has fever small.', rel:false },
    { id:'musa_bank_bw', sec:'BANK ALERTS', from:'Bank', text:'Credit ₦85,000.00 · From BLUEWATER LOGISTICS LTD · Narr: haulage', rel:true, why:'Bluewater pays the driver of a ransom truck.', money:'n_bluewater' },
    { id:'musa_msg_cattle', sec:'MESSAGES', from:'Alhaji Garba', text:'Cattle price don rise for Kano market. Call me.', rel:false },
  ]},
  { id:'burner', name:'Warehouse burner', model:'Unbranded · found with the SIM packs', needs:'asaba_sims', items:[
    { id:'bu_contacts', sec:'CONTACTS', from:'Phonebook', text:'Two entries only: "E." and "CONTROL".', rel:true, why:'This handset existed to talk to two people.' },
    { id:'bu_msg_accountant', sec:'MESSAGES', from:'→ CONTROL', text:'The accountant keeps asking about the drive. What do we do.', rel:true, why:'Tobi was taken because of what he knew.' },
    { id:'bu_msg_student', sec:'MESSAGES', from:'CONTROL', text:"Move him tonight. The student's file stays with me.", rel:true, why:'The kidnapping is about a file a student found.' },
    { id:'bu_ping_ugbowo', sec:'LOCATION', from:'Network', text:'Last registered cell: Ugbowo, Benin City — three nights running.', rel:true, why:'CONTROL works near the Ugbowo mast.' },
    { id:'bu_ph_gate', sec:'PHOTOS', from:'Camera', text:'A blue gate. The house number has been painted over.', rel:true, why:'A house someone wanted remembered — and hidden.' },
    { id:'bu_del_foundation', sec:'DELETED', from:'(recovered fragment)', text:'…move the 2.1 to the Foundation before audit…', rel:true, why:'₦2.1bn passed through a charity.', money:'n_charity' },
    { id:'bu_glo', sec:'MESSAGES', from:'Glo', text:'Congratulations! You have received 2GB bonus data.', rel:false },
  ]},
];

/* ---- 3. Money trail: a ₦150,000 alert that becomes a ₦4bn network ---- */
const MONEY_NODES = {
  n_kc:        { name:'KC — personal wallet', kind:'PERSON', amt:150000, desc:'One credit from a POS agent, narration "SIM LOGISTICS".', next:['n_odogwu'] },
  n_odogwu:    { name:'Odogwu Ventures', kind:'POS AGENT', amt:38000000, desc:'Computer Village POS. ₦38M cashed out in three days, matched to two ransom payouts.', next:['n_bluewater','n_sister'], reg:'odogwu' },
  n_sister:    { name:"Owner's sister — school fees", kind:'RELATIVE', amt:420000, desc:"Three transfers to a secondary school in Nnewi. It's school fees. Dead end.", next:[], dead:true },
  n_bluewater: { name:'Bluewater Logistics Ltd', kind:'COMPANY', amt:640000000, desc:'"Haulage" company with no trucks registered to it. Pays drivers, couriers and POS agents.', next:['n_wallet','n_charity','n_contract'], reg:'bluewater' },
  n_wallet:    { name:'Wallet 0xE7…91A', kind:'CRYPTO', amt:1200000000, desc:'0.62 BTC through three OTC desks, then stablecoins out to a property developer.', next:['n_serpentine','n_otc'] },
  n_otc:       { name:'Offshore OTC desk', kind:'CRYPTO', amt:0, desc:'The desk is registered abroad and will not answer an NFIU request. Dead end for now.', next:[], dead:true },
  n_serpentine:{ name:'Serpentine Homes Ltd', kind:'PROPERTY', amt:900000000, desc:'Four units in Lekki bought for cash in a single week.', next:[], reg:'serpentine' },
  n_charity:   { name:'Ugbowo Relief Foundation', kind:'CHARITY', amt:2100000000, desc:'Incorporated trustees. ₦2.1bn in, almost nothing spent on relief.', next:['n_ca','n_contract'], reg:'urf' },
  n_contract:  { name:'Edo borehole contract', kind:'CONTRACT', amt:310000000, desc:'A ₦310M borehole contract paid in full. Two of the six boreholes exist.', next:[] },
  n_ca:        { name:'C.A. Consulting Services Ltd', kind:'COMPANY', amt:410000000, desc:'A monthly "retainer" from the charity — same amount, first of every month, since March 2019. Then cash withdrawals in Ikoyi.', next:[], reg:'ca', card:'a_ca', key:true },
};
const MONEY_START_REQUESTS = 4;   // NFIU requests in hand when the trail opens
const MONEY_PER_WEEK = 2;         // more arrive with each weekly briefing

/* ---- 4. Corporate Affairs Commission search ---- */
const REGISTRY = {
  odogwu:    { name:'Odogwu Ventures', no:'BN 2841177', type:'Business Name', inc:'02 Feb 2021', people:['Emeka Odogwu (proprietor)'], sec:'—', addr:'Shop 14, Computer Village, Ikeja', status:'ACTIVE' },
  bluewater: { name:'Bluewater Logistics Ltd', no:'RC 1520443', type:'Private company', inc:'11 Jun 2018', people:['Kunle Bamidele (director)','Ngozi Eke (director)'], sec:'Apex Corporate Services', addr:'Suite 4B, Zuma Court, Wuse II, Abuja', status:'ACTIVE' },
  serpentine:{ name:'Serpentine Homes Ltd', no:'RC 1588102', type:'Private company', inc:'23 Aug 2019', people:['Bassey Okon (director)','Apex Nominees Ltd (shareholder)'], sec:'Apex Corporate Services', addr:'Suite 4B, Zuma Court, Wuse II, Abuja', status:'ACTIVE' },
  urf:       { name:'Ugbowo Relief Foundation', no:'IT 140226', type:'Incorporated Trustees (CAMA 2020, Part F)', inc:'30 Jan 2018', people:['Rev. Peter Osagie (trustee)','Mrs. Efe Imade (trustee)','Mrs. C. Amadi (trustee)'], sec:'Apex Corporate Services', addr:'Suite 4B, Zuma Court, Wuse II, Abuja', status:'ACTIVE' },
  ca:        { name:'C.A. Consulting Services Ltd', no:'RC 1544870', type:'Private company', inc:'14 Mar 2019', people:['Grace Oke (director — nominee)','Apex Nominees Ltd (100% shareholder)'], sec:'Apex Corporate Services', addr:'Suite 4B, Zuma Court, Wuse II, Abuja', status:'ACTIVE' },
  apex:      { name:'Apex Corporate Services', no:'BN 2290315', type:'Business Name (company secretarial)', inc:'09 May 2017', people:['Barr. Tamuno Briggs (proprietor)'], sec:'—', addr:'Suite 4B, Zuma Court, Wuse II, Abuja', status:'ACTIVE' },
  silverline:{ name:'Silverline Media Ltd', no:'RC 1702219', type:'Private company', inc:'18 Oct 2020', people:['Tari Ebi (director)'], sec:'Apex Corporate Services', addr:'Suite 4B, Zuma Court, Wuse II, Abuja', status:'ACTIVE', hidden:true },
  amadi:     { name:'Mrs. C. Amadi', no:'—', type:'Person search', inc:'—', people:['Retired primary-school teacher, Uselu. Trustee of one foundation.'], sec:'—', addr:'Uselu, Benin City', status:'—', person:true, hidden:true },
};
const ZUMA = 'Suite 4B, Zuma Court, Wuse II, Abuja';

/* ---- 5. Statements: witness reliability, corroboration, tells ----
   truth: corroborated · contradicted (they must know better) · mistaken (honest error / hearsay)
   proof: what you need in hand to establish it. Without it, the right call is UNVERIFIED. */
const STATEMENTS = [
  { id:'st_tunde', who:'TUNDE', art:'tunde_neutral', role:'Paid informant, Ikeja market', needs:'m2', claims:[
    { id:'t1', text:'"Every Friday a black Sienna drops the SIMs for the boy."', truth:'mistaken', proof:'kc_ph_van', why:"KC's own photo shows a dark-blue Sienna under sodium light. Right car, right day, wrong colour." },
    { id:'t2', text:'"Those ransom calls come from Warri. Everybody for market knows."', truth:'mistaken', proof:'tower_fix', why:'The handset fix puts the caller in Ekosodin, Benin. Tunde repeated market talk.' },
    { id:'t3', text:'"The boy works for Chief Obi himself. Direct."', truth:'contradicted', proof:'kc_msg_engineer', why:"KC takes orders from the Engineer and CONTROL. Tunde knew that — he inflated the tip to raise his fee." },
  ]},
  { id:'st_musa', who:'MUSA', art:'musa_evasive', role:'Truck driver, Benin Bypass', needs:'m4', claims:[
    { id:'u1', text:'"I have never been to Asaba in my life."', truth:'contradicted', proof:'musa_ph_hotel', why:'A photo on his own phone, outside an Asaba hotel, two weeks ago.' },
    { id:'u2', text:'"The man who loads the truck — I only know him as the Engineer."', truth:'corroborated', proof:'musa_call_engineer', why:'His call log has "Engineer" before every pickup. Nothing shows he knew more.' },
    { id:'u3', text:'"The compartment was already there when I bought the truck."', truth:'unverifiable', why:'Nothing you can find proves or disproves it. Some claims stay open.' },
    { id:'u4', text:'"Nobody pays me except the cattle traders."', truth:'contradicted', proof:'musa_bank_bw', why:'Bluewater Logistics paid him ₦85,000 for "haulage".' },
  ]},
  { id:'st_tobi', who:'TOBI ONUOHA', art:'tobi_neutral', role:'Accountant, recovered in Asaba', needs:'asaba_hostage', claims:[
    { id:'b1', text:'"They held me because I had seen the payroll."', truth:'corroborated', proof:'bu_msg_accountant', why:'The burner: "The accountant keeps asking about the drive."' },
    { id:'b2', text:'"The money left through a charity in Benin."', truth:'corroborated', proof:'n_charity', why:'The trail runs through the Ugbowo Relief Foundation.' },
    { id:'b3', text:'"C.A. is a consultant. A company. I never met a person."', truth:'corroborated', proof:'reg_ca', why:'C.A. Consulting Services Ltd exists on paper, with a nominee director.' },
  ]},
  { id:'st_ehigie', who:'MRS. EHIGIE', art:'ehigie_neutral', role:"Osas's mother", needs:'m7', claims:[
    { id:'h1', text:'"They always call at seven. Never late."', truth:'corroborated', proof:'kc_call_control', why:"CONTROL's calls to KC land at 19:00 too. Same habit." },
    { id:'h2', text:'"The voice was changed. I could not tell you man or woman."', truth:'corroborated', proof:'fin_recording', why:'The recording uses a pitch changer. She was right not to guess.' },
    { id:'h3', text:'"Osas was never in any trouble. He reads, he comes home."', truth:'mistaken', proof:'bu_msg_student', why:"Osas had found a file someone wanted back. He didn't tell his mother." },
  ]},
];
const VERDICTS = [
  { id:'corroborated', lbl:'CORROBORATED' }, { id:'contradicted', lbl:'CONTRADICTED' },
  { id:'mistaken', lbl:'HONEST MISTAKE' }, { id:'unverified', lbl:'UNVERIFIED' },
];

/* ---- 7. Warrants: when you ask, what you ask with, and who hears about it ---- */
const WARRANTS = [
  { id:'w_lekki', name:'Search warrant — Obi residence, Lekki', court:'Magistrate, Ikeja', before:'m3', need:7,
    basis:['theory:t_money','theory:t_sims','phishing_template','kc_sims','kc_ph_gate','kc_bank_150k','kc_msg_control'], closeOnPlan:true,
    leak:'Chief Obi hears from a court clerk. The wipe will start faster.',
    without:'Lekki evidence is taken without a warrant. The defence will call it an unlawful search.' },
  { id:'w_cdr', name:'Production order — Ugbowo cell records', court:'Federal High Court, Benin', before:'m7', need:7,
    basis:['theory:t_route','ransom_ledger','musa_statement','asaba_sims','bu_ping_ugbowo','bu_contacts'],
    leak:'The network rotates its handsets. Your trace window at the mast will be shorter.',
    without:'Tower data is pulled without a court order. It will be challenged.' },
  { id:'w_eko', name:'Search & arrest warrant — the house in Ekosodin', court:'Magistrate, Benin', before:'m8', need:6, routed:true,
    basis:['theory:t_voice','tower_fix','tower_cdr','bu_ph_gate','bu_msg_student','lead_caretaker'],
    leak:'The application circulates. Whoever holds Osas may hear.',
    without:"You'll go in on exigency — a hostage inside. Lawful, but the defence will test it." },
];

/* ---- 8. The weekly briefing with Commander Adaeze ----
   Two of three leads per week. Her advice is sometimes honest and sometimes
   the exact lead that would lead to her. buries:true marks the second kind. */
const BRIEFINGS = {
  // Week 1: after Night Shift, in person at Lagos HQ, before the "BENIN BYPASS · TWO DAYS LATER" card
  m3: { week:1, before:'m4', card:'BENIN BYPASS', title:'BRIEFING · AFTER LEKKI', intro:"Good work at the mansion. Three things on the table. We have the bodies for two.",
    advice:{ drop:'gatehouse', text:"Leave the gatehouse log. That's days of reading visitors' handwriting. The drives are where the money is.", buries:true },
    leads:[
      { id:'drives', name:'Decrypt the Lekki drives', desc:"Forensics on Chief Obi's laptop and safe drives.", needsAny:['laptop','safe_drives'], blocked:'Nothing was recovered from Lekki to decrypt.',
        res:"The spreadsheet calls it 'route protection': monthly transfers from Bluewater Logistics, initialled 'C.'. You now have a company to follow.", money:['n_bluewater'], intel:10,
        dropped:"The drives sit in the forensics queue for days." },
      { id:'pos', name:'Profile the Ikeja POS cluster', desc:'Three agents cashing out ₦5M a day. Find who feeds them.', call:'gk_pos',
        res:'Odogwu Ventures is the hub. The attendant says the cash leaves in a dark-blue Sienna.', money:['n_odogwu'], reg:['odogwu'], intel:8,
        dropped:'Two of the three POS agents close their stands by morning.' },
      { id:'gatehouse', name:"Pull the Lekki estate's gatehouse log", desc:'Who visited the mansion in the week before the raid.',
        res:'Two nights before the raid: LND-412-KJ, government plates, 23:10–23:40. The estate manager says it is a NACECA motor-pool car. The driver\'s signature is illegible.', flag:'lead_gatehouse', intel:12,
        dropped:"On Tuesday, \"officials\" collected the gatehouse logbook. The estate manager can't say which agency." },
    ]},
  // h4: the same video call as "Go at first light, with Uche"
  m4: { week:2, before:'m5', hub:'h4', title:'BRIEFING · AFTER THE BYPASS', intro:"Before first light — the Anti-Kidnapping Squad is pleased, and so am I. Three things on the table again. We have the bodies for two.",
    custody:{ item:'ransom_ledger', ask:"Send the ransom ledger to my office. I'll take it to the prosecutor myself. It's safer on my desk than in that exhibit room." },
    advice:{ drop:'initial', text:"Skip the 'E.' entries. We know E. is the Engineer. Spend the time on Musa and the registry.", buries:false },
    leads:[
      { id:'musa', name:'Sit down with Musa properly', desc:'His phone, his statement, his story.', needsMission:'m4',
        res:"Musa's phone is now in the desk. Read it against what he told you.", phone:'musa', statement:'st_musa', intel:6,
        dropped:"Musa's phone goes back to his family with his property." },
      { id:'cac', name:'Run Bluewater Logistics through the CAC', desc:'Directors, secretary, address.',
        res:"Bluewater's company secretary is Apex Corporate Services, Suite 4B, Zuma Court, Wuse II. Remember that address.", reg:['bluewater','apex'], intel:8,
        dropped:'Bluewater files a change of address. The old one will still be on record.' },
      { id:'initial', name:"Chase the ledger's 'E.' entries", desc:'Seven pickups initialled E.',
        res:'E. is the Engineer. Seven pickups, all between 02:00 and 03:00. He usually reaches a pickup by 23:00 the night before.', flag:'lead_e', intel:4,
        dropped:'The E. entries stay a pattern without a face. You lose nothing you need.' },
    ]},
  // h5: after the charge sheet, "Go tonight" — NACECA Abuja does the Abuja work, you direct it from Benin
  m5: { week:3, before:'m6', hub:'h5', title:'BRIEFING · AFTER OZALLA', intro:"Before you cross the bridge — one instruction from me. Then Abuja is yours for the afternoon: our people there can work two of these, and you direct them from Benin.",
    order:{ text:"Leave the Engineer alone. He is a registered source. My source. He's how we found Lekki, and he's worth more running than in a cell." },
    advice:{ drop:'undercover', text:"Don't send anyone into Apex with a fake name. It's a lawyer's office. They'll have the badge by lunchtime.", buries:true },
    leads:[
      { id:'stakeout', name:'The Abuja van: Zuma Court', desc:'An Abuja team parks outside Suite 4B this afternoon. You watch the live feed and call it.', needsAny:['reg_bluewater','reg_apex','zuma_cluster'], blocked:'You need an address worth watching first.', game:'stakeout',
        dropped:"Nobody watches Zuma Court that afternoon. Whatever arrived, arrived." },
      { id:'undercover', name:'Put an Abuja officer into Apex, on a wire', desc:'He poses as a client who needs a company, fast. You feed him every answer.', needsAny:['reg_bluewater','reg_apex','zuma_cluster'], blocked:'You need to know where the paperwork is done first.', game:'undercover',
        dropped:"Apex files a new nominee director for C.A. Consulting the same afternoon. Nobody notices." },
      { id:'tunde', name:'Re-interview Tunde', desc:'Read his old tips against what you know now.', statement:'st_tunde', tunde:true, heatMax:70, heatBlocked:"Tunde won't be seen with you. Your Underworld Heat is too high.",
        res:"Tunde's statement is in the desk. Check every claim against your exhibits.", intel:4,
        dropped:"Tunde calls twice. You don't pick up." },
    ]},
  // h6: after "Take Uche. Keep it quiet." — the production order for Ugbowo is decided here (w_cdr)
  m6: { week:4, before:'m7', hub:'h6', title:'BRIEFING · AFTER ASABA', intro:"One more thing — have you heard the radio tonight?",
    press:true, warrant:'w_cdr',
    advice:{ drop:'trustees', text:"Forget the charity's trustees. Charities are a swamp. You'll drown in receipts.", buries:true },
    leads:[
      { id:'burner', name:'Dump the warehouse burner', desc:'The handset found with the SIM packs.', needsAny:['asaba_sims'], blocked:'No handset was recovered in Asaba.', phone:'burner',
        res:'The burner is in the desk. Two contacts. Read everything.', intel:6,
        dropped:'The burner\'s battery dies in an evidence bag. Forensics can still read it — later.' },
      { id:'tobi', name:'Debrief Tobi Onuoha', desc:'The accountant you carried out of the smoke.', needsAny:['asaba_hostage'], blocked:'Tobi did not survive Asaba.', statement:'st_tobi',
        res:"Tobi's statement is in the desk. He says the money went through a charity in Benin.", money:['n_charity'], intel:8,
        dropped:'Tobi goes home to his family. His statement waits.' },
      { id:'trustees', name:"Pull the Foundation's trustee file", desc:'Call the Ugbowo Relief Foundation office.', call:'gk_foundation',
        res:"The trustees are a pastor, a market leader and a retired teacher who has never signed anything. The real signatory 'comes on the first of the month, in a government car'.", reg:['urf','amadi'], flag:'lead_trustees', intel:10,
        dropped:'The Foundation files its annual return late. Nobody asks why.' },
    ]},
  // h7: after "You know where he is. Bring him home." — before the t7 tail, so it names Ekosodin and
  // never the close, the gate or the back way's street. The Ekosodin warrant is decided here (w_eko).
  m7: { week:5, before:'t7', hub:'h7', title:'BRIEFING · BEFORE EKOSODIN', intro:"You have the area. Before the Engineer moves tonight, we choose how you go in.",
    warrant:'w_eko',
    advice:{ drop:'caretaker', text:"Don't waste a call on caretakers. Every caretaker in Ekosodin is somebody's cousin. Follow Tunde's tip.", buries:true },
    leads:[
      { id:'tip', name:"Follow Tunde's tip", desc:'He says he has heard where the boy is.', tip:true, tunde:true },
      { id:'caretaker', name:'Call the caretakers on the Ekosodin closes', desc:'Somebody is renting to a stranger who never turns the generator off.', call:'gk_caretaker',
        res:'A caretaker says a tenant on one of the closes off the UNIBEN fence road paid a year in cash, a government car comes after dark, and the generator man leaves the back way open at nine.', flag:'lead_caretaker', intel:10,
        dropped:'Nobody calls the caretakers. Whatever they know, they keep.' },
      { id:'pattern', name:'Pull the Ekosodin call pattern', desc:'Which handset sleeps in that compound.', needsAny:['tower_cdr','tower_fix'], blocked:'You have no tower data to work from.',
        res:"CONTROL's handset sleeps in the same 300 m as the ransom phone, every night. Same person, two phones.", flag:'lead_pattern', intel:10,
        dropped:'The pattern stays in the raw data.' },
    ]},
};

/* the tip changes with how you've worked: lean on informants and the Voice feeds them.
   " It matches the tower fix." is added only when you hold the tower fix (v13_briefing.js). */
const TIP_TRUE = "Ekosodin boys are talking about a house by the UNIBEN fence where a student is inside and the generator never stops.";
const TIP_FALSE = "Oga, they moved the boy to Uselu. A bungalow behind the filling station, I swear.";

/* ---- 9. Gatekeepers: secretaries, attendants, caretakers ---- */
/* A choice's effect only carries its flag (the dialogue applies it as the line is chosen); its
   reputation cost, `rep`, is applied once by v13_briefing.js with the call's outcome, so a quit
   mid-call can never count it twice. `tag` is shown in Recruit only. */
const GATEKEEPER_DIALOGUE = {
  gk_pos: [
    { speaker:'POS ATTENDANT — COMPUTER VILLAGE', text:'Oga, I no get time o. Na transfer you wan do or na question?',
      textEn:"Sir, I don't have time. Do you want a transfer or are you here to ask questions?",
      choices:[
        { text:'Show the badge. "NACECA. Talk, or we close this stand."', tag:'harsh', effect:{ flag:{ gk_pos:'badge' } }, rep:{ publicTrust:-2 } },
        { text:'"Make I do ₦5,000 withdrawal first. Then we fit talk small."', tag:'savvy', effect:{ flag:{ gk_pos:'custom' } }, rep:{ publicTrust:+2 } },
        { text:'"Good afternoon. I just want to understand who brings the big cash."', tag:'lawful', effect:{ flag:{ gk_pos:'polite' } } },
      ]},
  ],
  gk_pos_badge: [ { speaker:'POS ATTENDANT — COMPUTER VILLAGE', mood:'afraid', text:"I don't know anything, sir. I just work here. The owner is Odogwu. Ask him.", textEn:"I don't know anything, sir. I just work here. The owner is Odogwu. Ask him." } ],
  gk_pos_custom: [ { speaker:'POS ATTENDANT — COMPUTER VILLAGE', text:"Ehen. Since you be customer… Friday evening, one blue Sienna dey come carry the cash. Driver no dey ever come down.", textEn:"Okay. Since you're a customer… every Friday evening a blue Sienna comes for the cash. The driver never gets out." } ],
  gk_pos_polite: [ { speaker:'POS ATTENDANT — COMPUTER VILLAGE', text:"Na Odogwu own the stand. Big cash na Friday. Blue motor. That one na all I fit tell you.", textEn:"Odogwu owns the stand. The big cash comes on Fridays. A blue car. That's all I can tell you." } ],

  gk_foundation: [
    { speaker:'FOUNDATION SECRETARY', text:'Ugbowo Relief Foundation, good morning. Who is calling, please?',
      choices:[
        { text:'"Good morning, ma. I\'m sorry to disturb you — I\'m helping the trustees tidy their annual return."', tag:'savvy', effect:{ flag:{ gk_found:'respect' } } },
        { text:'"NACECA. I need your trustee file by noon."', tag:'harsh', effect:{ flag:{ gk_found:'badge' } }, rep:{ agencyFavour:+1 } },
        { text:'"I\'d like to donate. Who signs for the Foundation?"', tag:'lawful', effect:{ flag:{ gk_found:'donor' } } },
      ]},
  ],
  gk_found_respect: [ { speaker:'FOUNDATION SECRETARY', text:"Ah, thank God somebody is. The pastor never comes. Mrs. Amadi has not signed anything in years — she just lends her name. The real signatory comes on the first of the month. Government car. I only see the back seat." } ],
  gk_found_badge: [ { speaker:'FOUNDATION SECRETARY', mood:'afraid', text:"Our lawyers are Apex Corporate Services. Please call them. I'm not allowed to discuss the trustees." } ],
  gk_found_donor: [ { speaker:'FOUNDATION SECRETARY', text:"God bless you. Donations go to the account directly. Our signatory is… away. Comes once a month. I can send you the account number." } ],

  gk_caretaker: [
    { speaker:'CARETAKER — EKOSODIN', text:'Hello? Who is this?' },
    { speaker:'AGENT KELECHI', portrait:'kelechi', text:"Good evening, sir. I'm asking about a tenant on your close — the one whose generator never stops." },
    { speaker:'CARETAKER — EKOSODIN', text:'[off the phone, in Igbo] Ọ bụ onye uwe ojii. Gwa ya na ọ nweghị onye bi ebe ahụ.',
      textEn:"[off the phone, in Igbo] It's the police. Tell him nobody lives there.",
      choices:[
        { text:'Answer in Igbo: "Nna anyị, ekwela ka ụmụ okorobịa a gbuo nwata."', tag:'savvy', effect:{ flag:{ gk_care:'igbo' } }, rep:{ publicTrust:+2 } },
        { text:'Stay quiet. Let them keep talking.', tag:'lawful', effect:{ flag:{ gk_care:'listen' } } },
        { text:'"Sir, obstruction is an offence. Tell me who lives there."', tag:'harsh', effect:{ flag:{ gk_care:'threat' } } },
      ]},
  ],
  gk_care_igbo: [
    { speaker:'CARETAKER — EKOSODIN', mood:'afraid', text:"[in Igbo] Ị na-asụ Igbo? …Ngwanu. Listen. A tenant on one of the closes off the UNIBEN fence road paid a year in cash. A government car comes after dark. And the generator man leaves the back way open at nine.",
      textEn:"[in Igbo] You speak Igbo? …Alright. Listen. A tenant on one of the closes off the UNIBEN fence road paid a year in cash. A government car comes after dark. And the generator man leaves the back way open at nine." },
    { speaker:'AGENT KELECHI', portrait:'kelechi', text:'(I said: "Father, don\'t let these young men kill a child." It was enough.)' },
  ],
  gk_care_listen: [
    { speaker:'CARETAKER — EKOSODIN', text:"[in Igbo, not to you] Ụgbọala gọọmentị ahụ na-abịa n'abalị. Onye na-elekọta jenerato na-emeghe ọnụ ụzọ azụ n'elekere itoolu.",
      textEn:"[in Igbo, not to you] That government car comes at night. The generator man leaves the back way open at nine." },
    { speaker:'CARETAKER — EKOSODIN', text:'Officer? Nobody lives there. Goodnight.' },
  ],
  gk_care_threat: [ { speaker:'CARETAKER — EKOSODIN', mood:'angry', text:"Then come and arrest me. I don't know any tenant." } ],
};

/* ---- 10. Radio: the world reacting to what you did ---- */
const RADIO_STATION = 'NAIJA PULSE 97.3 FM';
const RADIO_FILLER = [
  'Fuel queues are back on Ikorodu Road this morning. Marketers blame the depot price.',
  'NEPA o! Parts of Surulere have had no light since Saturday. Residents are… patient.',
  'The Super Eagles squad for the qualifier is out. Our phone lines are open. Be respectful.',
  'Traffic: Third Mainland Bridge is moving. Ojota is not. Plan accordingly.',
  'A reminder from your bank: we will NEVER call you to ask for your BVN. Hang up.',
  'Rain expected in Benin City tonight. Ekosodin and Ugbowo, carry umbrella.',
];
const RADIO_RUMOURS = [
  { needs:'m2', text:'Callers say the kidnap ransom calls are coming from Warri. Police have not confirmed.' },
  { needs:'m3', text:'Sources say a Lekki politician\'s house was raided. The Chief\'s lawyers say it was "a misunderstanding".' },
  { needs:'m5', text:'A shrine in Ozalla, raided? The elders are not happy, and neither is the Oba\'s palace.' },
  { needs:'m6', text:'Asaba: a warehouse fire, a rescue, and a lot of questions about who owns that building.' },
];

/* ---- 12. Court: FRN v. Cdr. Adaeze & 2 Ors ---- */
const COURT_COUNTS = [
  { id:'c1', name:'Count 1 — Kidnapping of Osas Ehigie' },
  { id:'c2', name:'Count 2 — Conspiracy' },
  { id:'c3', name:'Count 3 — Money laundering' },
  { id:'c4', name:'Count 4 — Abuse of office' },
];
