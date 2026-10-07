/* =========================================================================
   NACECA · config/evidence_board.js
   Static data for the Evidence Board overlay (cards + valid links).
   ========================================================================= */

const EB_CARDS = [
  // suspects
  { id:'s_obi',     type:'suspect',  tag:'PRINCIPAL',     name:'"Chief" Obi', meta:'Lekki mansion · cybercrime ringleader', x:6,  y:6 },
  { id:'s_musa',    type:'suspect',  tag:'TRANSPORTER',   name:'Musa',        meta:'Benin Bypass · livestock truck driver',  x:8,  y:25, requires:'m4' },
  { id:'s_voice',   type:'suspect',  tag:'NEGOTIATOR',    name:'"The Voice"', meta:'Ugbowo cell · ransom caller, no name',   x:6,  y:44, requires:'m7' },
  { id:'s_kc',      type:'suspect',  tag:'COURIER',       name:'KC (teen)',   meta:'Ikeja market · SIM mover',               x:10, y:63 },
  { id:'s_mama',    type:'suspect',  tag:'GHOST',         name:'"Mama Florence"', meta:'Deceased pensioner · 3 SIMs',        x:6,  y:82 },
  // evidence
  { id:'e_phish',   type:'evidence', tag:'CYBER',         name:'Phishing Template', meta:'+1-415 BVN spoof', x:44, y:6,  requires:'m2' },
  { id:'e_ledger',  type:'evidence', tag:'PAPER',         name:'Ransom Route Ledger', meta:'Bypass compartment · names+dates', x:30, y:30, requires:'m4' },
  { id:'e_laptop',  type:'evidence', tag:'DEVICE',        name:'Encrypted Laptop',  meta:'Lekki · wipe stopped', x:52, y:36, requires:'m3' },
  { id:'e_cdr',     type:'evidence', tag:'TELECOM',       name:'Ugbowo Call Records', meta:'IMEI 35-***-88 · handover to Ekosodin', x:30, y:54, requires:'m7' },
  { id:'e_wallet',  type:'evidence', tag:'CRYPTO',        name:'Wallet 0xE7…91A',    meta:'0.62 BTC drained pre-cashout',     x:48, y:66 },
  { id:'e_cash',    type:'evidence', tag:'CASH',          name:'₦12.4M Bundles',    meta:'Lekki coffee table',   x:29, y:84, requires:'m3' },
  // locations
  { id:'l_lekki',   type:'location', tag:'NODE',          name:'Lekki Mansion',  meta:'Lagos · Old GRA',              x:78, y:6 },
  { id:'l_ugbowo',  type:'location', tag:'NODE',          name:'Ugbowo Tower',   meta:'Edo · sabotaged mast, UNIBEN gate', x:78, y:30, requires:'m7' },
  { id:'l_market',  type:'location', tag:'NODE',          name:'Ikeja Market',   meta:'Lagos · phishing staging',     x:80, y:54 },
  { id:'l_bypass',  type:'location', tag:'NODE',          name:'Benin Bypass',   meta:'Edo · ransom route',           x:78, y:78, requires:'m4' },
];

const EB_VALID_LINKS = [
  { a:'s_obi',  b:'l_lekki',  intel:12, hint:'principal at his residence' },
  { a:'s_obi',  b:'e_laptop', intel:15, hint:'principal owns the device' },
  { a:'s_obi',  b:'e_wallet', intel:18, hint:'wallet drained into Lekki cashout' },
  { a:'s_kc',   b:'l_market', intel:8,  hint:'courier seen at market' },
  { a:'s_kc',   b:'e_phish',  intel:14, hint:'courier was running the template' },
  { a:'s_musa', b:'l_bypass', intel:10, hint:'driver intercepted on bypass' },
  { a:'s_musa', b:'e_ledger', intel:18, hint:'ledger pulled from his cargo' },
  { a:'s_mama', b:'e_phish',  intel:10, hint:'SIMs registered to dead pensioner used in phishing' },
  { a:'l_lekki',b:'e_cash',   intel:8,  hint:'cash bagged at the mansion' },
  { a:'l_bypass',b:'e_ledger',intel:6,  hint:'ledger location confirms bypass' },
  { a:'s_voice', b:'l_ugbowo', intel:10, hint:'every ransom call pinged the Ugbowo cell' },
  { a:'s_voice', b:'e_cdr',    intel:16, hint:'the negotiator handset sits in the call records' },
  { a:'e_cdr',   b:'l_ugbowo', intel:6,  hint:'records pulled from the tower cabinet' },
  { a:'e_cdr',   b:'s_obi',    intel:12, hint:"the Voice dialled Chief Obi's known number twice" },
];
