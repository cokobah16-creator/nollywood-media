/* =========================================================================
   NACECA · v13 hubs — the desk between Season 2 cases
   Benin after the first three cases, Port Harcourt after the tank farm,
   a borrowed desk in Abuja before the trial and after it. Uche is there;
   so is whoever is carrying the case with him (Commander Okundaye in Benin,
   Barrister Danladi in Port Harcourt and Abuja). The phone has the people
   the last case touched; the sources board has what they heard.
   ========================================================================= */
(function(){
'use strict';
const V12 = window.V12, V13 = window.V13, MC = V13.mc;

V13.HUBS = {
  h9:  { after:'m9',   next:'m10', title:['NACECA FIELD OFFICE', 'BENIN CITY · 14:20'], where:'the NACECA field office in Benin', sub:'Field Office · Benin · 14:20', region:'Edo', look:'day', plaque:'NACECA · BENIN', host:'osagie',
         go:'Drive to Sapele', nextCard:['SAPELE', 'THE WATERSIDE MARKET · THURSDAY NIGHT'] },
  h10: { after:'m10',  next:'m11', title:['NACECA FIELD OFFICE', 'BENIN CITY · 04:10'], where:'the field office in Benin', sub:'Field Office · Benin · 04:10', region:'Edo', look:'late', plaque:'NACECA · BENIN', host:null,
         go:'Go back to the river', nextCard:['THE ETHIOPE CREEKS', 'THE NEXT NIGHT · 01:20'] },
  h11: { after:'m11',  next:'m12', title:['NACECA FIELD OFFICE', 'BENIN CITY · 11:30'], where:'the field office in Benin', sub:'Field Office · Benin · 11:30', region:'Edo', look:'day', plaque:'NACECA · BENIN', host:'osagie',
         go:'Fly to Port Harcourt', nextCard:['PORT HARCOURT', 'THE WATERFRONT · 17:40'] },
  h12: { after:'m12',  next:'m13', title:['NACECA ZONAL OFFICE', 'PORT HARCOURT · 22:10'], where:'the Port Harcourt zonal office', sub:'Zonal Office · Port Harcourt · 22:10', region:'Rivers', look:'night', plaque:'NACECA · PORT HARCOURT', host:'hauwa', wire:true,
         go:'Take the morning flight to Abuja', nextCard:['ABUJA', 'NACECA HEADQUARTERS · 09:50'] },
  h13: { after:'m13b', next:'m14', title:['ABUJA', 'A BORROWED DESK · 07:30'], where:'a borrowed desk in Abuja', sub:'A borrowed desk · Abuja · 07:30', region:'FCT', look:'dawn', plaque:'NACECA · ABUJA', host:'hauwa',
         go:'Go to Court 5 for the conference', nextCard:['FEDERAL HIGH COURT', 'COURT 5 · FRIDAY 8 JANUARY · 18:40'] },
  h14: { after:'m14',  next:'m15', title:['ABUJA', 'THE NIGHT AFTER THE VERDICT'], where:'Abuja, the night after the verdict', sub:'Abuja · 21:40', region:'FCT', look:'night', plaque:'NACECA · ABUJA', host:'osagie',
         go:'Fly to Port Harcourt tonight', nextCard:['THE BONNY RIVER', 'RIVERSTONE JETTY · 23:30'] },
};
V13.HUB_AFTER = { m9:'h9', m10:'h10', m11:'h11', m12:'h12', m13b:'h13', m14:'h14' };
V13.HUB_BEFORE = { m10:'h9', m11:'h10', m12:'h11', m13:'h12', m14:'h13', m15:'h14' };
V13.HUBMUSIC = {};
for(const h in V13.HUBS){ ENV_FOR[h] = 'hq'; V13.HUBMUSIC[h] = 1; }
if(V12.HUB_ORDER) V12.HUB_ORDER.push('m9', 'm10', 'm11', 'm12', 'm13', 'm13b', 'm14', ...Object.keys(V13.HUBS));
const done = h => !!(V13.s2().hubs || {})[h];
V13.hubBefore = function(id){
  if(V13._skipHubs) return false;
  const h = V13.HUB_BEFORE[id]; if(!h || done(h)) return false;
  if(!(S.game.completedMissions || []).includes(V13.HUBS[h].after)) return false;
  loadMission(h); return true;
};

/* ---------- the phone: Season 2 contacts ---------- */
const BOOK = { uche:['Sgt. Uche', 'U', '#5a6a3a'], osagie:['Commander Okundaye', 'IO', '#1b2a4c'], hauwa:['Zainab Danladi (Legal)', 'ZD', '#2a3a6a'], mamakaro:['Mama Karo', 'MK', '#7a2a6a'],
  ejiro:['Ejiro', 'Ej', '#d8b020'], patimi:['Pa Timi', 'PT', '#4a6a8a'], ibinabo:['Chairman Ibinabo', 'CI', '#2a6a8a'], bitrus:['Sgt. (rtd.) Gyang', 'BG', '#4a5232'],
  igbinosa:['Efosa Igbinosa (Forensics)', 'EI', '#6a7a8a'], sotonye:['Sotonye Jumbo', 'SJ', '#8a7a6a'], ife:['Ife Adebayo', 'IA', '#c8a04a'], unknownnumber:['Unknown number', '?', '#B3261E'] };
{ const PB = V13.phonebook(); for(const k in BOOK) if(!PB[k]) PB[k] = { name:BOOK[k][0], ini:BOOK[k][1], col:BOOK[k][2] }; }
/* Season 2's "Unknown number" wears Season 1's unknown-contact stamp (v12_hub.js gives .ph-unk to its own id only) */
if(typeof V12.openPhone === 'function' && !V12.openPhone._s2unk){
  const mark = ov => {
    ov.querySelectorAll('.ph-row[data-id="unknownnumber"] .ph-av').forEach(a => a.classList.add('ph-unk'));
    ov.querySelectorAll('.ph-ch').forEach(h => { const b = h.querySelector('b'), a = h.querySelector('.ph-av'); if(a && b && b.textContent === BOOK.unknownnumber[0]) a.classList.add('ph-unk'); });
  };
  let mo = null;
  const op = V12.openPhone;
  V12.openPhone = function(){
    const r = op.apply(this, arguments);
    try{ const ov = document.getElementById('screen-phone'); if(ov){ mark(ov); if(!mo && typeof MutationObserver === 'function'){ mo = new MutationObserver(()=>mark(ov)); mo.observe(ov, { childList:true, subtree:true }); } } }catch(e){}
    return r;
  };
  V12.openPhone._s2unk = true;
}
const tid = who => String(who).toLowerCase().replace(/[^a-z]/g, '');
const lang = t => (typeof SETTINGS !== 'undefined' && SETTINGS.lang === 'english' && t.textEn) ? t.textEn : t.text;
function deliver(h){
  const H = V13.HUBS[h], s = V13.s2(); s.delivered = s.delivered || {};
  if(s.delivered[h]) return; s.delivered[h] = 1;
  const P = V12.mem().phone;
  for(const m of (V13.PHONE && V13.PHONE['after_' + H.after]) || []){
    if(m.cond){ let ok = false; try{ ok = !!(new Function('S', 'return (' + m.cond + ')'))(S); }catch(e){ ok = false; } if(!ok) continue; }
    const id = tid(m.who); const th = P[id] = P[id] || { msgs:[], unread:0 };
    th.msgs.push({ f:'them', text:lang(m), at:h }); th.unread++; th.last = h;
  }
  V13.deliverTips(H.after);
}
const unread = ()=>Object.values(V12.mem().phone).reduce((a, t)=>a + (t.unread || 0) + (t.pending ? 1 : 0), 0);

/* ---------- what Uche and the host say ---------- */
function ucheLines(h){
  const m = MC(), L = [], say = (text, mood)=>L.push({ speaker:'SGT. UCHE', portrait:'sergeant', mood, text });
  if(h === 'h9'){
    say(m.s2_original === 'kept' ? 'The drive is in Okundaye\'s safe and Abuja is pretending it doesn\'t mind. That is the kind of quiet I don\'t like.' : 'The original flew at six. You and I both know the copy is the one that matters now.');
    say(m.s2_custody === 'unsigned' ? 'And the register says the drive never left the cage. One day a lawyer will ask you about that. Have your answer ready.' : 'Ikpe has your signature in his book. Good. Books outlive all of us.');
    say('Sapele on Thursday. Plain clothes. That means no NACECA cap, sir. I mean it.');
  }
  if(h === 'h10'){
    say(m.s2_statement === 'proper' ? 'Lucky said nothing on camera except "fuel business". Fine. A lawyer in the room is worth ten confessions in a car.'
      : m.s2_statement === 'car' ? 'What Lucky told us in the car is a map, not evidence. Use it to find the creek. Don\'t ever say it to a judge.'
      : m.s2_statement === 'threat' ? 'Sir. About the car. I did what you told me. I won\'t do it again — not because I\'m soft, because it won\'t hold.' : 'The boat went upriver without us. The river remembers where it went. So do the fishermen.');
    say('Pa Timi\'s grandson says the old man will take us in tomorrow night. No engine past the second bend.');
  }
  if(h === 'h11'){
    say(m.s2_camp === 'navy' ? 'The camp is still burning on the news. The fishermen are saying we did that. They\'re not wrong.' : m.s2_camp === 'mass' ? 'Eight boys in the cells for one man\'s diesel. The cells are full and the man is in Port Harcourt.' : 'The boys from the camp went home. Two of them came to the gate this morning to ask if they could be witnesses. I gave them tea.');
    say(m.s2_barge === 'tagged' ? 'The tracker says TEKENA 2 is sitting at a jetty in Port Harcourt. Riverstone\'s jetty. Pack a shirt.' : 'The barge is in the Navy\'s yard. Riverstone will have cleaned their books by now. We go anyway.');
  }
  if(h === 'h12'){
    say(m.s2_warrant === 'went_in' ? 'Barrister Danladi hasn\'t spoken to me since we went in without the warrant. She speaks to you. That\'s worse.' : 'The warrant held. Zainab says it\'s the first thing she\'s framed this year.');
    say('Abuja tomorrow. The DG\'s office sent a car to the airport for you. I\'m driving behind it.');
  }
  if(h === 'h13'){
    say(m.s2_ninth === 'bury' ? 'You took his badge, sir. I watched you put it in your pocket. I\'m still here because I want to see what you do with it.' : m.s2_ninth === 'refuse' ? 'Suspended. I\'ve been suspended twice. The first time I cried. The second time I slept for a week. You\'ll be fine.' : 'Whatever you said on the ninth floor, he heard what he wanted to hear.');
    say(m.s2_bitrus === 'witness' ? 'The old soldier will come to court. He ironed his shirt last night. He told me.' : 'The book is a photograph now. Zainab will have to make it walk into court on its own.');
    say('The trial opens on the eleventh of January. Danladi wants you in Court 5 the Friday before, when it\'s empty, to walk the room. Wear the dark suit on Monday. Don\'t look at the Senator\'s people in the back row.');
  }
  if(h === 'h14'){
    const tr = V13.s2().trial || {};
    say(tr.d1 === 'guilty' ? 'Lucky got seven years. The first thing he said was to ask who would feed his mother\'s goats. People are complicated.' : 'Lucky walked. The SAN shook your hand on the way out. I wanted to break his.');
    // a barge seized in Case 11 is the one at the jetty tonight: say why (canon review CN14)
    if(m.s2_barge === 'seized') say('The Navy let TEKENA 2 go on Tuesday. Riverstone\'s lawyers had a court bond before ours had a file number. She\'s back on the Bonny River.');
    say('Ibinabo\'s boats say the Bonny boat is coming tonight. Whatever is on that barge, the Senator wants it gone before the freeze order lands.');
  }
  return L;
}
function hostLines(h){
  const H = V13.HUBS[h], m = MC(), L = [];
  if(H.host === 'osagie'){
    const say = text => L.push({ speaker:'COMMANDER OKUNDAYE', text });
    if(h === 'h9') say(m.s2_original === 'kept' ? 'Abuja has called my office four times since dawn. I let it ring. When they come for me, it will be on paper, and I will answer on paper.' : 'The drive is on the ninth floor now. Ikpe says the escort signed for it at 05:14. Make the copy count, Kelechi.');
    if(h === 'h11') say('Port Harcourt Zonal will give you a desk. I\'ve asked Barrister Danladi to meet you there — she is the only lawyer in this agency I trust with a door.');
    if(h === 'h14') say(m.s2_original === 'kept' ? 'Maiduguri has waited for me since the ninth floor. I told them I\'d come when this barge is in the inventory. Tonight, then.' : 'Whatever happens on that jetty, write it down the moment it happens. The Senator has lawyers. We have notebooks.');
  }
  if(H.host === 'hauwa'){
    const say = text => L.push({ speaker:'BARRISTER DANLADI', text });
    if(h === 'h12') say('Every exhibit you bring me is a promise you made to a judge you haven\'t met yet. Tonight I count the promises.');
    if(h === 'h13'){ say('Court 5, Justice Bakare. He reads everything. Olaniran-Cole SAN is for the first defendant. He will be charming. Do not be charmed.'); say('Before the trial: certificates, certified copies, the bank. Anything we don\'t fix, he will find. Start one today — we\'ll do the rest on Friday.'); }
  }
  return L;
}

/* ---------- the hub as a case ---------- */
for(const h in V13.HUBS){
  const H = V13.HUBS[h];
  V13.defCase(h, {
    title:H.sub.split(' · ')[0], region:H.region, sub:H.sub, hub:true, card:H.title, ambient:'hq',
    objectives(){
      const L = [{ id:'hb_uche', text:'Talk to Uche' }, { id:'hb_phone', text:'Check your phone' }];
      if(V13.srcList().length) L.push({ id:'hb_src', text:'Check your sources' });
      if(H.wire) L.push({ id:'hb_wire', text:'Commander Okundaye is on the line' });     // the pen is Igbinosa's, and her call, in every save (CN06)
      if(h === 'h13' && V13.court && V13.court.openFixes) L.push({ id:'hb_fix', text:'Prepare the exhibits with Barrister Danladi' });
      L.push({ id:'hb_go', text:H.go });
      return L;
    },
    build(){
      V13.office(H.look, H.plaque);
      deliver(h);
      const R = V13.rt;
      R.uche = V13.person({}, { x:-4.3, z:2.7, rot:2.2 }, { kind:'uche', clip:'folded' });
      V13.talk(R.uche, 'Talk to Uche', it => {
        if(it._done){ V13.toast('SGT. UCHE', '"Go on, sir. I\'m not going anywhere."', 1600); return; }
        const host = hostLines(h);
        V13.run('hub2_uche_run', [ucheLines(h)], ()=>{ it._done = true; V13.used(it); V13.done('hb_uche'); });
      });
      if(H.host){
        R.host = V13.person(H.host, { x:4.6, z:-2.9, rot:-1.0 }, { clip:'idle' });
        const lines = hostLines(h);
        const fixes = h === 'h13' && V13.court && V13.court.openFixes;
        if(lines.length) V13.talk(R.host, H.host === 'osagie' ? 'Talk to Commander Okundaye' : fixes ? 'Prepare the exhibits with Barrister Danladi' : 'Talk to Barrister Danladi', it => {
          if(fixes){
            if(it._done){ V13.court.openFixes(1, ()=>{}, { kicker:'A BORROWED DESK', note:'One thing you can put right today. The rest waits for the conference on Friday.' }); return; }
            V13.run('hub2_host_run', [lines], ()=>V13.court.openFixes(1, ()=>{ it._done = true; V13.used(it); V13.done('hb_fix'); }, { kicker:'A BORROWED DESK', note:'One thing you can put right today. The rest waits for the conference on Friday.' }));
            return;
          }
          V13.run('hub2_host_run', [lines], ()=>V13.used(it));
        }, { optional:!fixes });
      }
      R.phoneIt = V13.spot({ x:0.8, y:1.0, z:-0.4 }, 'Check your phone', it => {
        V12.openPhone(()=>{ if(!unread()){ V13.used(it); V13.done('hb_phone'); } label(); });
      });
      if(V13.srcList().length) R.srcIt = V13.spot({ x:-0.8, y:1.0, z:-0.4 }, 'Check your sources', it => { V13.openSources(()=>{ V13.used(it); V13.done('hb_src'); }); });
      V13.spot({ x:-6.0, y:1.6, z:5.2 }, 'Read the news board', it => { V12.openNews(()=>V13.used(it)); }, { optional:true, range:3.2 });
      if(H.wire){
        // the pen: Mr. Igbinosa built it, and Commander Okundaye offers it on a video call from Benin, in every save
        // (canon review CN06: m13_wire_offer; V13.C.wireOffer() gives the same once Tobi's variant is retired)
        const key = V13.pick('m13_wire_offer') || (V13.C && V13.C.wireOffer && V13.C.wireOffer()) || 'm13_wire_offer';
        const who = null;
        const anchor = (()=>{ const a = new THREE.Object3D(); a.position.set(0, 1.4, -8.4); ENGINE.scene.add(a); return a; })();
        V13.talk(anchor, 'Take Commander Okundaye\'s call', it => {
          if(MC().s2_wire != null){ V13.toast('THE PEN', MC().s2_wire ? 'In your breast pocket. Click it on in the lift.' : 'No wire. Your notebook, then.', 1800); return; }
          const go = ()=>V13.say(key, ()=>{ V13.used(it); V13.done('hb_wire'); });
          if(!who && V12.videoCall){ V12.videoCall(true); V13.say(key, ()=>{ V12.videoCall(false); V13.used(it); V13.done('hb_wire'); }); } else go();
        });
      }
      V13.spot({ x:0, y:1.2, z:8.9 }, H.go, it => {
        if(!V13.objDone('hb_uche')){ V13.toast('NOT YET', 'Talk to Uche first.', 1600); return; }
        if(H.wire && MC().s2_wire == null){ V13.toast('NOT YET', 'Hear what the pen is for first.', 1600); return; }
        V13.done('hb_go'); endHub(h);
      }, { verb:'exit', range:2.8 });
      label();
    },
  });
}
function label(){
  const R = V13.rt; if(!R || !R.phoneIt) return;
  const n = unread(); R.phoneIt.label = n ? `Check your phone (${n} new)` : 'Check your phone';
}
function endHub(h){
  const H = V13.HUBS[h];
  V13.s2().hubs = V13.s2().hubs || {}; V13.s2().hubs[h] = Date.now();
  V12.log('mission_end', { m:h });
  if(typeof saveGame === 'function') saveGame(true);
  showHUD(false); ENGINE.movementEnabled = false; if(typeof stopAmbient === 'function') stopAmbient();
  titleCard(H.nextCard, 2600, ()=>loadMission(H.next));
}
/* hubs open with a title card, not the case-start screen */
V13.wrap('showStartMission', orig => function(id){
  const C = V13.CASES[id];
  if(C && C.card){ titleCard(C.card, 2600, ()=>beginMission(id)); return; }
  return orig.apply(this, arguments);
});
})();
