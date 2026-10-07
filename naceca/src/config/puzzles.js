/* =========================================================================
   NACECA · config/puzzles.js
   Auto-extracted from game.js by split_modules.py
   Edit the modules; run build.py to rebuild naceca.html.
   ========================================================================= */
/* ===================== 5. DATA: PUZZLES ===================== */
const PUZZLES = {
  market_phone_scan: {
    title:'PHONE FORENSIC SCAN',
    screen:
`<span class="label">[ DEVICE: Tecno SP-7 · IMEI 86-***-21 ]</span>
<span class="label">[ EXTRACTION 84% ]</span>

INBOX (last 24h)
─────────────────────────────────────
From: <span class="green">Family Group</span>     "Mama don land! Pick her at MM2"
From: <span class="red">+1-415-***-09</span>     "Dear customer, your acct will be suspended. Click: hxxp://crestline-secure-verify.co/login"
From: <span class="green">Funke ❤</span>           "Send me 5k abeg, weekend money finished"
From: <span class="red">UNKNOWN-BANK</span>        "ATTN: Re-validate BVN. Reply with full DOB+PIN. Urgent."
From: <span class="green">Ola Mechanic</span>      "Boss your car ready. Come carry am."

GALLERY · 3 IMAGES
─────────────────────────────────────
IMG_001.jpg — Copy of the Crestline Bank login page (FAKE)
IMG_002.jpg — List of Nigerian phone numbers, 200+ rows
IMG_003.jpg — Family wedding photo
`,
    prompt:`Identify the <b>phishing template</b> being staged from this device. The pattern Kelechi was briefed on: <em>spoofed bank, BVN harvesting, urgency tone</em>.`,
    options:[
      { text:'The "Mama don land" SMS from Family Group', hint:'Casual, named contact, no link.', correct:false },
      { text:'The Funke ❤ money request', hint:'Personal, small sum, no bank pretext.', correct:false },
      { text:'The +1-415 "acct will be suspended" SMS', hint:'Foreign sender, bank-spoof URL with hxxp:// disguise, urgency.', correct:true },
      { text:'The Ola Mechanic message', hint:'Legitimate trade message.', correct:false },
    ],
    onCorrect:{ intel:+25, integrity:+3, agencyFavour:+5, evidenceId:'phishing_template', evidenceName:'Phishing Template' },
    onWrong:  { integrity:-2, agencyFavour:-3 }
  },

  checkpoint_manifest: {
    title:'CARGO MANIFEST VERIFICATION',
    screen:
`<span class="label">[ DOCUMENT: WAYBILL #KN-2026-04481 ]</span>
<span class="label">[ ROUTE: KANO → SAPELE · ETA 14h ]</span>

CONSIGNEE         : <span class="green">DELTA RIVERSIDE ABATTOIR LTD</span>
CONSIGNOR         : <span class="green">ALH. RABIU MUKHTAR (KANO)</span>
LIVESTOCK COUNT   : <span class="green">42 HEAD · WHITE FULANI</span>
WEIGHT (DECLARED) : <span class="red">9,400 kg</span>
WEIGHT (BRIDGE)   : <span class="red">11,820 kg</span>      ← discrepancy +2,420 kg

PLATE             : <span class="green">XB-227-ABJ</span>
ENGINE NO.        : <span class="green">5KGE-002441</span>
INSURANCE STAMP   : <span class="red">EXPIRED 2025-08-12</span>

CONTAINER SEAL # ON DOC : <span class="red">SL-44882</span>
CONTAINER SEAL # ON TRUCK: <span class="red">SL-44912</span>      ← MISMATCH
`,
    prompt:`The cargo manifest doesn't match the truck. Pick the <b>strongest single anomaly</b> that gives you legal grounds to open the back compartment.`,
    options:[
      { text:'Driver looked nervous', hint:'Subjective. A defense lawyer eats this for breakfast.', correct:false },
      { text:'Insurance stamp is expired', hint:'A fine-able offence, but not a search trigger.', correct:false },
      { text:'Container seal numbers do not match', hint:'A broken/replaced seal is statutory probable cause to inspect cargo.', correct:true },
      { text:'The plate is from Abuja not Kano', hint:'Plates are portable. Not in itself suspicious.', correct:false },
    ],
    onCorrect:{ intel:+30, integrity:+5, agencyFavour:+5, evidenceId:'broken_seal', evidenceName:'Mismatched Container Seal' },
    onWrong:  { integrity:-3, agencyFavour:-2 }
  },

  tower_call_trace: {
    title:'CALL TRACE · SECTOR TIMING',
    screen:
`<span class="label">[ BTS: UGB-EDO-0417 · UGBOWO ]   [ BACKHAUL: DEGRADED · GEN POWER ]</span>
<span class="label">[ TARGET: IMEI 35-***-88 · 4 RANSOM CALLS · 19:02–19:41 ]</span>

SECTOR   AZIMUTH   TIMING ADV   RANGE BAND     SIGNAL
─────────────────────────────────────────────────────
A        030°      <span class="green">TA 9</span>         <span class="green">~5.0 km</span>        <span class="green">STRONG</span>   (north)
B        150°      <span class="red">TA 2</span>         <span class="red">~1.1 km</span>        <span class="red">WEAK</span>     (south-east)
C        270°      TA 14        ~7.7 km        <span class="red">NONE</span>     (west)

HANDOVER LOG
─────────────────────────────────────────────────────
19:38  UGB-0417-A  →  <span class="green">EKO-0122</span>  (Ekosodin micro-cell)
19:41  call dropped on battery sag · handset last seen on EKO-0122
`,
    prompt:`Three sectors see the handset differently. Pick the <b>only location consistent with every reading</b> — the strong sector, the range band and the handover.`,
    options:[
      { text:'UNIBEN Hall 3 hostel, south-east of the mast', hint:'Sector B points there, but it reads weak and far too close for TA 9.', correct:false },
      { text:'Isihor junction market, west on the Lagos road', hint:'Sector C faces west and sees nothing at all.', correct:false },
      { text:'Ekosodin, north of the campus fence', hint:'Sector A is strong at ~5 km north, and the handset handed over to the Ekosodin micro-cell.', correct:true },
      { text:'The filling station on Ugbowo–Lagos Road', hint:'South-west. No sector reads strong in that direction.', correct:false },
    ],
    onCorrect:{ intel:+28, integrity:+3, agencyFavour:+6, evidenceId:'tower_cdr', evidenceName:'Call Records — Ugbowo Cell (IMEI 35-***-88)', xp:90 },
    onWrong:  { integrity:-2, agencyFavour:-3 },
    toastWrong:'Re-read the sectors — which one is strong, and where did the handset hand over?'
  },

  mansion_safe: {
    title:'WALL SAFE · STUDY',
    screen:
`<span class="label">[ SAFE: 6-DIGIT DIAL · CHIEF OBI · STUDY ]</span>

WHAT'S IN THE STUDY
─────────────────────────────────────
FRAMED PHOTO   "Conferment of the title <span class="green">Akaeze of Umuoji</span>
               on Chief E. Obi — <span class="green">14 July 1986</span>"
DESK DIARY     <span class="red">"safe = the day they gave me my name.
                 big number first, like the Americans write it — no.
                 BIG number first."</span>
GOLD PEN       engraved "To Ada, 22·03·86"
CALENDAR       wife's birthday circled: <span class="green">22 March</span>
`,
    prompt:`Chief Obi wrote himself a reminder. Work out the <b>six digits</b> he set — the date he means, in the order he means.`,
    options:[
      { text:'14 07 86', hint:'The right day, but day-first. His note says the big number goes first.', correct:false },
      { text:'22 03 86', hint:"That's Ada's date. His note is about the day he got his title.", correct:false },
      { text:'86 07 14', hint:'Title day, 14 July 1986, written year-first — the biggest number leads.', correct:true },
      { text:'07 14 86', hint:'Month-first is "like the Americans write it" — the very order he crossed out.', correct:false },
    ],
    onCorrect:{ intel:+20, integrity:+2, agencyFavour:+4, evidenceId:'safe_drives', evidenceName:'Encrypted Hard Drives', xp:120 },
    onWrong:  { agencyFavour:-2 },
    toastWrongTitle:'DIAL RESETS',
    toastWrong:'Read the diary again — whose day, and which number first?'
  },

  checkpoint_lie: {
    title:'STATEMENT vs. DOCUMENTS · DRIVER MUSA',
    screen:
`<span class="label">[ WHAT MUSA TOLD YOU ]</span>
 1. "I dey carry cattle from Kano to Sapele."
 2. "Owner of cattle na one Alhaji for Kano."
 3. "Five years I dey do this road. No problem at all."
 4. "I no know wetin dem put for back-back."

<span class="label">[ WHAT THE PAPERS SAY ]</span>
WAYBILL     route <span class="green">KANO → SAPELE</span> · consignor <span class="green">ALH. RABIU MUKHTAR (KANO)</span>
LICENCE     class E · <span class="red">first issued 11 MAR 2026</span> (FRSC, Kano)
TRUCK       registered to <span class="red">SAPELE HAULAGE NIG. LTD · since 2026</span>
LOGBOOK     <span class="red">3 entries</span> — all in the last 6 months
`,
    prompt:`One of his statements is <b>contradicted by the documents</b>, not just unproven. Put it to him.`,
    options:[
      { text:'1 — Kano to Sapele', hint:'The waybill says exactly that.', correct:false },
      { text:'2 — the Alhaji in Kano', hint:'The consignor is a Kano Alhaji. It checks out.', correct:false },
      { text:'3 — "five years on this road"', hint:'A licence from March and a six-month logbook. He has not driven this road for five years.', correct:true },
      { text:'4 — "I don\'t know what\'s in the back"', hint:'Suspicious, but nothing on paper proves it false. Yet.', correct:false },
    ],
    onCorrect:{ intel:+18, integrity:+3, agencyFavour:+4, evidenceId:'musa_statement', evidenceName:'Musa\'s Statement — Names the Bypass Pickup', xp:110 },
    onWrong:  { publicTrust:-2, agencyFavour:-2 },
    toastWrongTitle:'HE DOESN\'T BLINK',
    toastWrong:'That one holds up. Which claim do the papers actually break?'
  },
};
