/* =========================================================================
   NACECA · v12 Scam or Legit? — a 60-second daily round
   Seven real-world messages a day (the same seven for everyone), built from
   the patterns the campaign is about: fake credit alerts, BVN "updates",
   OTP theft, Ponzi DMs, "new number" family scams. Tap SCAM or LEGIT; each
   card shows its tell. Streaks, best score and a share line for WhatsApp.
   Every brand here is invented.
   ========================================================================= */
(function(){
'use strict';
const V12 = window.V12;

const CARDS = [
  { ch:'SMS', from:'+234 813 220 4471', body:'Crestline Bank: Your BVN is not linked to your NIN. Your account will be BLOCKED in 24hrs. Update now: crestline-bvn-update.com.ng', scam:1, tell:'Banks text from their name, never a mobile number — and never send a link to "update" your BVN.' },
  { ch:'SMS', from:'CrestlineBnk', body:'Debit: NGN4,500.00 POS PURCHASE SHOPRITE LEKKI 14/10 18:22. Bal: NGN62,310.55. Not you? Call the number on the back of your card.', scam:0, tell:'No link and no request. It points you to the number on your own card.' },
  { ch:'WHATSAPP', from:'+234 902 118 3390', body:'Hello my dear, this is Mummy. My phone fell inside water, this is my new number. Abeg send 35k to this account urgently, I go explain later.', scam:1, tell:'"New number" plus urgent money: call the old number first.' },
  { ch:'WHATSAPP', from:'Tunde Plumber', body:'Oga I don reach your gate. The tap part na 3,500. I go show you the receipt when you open.', scam:0, tell:'You called him, he is at your gate, and he offers a receipt.' },
  { ch:'SMS', from:'PayBridge', body:'You have received NGN150,000.00 by mistake from Musa Bello. Kindly reverse to 0123456789 within 1hr to avoid account suspension.', scam:1, tell:'Check your real balance in your own app. If a mistake happened, the bank reverses it — not you.' },
  { ch:'WHATSAPP', from:'Customer (lace order)', body:'I have paid sir, check the alert:\n[ Acct Credited Sucessfully · NGN85,000.00 · Avail Bal: NGN85,000.00 ]', scam:1, tell:'A misspelt screenshot, and the balance equals the payment. Confirm in your own app before you hand over goods.' },
  { ch:'EMAIL', from:'careers@haldenlogistics.ng', body:'Thank you for applying for the Dispatch Coordinator role. Your interview is Thursday at 10am at our office, 14 Allen Avenue, Ikeja. You will not be asked to pay anything at any stage.', scam:0, tell:'A job you applied for, an address you can visit, and no fee.' },
  { ch:'SMS', from:'FG-EMPOWER', body:'Congratulations! You have been selected for the N500,000 Youth Empowerment Grant. Pay N7,500 processing fee to 2034418890 to claim.', scam:1, tell:'You never pay to receive a grant.' },
  { ch:'CALL', from:'"Crestline Fraud Desk"', body:'"We have blocked a suspicious transfer from your account. To cancel it, read me the 6-digit code we just sent to your phone."', scam:1, tell:'Never read out an OTP. The code is what authorises the transfer.' },
  { ch:'SMS', from:'NovaTel', body:'Your 10GB data plan expires in 2 days. Dial *312# to renew. Thank you for choosing NovaTel.', scam:0, tell:'From the network\'s name, no link, no payment details — a code you can check yourself.' },
  { ch:'DM', from:'@forexkingpin_ng', body:'Invest N50k in our forex pool, get N150k back in 7 days. 100% guaranteed! 2,000 happy investors. See the testimonials.', scam:1, tell:'Guaranteed high returns is how a Ponzi scheme talks.' },
  { ch:'SMS', from:'SwiftDrop', body:'Your parcel is held at customs. Pay N2,300 clearing fee to release it: swiftdrop-ng.delivery/pay', scam:1, tell:'A parcel you weren\'t expecting, a small fee, and a look-alike link.' },
  { ch:'SMS', from:'SwiftDrop', body:'Order #48213 is out for delivery today. Your rider is Emeka. Amount due on delivery: N0 (prepaid).', scam:0, tell:'It matches an order you made and asks for nothing.' },
  { ch:'WHATSAPP', from:'+234 701 554 0021', body:'Hi! Sorry, I sent my WhatsApp verification code to your number by mistake. Please forward it to me.', scam:1, tell:'That is YOUR code. Send it and they take over your WhatsApp.' },
  { ch:'DM', from:'QuickNaira Loans', body:'Loan approved in 5 minutes! No BVN, no collateral. Download the QuickNaira app from this link — not on the Play Store yet.', scam:1, tell:'Loan apps from outside the official store harvest your contacts and blackmail you with them.' },
  { ch:'SMS', from:'Estate Gate', body:'Visitor at the gate: Mr. Bayo (food delivery). Reply 1 to allow, 2 to deny.', scam:0, tell:'Expected, local, and it only asks yes or no.' },
  { ch:'WHATSAPP', from:'Mike ❤', body:'My love, I\'m stuck at Lagos airport customs with your gift box. They want $300 before they release it. Send it as gift cards, quick quick.', scam:1, tell:'Gift cards, urgency, and someone you have never met in person.' },
  { ch:'SMS', from:'+234 907 300 1188', body:'Your NIN has been flagged for criminal activity. Call this officer at once to avoid arrest: 0907 300 1188.', scam:1, tell:'No agency threatens arrest by text. Fear plus urgency is the tell.' },
  { ch:'SMS', from:'CrestlineBnk', body:'Your OTP is 448217. Do NOT share this code with anyone, including bank staff. It expires in 5 minutes.', scam:0, tell:'A code you asked for, with a warning not to share it. Just don\'t share it.' },
  { ch:'SMS', from:'NOVATEL-PROMO', body:'Congrats! Your number won N1,000,000 in the NovaTel anniversary draw. Send N5,000 airtime to claim your prize.', scam:1, tell:'You can\'t win a draw you never entered, and you never pay to receive a prize.' },
  { ch:'WHATSAPP', from:'Estate Residents', body:'Water will be off on Saturday from 9am to 1pm for pipe repairs. — Management', scam:0, tell:'Information only. No money, no link.' },
  { ch:'DM', from:'Remote Jobs NG', body:'Earn N20,000 daily just liking YouTube videos! Pay N10,000 registration to start today.', scam:1, tell:'You never pay to get a job.' },
  { ch:'SMS', from:'+234 809 556 2210', body:'Dear customer, your ATM card has expired. Reply with your card number, expiry date and PIN to receive a new one.', scam:1, tell:'Nobody legitimate ever asks for your PIN.' },
  { ch:'SMS', from:'CITYPOWER', body:'Token: 4471-2290-1835-6620-0117 · 45.2 kWh for meter 0451 2219 87 · paid N10,000 at 19:02. Thank you.', scam:0, tell:'It matches a token you just bought and asks for nothing.' },
  { ch:'WHATSAPP', from:'Prophet Elijah (Ministry)', body:'God revealed your breakthrough to me tonight. Sow a seed of N20,000 to this account before midnight and every debt will clear. Tell nobody.', scam:1, tell:'Fraud borrows faith. Urgency plus secrecy is the warning sign.' },
  { ch:'EMAIL', from:'Sgt. James Whitfield', body:'I am a US soldier in Syria. I need a trusted person to help me move $2.5M. You will keep 30% for your help.', scam:1, tell:'The oldest advance-fee story there is.' },
  { ch:'SMS', from:'Mum', body:'Did you get home safe? You didn\'t call. Eat something before work o.', scam:0, tell:'It\'s your mum. Call her.' },
  { ch:'SMS', from:'WhatsApp Support', body:'Your WhatsApp will be deactivated in 24 hours. Click to verify your account: wa-verify.help', scam:1, tell:'WhatsApp doesn\'t send verification links by text.' },
  { ch:'SMS', from:'CrestlineBnk', body:'Card ending 4471 used online: NGN4,400.00 STREAMFLIX. If this wasn\'t you, call the number on the back of your card.', scam:0, tell:'An alert with no link that sends you to your own card\'s number.' },
  { ch:'SMS', from:'+234 812 404 9930', body:'Landlord here. My old account is closed. Pay this year\'s rent to 3012298871 (new account) before Friday.', scam:1, tell:'An account change by text, from a number you don\'t know. Confirm in person first.' },
  { ch:'ALERT', from:'Crestline Mobile', body:'New sign-in to Crestline Mobile on a Tecno phone at 21:14. If this wasn\'t you, call the number on the back of your card.', scam:0, tell:'A security alert that asks you to do nothing except call your bank\'s real number.' },
  { ch:'DM', from:'Crypto Recovery Expert', body:'Lost money to a crypto scam? We recover 100% of your funds. Our fee is 20% upfront.', scam:1, tell:'Recovery scams hunt people who were already scammed once.' },
  { ch:'WHATSAPP', from:'Aunty Ngozi', body:'The wedding is Saturday at 11. Dress code: wine and gold. Come early o!', scam:0, tell:'Family. Wear the wine and gold.' },
  { ch:'DM', from:'Customs Auction Lagos', body:'Customs auction: Toyota Camry 2015, N850,000 only. Pay 50% today to reserve before it goes.', scam:1, tell:'Too cheap, a deposit, and a deadline.' },
  { ch:'EMAIL', from:'IT Support', body:'Your mailbox is full. Log in here within 24 hours or you will lose your messages: mail-quota-update.com', scam:1, tell:'A fake login page with a deadline: phishing.' },
  { ch:'SMS', from:'CrestlineBnk', body:'Dear customer, we will NEVER ask for your PIN, OTP or password by call, SMS or email. Report suspicious messages to the number on your card.', scam:0, tell:'A real bank reminder. It asks for nothing.' },
];
V12.SOL_CARDS = CARDS;
const KEY = 'naceca_sol_v1', ROUND = 7, SECONDS = 60;
const load = ()=>{ try{ return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; }catch(e){ return {}; } };
const save = d => { try{ localStorage.setItem(KEY, JSON.stringify(d)); }catch(e){} };
const dayNo = (d = new Date()) => Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(2026, 0, 1)) / 864e5) + 1;
const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
function deal(seed){
  const r = rng(seed), sh = a => { const b = a.slice(); for(let i = b.length - 1; i > 0; i--){ const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const scams = sh(CARDS.filter(c => c.scam)), legit = sh(CARDS.filter(c => !c.scam));
  const nLegit = 2 + Math.floor(r() * 2);
  return sh(scams.slice(0, ROUND - nLegit).concat(legit.slice(0, nLegit)));
}
V12.solDeal = deal; V12.solDay = dayNo;

V12.openDaily = function(practice){
  let ov = document.getElementById('screen-sol');
  if(!ov){ ov = V12.el('div', 'overlay', ''); ov.id = 'screen-sol'; document.getElementById('game-root').appendChild(ov); }
  const day = dayNo(), store = load();
  const done = store.results && store.results[day];
  if(!practice && done){ result(ov, done, day, store, false); showOverlay('screen-sol'); return; }
  const cards = deal(practice ? (Date.now() & 0x7fffffff) : day * 9973 + 17);
  const R = { i:0, marks:[], left:SECONDS, paused:false, last:performance.now(), raf:0, over:false };
  const key = e => { if(!ov.classList.contains('show') || R.over || R.paused) return; if(e.code === 'KeyS' || e.code === 'ArrowLeft') answer(1); if(e.code === 'KeyL' || e.code === 'ArrowRight') answer(0); };
  const step = now => {
    if(R.over) return;
    R.raf = requestAnimationFrame(step);
    const dt = Math.min(0.1, (now - R.last) / 1000); R.last = now;
    if(!ov.classList.contains('show')){ R.over = true; cancelAnimationFrame(R.raf); return; }
    if(R.paused) return;
    R.left -= dt;
    const bar = ov.querySelector('.sol-time i'); if(bar){ bar.style.width = Math.max(0, R.left / SECONDS * 100) + '%'; bar.parentElement.classList.toggle('low', R.left < 12); }
    const tx = ov.querySelector('.sol-secs'); if(tx) tx.textContent = Math.max(0, Math.ceil(R.left)) + 's';
    if(R.left <= 0){ while(R.marks.length < cards.length) R.marks.push(0); finish(); }
  };
  const card = ()=>{
    const c = cards[R.i];
    ov.innerHTML = `<div class="overlay-bg"></div><div class="sol-frame">
      <div class="sol-head"><div><div class="plan-k">${practice ? 'PRACTICE ROUND' : 'DAILY · #' + day}</div><div class="plan-t">SCAM OR LEGIT?</div></div>
        <div class="sol-meta"><span class="sol-secs">${Math.ceil(R.left)}s</span><span>${R.i + 1}/${cards.length}</span><button class="v12-x" id="sol-x" aria-label="Close">✕</button></div></div>
      <div class="sol-time"><i style="width:${R.left / SECONDS * 100}%"></i></div>
      <div class="sol-card"><div class="sol-ch">${c.ch}</div><div class="sol-from">${V12.esc(c.from)}</div><div class="sol-body">${V12.esc(c.body).replace(/\n/g, '<br>')}</div></div>
      <div class="sol-tell" id="sol-tell"></div>
      <div class="sol-btns"><button class="sol-b scam" id="sol-scam">SCAM</button><button class="sol-b legit" id="sol-legit">LEGIT</button></div>
      <div class="sol-keys">Keys: S = scam · L = legit</div></div>`;
    ov.querySelector('#sol-x').onclick = ()=>{ R.over = true; cancelAnimationFrame(R.raf); document.removeEventListener('keydown', key); showOverlay('screen-title'); };
    ov.querySelector('#sol-scam').onclick = ()=>answer(1);
    ov.querySelector('#sol-legit').onclick = ()=>answer(0);
  };
  const answer = pick => {
    if(R.paused || R.over) return;
    const c = cards[R.i], ok = (pick === 1) === !!c.scam;
    R.marks.push(ok ? 1 : 0); R.paused = true;
    if(ok){ if(typeof sfxComplete === 'function') sfxComplete(); } else { if(typeof sfxFail === 'function') sfxFail(); if(typeof haptic === 'function') haptic(60); }
    const t = ov.querySelector('#sol-tell'); t.className = 'sol-tell show ' + (ok ? 'good' : 'bad');
    t.innerHTML = `<b>${ok ? 'RIGHT' : 'WRONG'} — ${c.scam ? 'SCAM' : 'LEGIT'}.</b> ${c.tell}<button class="btn primary" id="sol-next">${R.i + 1 < cards.length ? 'NEXT ▶' : 'RESULT ▶'}</button>`;
    ov.querySelectorAll('.sol-b').forEach(b => b.disabled = true);
    ov.querySelector('#sol-next').onclick = ()=>{ R.i++; R.paused = false; R.last = performance.now(); if(R.i >= cards.length) finish(); else card(); };
  };
  const finish = ()=>{
    if(R.over) return; R.over = true; cancelAnimationFrame(R.raf); document.removeEventListener('keydown', key);
    const score = R.marks.reduce((a, b) => a + b, 0), res = { score, marks:R.marks, practice:!!practice };
    const st = load(); st.results = st.results || {};
    if(!practice){
      if(st.last === day - 1) st.streak = (st.streak || 0) + 1; else if(st.last !== day) st.streak = 1;
      st.last = day; st.results[day] = res;
    }
    st.best = Math.max(st.best || 0, score); st.played = (st.played || 0) + 1;
    save(st);
    if(score === cards.length && typeof unlock === 'function') unlock('scam_spotter');
    V12.log('daily', { day, score, practice:!!practice });
    result(ov, res, day, st, !!practice);
  };
  document.addEventListener('keydown', key);
  card(); showOverlay('screen-sol');
  R.last = performance.now(); R.raf = requestAnimationFrame(step);
};

function shareText(res, day, st){
  const sq = res.marks.map(m => m ? '🟩' : '🟥').join('');
  const url = V12.shareUrl ? V12.shareUrl() : '';
  return `NACECA · Scam or Legit? ${res.practice ? '(practice)' : '#' + day}\n${res.score}/${res.marks.length}  ${sq}` + (!res.practice && st.streak > 1 ? `\n🔥 ${st.streak}-day streak` : '') + `\nCan you spot the scams?` + (url ? `\n${url}` : '');
}
function result(ov, res, day, st, practice){
  const n = res.marks.length;
  ov.innerHTML = `<div class="overlay-bg"></div><div class="sol-frame sol-res">
    <div class="plan-k">${practice ? 'PRACTICE ROUND' : 'DAILY · #' + day}</div><div class="plan-t">SCAM OR LEGIT?</div>
    <div class="sol-score">${res.score}<span>/${n}</span></div>
    <div class="sol-sq">${res.marks.map(m => `<i class="${m ? 'g' : 'r'}"></i>`).join('')}</div>
    <div class="sol-stats"><span>STREAK <b>${st.streak || 0}</b></span><span>BEST <b>${st.best || 0}/${n}</b></span><span>PLAYED <b>${st.played || 0}</b></span></div>
    <p class="ops-p">${res.score === n ? 'Not one got past you.' : res.score >= n - 2 ? 'Sharp. The ones you missed are the ones that catch real people.' : 'The scammers are counting on exactly these.'}${practice ? '' : ' A new round arrives tomorrow.'}</p>
    <div class="sol-actions"><button class="btn primary" id="sol-share">SHARE</button><button class="btn" id="sol-again">PRACTICE ROUND</button><button class="btn ghost" id="sol-back">◀ BACK</button></div></div>`;
  ov.querySelector('#sol-share').onclick = ()=>V12.shareTextOut(shareText(res, day, st));
  ov.querySelector('#sol-again').onclick = ()=>V12.openDaily(true);
  ov.querySelector('#sol-back').onclick = ()=>showOverlay('screen-title');
}

})();
