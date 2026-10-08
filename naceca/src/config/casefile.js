/* =========================================================================
   NACECA · config/casefile.js
   Auto-extracted from game.js by split_modules.py
   Edit the modules; run build.py to rebuild naceca.html.
   ========================================================================= */
/* ===================== 6. DATA: CASE FILE ENTRIES ===================== */
const CASE_ENTRIES_BASE = [
  { icon:'id', nm:'PERSONNEL FILE — AGENT KELECHI',
    ds:'Age 26. B.Sc. Computer Science, University of Lagos. Two years in a bank fraud-analytics team before NACECA recruited him into the Cyber & Financial Crimes Unit. Posted to Lagos HQ under Cdr. Adaeze.' },
  { icon:'envelope', nm:'WHY HE JOINED',
    ds:'His uncle, a retired headmaster in Enugu, lost his pension to a single "BVN verification" call. Nobody was ever charged. Kelechi kept the call log. He still has it.' },
  { icon:'scales', nm:'THE OATH',
    ds:'"I will follow the evidence, protect the people it touches, and refuse what is offered to look away." Every NACECA officer signs it. Few read it twice.' },
  { icon:'folder', nm:'CASE FILE NACECA-2026/0034 — "Serpent\u2019s Route"',
    ds:'Cybercrime/ransom laundering ring. Suspected linkage between Lagos cyber-syndicate, Edo cash couriers, and Delta riverbank handlers. Political shielding suspected.' },
  { icon:'bank', nm:'POS Agent Cluster — Ikeja',
    ds:'Three agents flagged for cash-outs above ₦5M/day in three-day windows aligned with two known kidnap ransom payouts.' },
  { icon:'phone', nm:'SIM Triplet — "Mama Florence"',
    ds:'Three SIMs registered under a deceased pensioner. All three pinged towers within 800m of the Lekki target mansion.' },
  { icon:'coins', nm:'Wallet 0xE7…91A',
    ds:'Crypto wallet emptied 0.62 BTC into three OTC desks the night before the Ikeja cash-out spike.' },
];
/* Entries store an icon NAME (beta/icons.js); `ico` resolves it to the line-icon
   SVG when a renderer reads it (icons.js loads after config, so nothing calls
   icon() at load time). Renderers can use `${e.ico}` or icon(e.icon). */
CASE_ENTRIES_BASE.forEach(e => Object.defineProperty(e, 'ico', {
  enumerable:true, configurable:true,
  get(){ return typeof icon === 'function' ? icon(e.icon) : ''; },
}));
