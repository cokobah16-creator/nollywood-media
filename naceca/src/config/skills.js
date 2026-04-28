/* =========================================================================
   NACECA · config/skills.js
   Auto-extracted from game.js by split_modules.py
   Edit the modules; run build.py to rebuild naceca.html.
   ========================================================================= */
/* ===================== 3. DATA: SKILLS ===================== */
const SKILLS = {
  tactician: [
    { id:'breach',  name:'Breach Expert',     desc:'Faster door breaches, quieter entry, better team positioning.' },
    { id:'squad',   name:'Squad Coordination',desc:'AI teammates obey commands better. Wider command radius.', requires:'breach' },
    { id:'scanner', name:'Tactical Scanner',  desc:'Highlights suspects, exits and danger zones through walls briefly.', requires:'squad' },
    { id:'master_t',name:'Master Tactician',  desc:'Bullet-time planning. See suspect escape paths before the breach.', requires:'scanner' },
  ],
  negotiator: [
    { id:'calm',    name:'Calm Presence',     desc:'Suspects panic less. Civilians settle faster.' },
    { id:'persuade',name:'Persuasion',        desc:'Unlocks extra dialogue choices. Higher interrogation success.', requires:'calm' },
    { id:'crisis',  name:'Crisis Negotiator', desc:'Talk down armed or panicking suspects. Force becomes optional.', requires:'persuade' },
    { id:'master_n',name:'Master Negotiator', desc:'Turn suspects into informants. Unlock hidden case branches.', requires:'crisis' },
  ],
  forensics: [
    { id:'eye',     name:'Evidence Eye',      desc:'Evidence glows subtly when nearby.' },
    { id:'data',    name:'Data Recovery',     desc:'Recover partially wiped devices.', requires:'eye' },
    { id:'crypto',  name:'Crypto Analyst',    desc:'Faster decryption. Trace wallets and transactions.', requires:'data' },
    { id:'master_f',name:'Master Forensics',  desc:'Reveal shell companies, secret ledgers and shadow networks.', requires:'crypto' },
  ],
};

