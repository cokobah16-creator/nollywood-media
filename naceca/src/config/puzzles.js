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
From: <span class="red">+1-415-***-09</span>     "Dear customer, your acct will be suspended. Click: hxxp://gtb-secure-verify.co/login"
From: <span class="green">Funke ❤</span>           "Send me 5k abeg, weekend money finished"
From: <span class="red">UNKNOWN-BANK</span>        "ATTN: Re-validate BVN. Reply with full DOB+PIN. Urgent."
From: <span class="green">Ola Mechanic</span>      "Boss your car ready. Come carry am."

GALLERY · 3 IMAGES
─────────────────────────────────────
IMG_001.jpg — Generic GTB login page (FAKE BRANDING)
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
    onCorrect:{ intel:+25, integrity:+3, agencyFavour:+5, evidenceId:'phishing_template' },
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
    onCorrect:{ intel:+30, integrity:+5, agencyFavour:+5, evidenceId:'broken_seal' },
    onWrong:  { integrity:-3, agencyFavour:-2 }
  },
};

