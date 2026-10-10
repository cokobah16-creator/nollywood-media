/* =========================================================================
   NACECA · v12 Phase 2 — the memory ledger
   One place that knows what Kelechi did and who was there to see it. The
   hubs, the phone, the street and the finale all ask it the same
   questions: how did you treat KC, did you protect Musa, did you bring
   Tobi out, did you keep your word to Mrs. Ehigie — and what does Uche,
   who has watched all of it, think of you now.
   ========================================================================= */
(function(){
'use strict';
const V12 = window.V12;

V12.mem = function(){
  if(!S.game.mem || typeof S.game.mem !== 'object') S.game.mem = {};
  const m = S.game.mem;
  for(const k of ['street', 'hubs', 'phone', 'reply', 'seen']) if(!m[k] || typeof m[k] !== 'object') m[k] = {};
  return m;
};

const MC = ()=>S.game.moralChoices || {};
const FL = ()=>S.game.flags || {};
const sideDone = (mid, qid)=>!!(S.game.sideBest && S.game.sideBest[mid] && S.game.sideBest[mid][qid]);

/* what happened to each person Kelechi met */
V12.who = {
  kc(){ const m = MC(); if(m.market_runner === 'escaped') return 'escaped'; if(m.market_runner !== 'caught') return null;
        return m.choice === 'force' ? 'forced' : m.choice === 'flip' ? 'flipped' : 'detained'; },
  kcFair(){ return typeof kcIsFair === 'function' ? kcIsFair() : ['flipped', 'detained'].includes(V12.who.kc()); },
  bisi(){ return sideDone('m2', 'm2_alert'); },
  obi(){ return MC().arrest || null; },              // professional | forceful | bribe | informant
  child(){ return !!FL().child_gentle; },
  musa(){ return MC().checkpoint || null; },         // arrest_driver | flip_driver | tail_driver
  musaTalked(){ return typeof musaGaveTip === 'function' ? (!!FL().musa_tip || MC().checkpoint === 'flip_driver') : MC().checkpoint === 'flip_driver'; },
  shrine(){ return MC().shrine || null; },           // negotiate | force | leave
  tobi(){ return MC().asaba || null; },              // rescue | chase | failed
  tower(){ return MC().tower || null; },             // hold | backup | extract | cut_*
  promised(){ return MC().tower_promise === true; },
  metEhigie(){ return V12.started('m7') && (sideDone('m7', 'm7_mother') || MC().tower_promise != null); },
  heardOsas(){ return V12.hasEv('osas_voicemail'); },
};

/* Uche keeps score. Not of arrests — of how you made them. */
V12.ucheTrust = function(){
  const m = MC(), f = FL(), mem = V12.mem();
  let t = 50;
  if(m.choice === 'flip') t += 4;
  if(m.choice === 'force') t -= 8;
  if(m.arrest === 'professional') t += 8;
  if(m.arrest === 'informant') t += 4;
  if(m.arrest === 'forceful') t -= 6;
  if(m.arrest === 'bribe') t -= 25;
  if(f.child_gentle) t += 5;
  const plan = S.game._plan;
  if(plan && plan.known && plan.known.suspects && plan.known.laptop) t += 4;
  if(plan && plan.entry === 'loud') t -= 3;
  if(m.checkpoint === 'flip_driver' || m.checkpoint === 'tail_driver') t += 3;
  if(m.shrine === 'negotiate') t += 4;
  if(m.shrine === 'force') t -= 6;
  if(m.asaba === 'rescue') t += 6;
  if(m.asaba === 'failed') t -= 4;
  if(m.tower === 'extract' || m.tower === 'cut_extract') t += 4;
  if(mem.reply.musa_protect === 'car') t += 3;
  if(mem.street.levy === 'warned' || mem.street.ponzi === 'warned') t += 1;
  t -= Math.max(0, (S.game.forceUsed || 0) - 1) * 3;
  return Math.max(0, Math.min(100, Math.round(t)));
};
V12.ucheTier = ()=>{ const t = V12.ucheTrust(); return t >= 66 ? 'high' : t >= 40 ? 'mid' : 'low'; };

/* street stories and phone replies are remembered by id */
V12.street = (id, outcome)=>{ const m = V12.mem(); if(outcome !== undefined){ m.street[id] = outcome; V12.log('street', { id, outcome }); } return m.street[id]; };
V12.reply = (id, choice)=>{ const m = V12.mem(); if(choice !== undefined){ m.reply[id] = choice; V12.log('reply', { id, choice }); } return m.reply[id]; };

/* ---------- consequences that reach the finale ---------- */

/* the back gate opens for anyone who learned when the generator boy leaves it:
   Musa on the record, or the bread seller on Akintola Close */
V12.wrap('musaGaveTip', orig => function(){ return orig.apply(this, arguments) || !!FL().backgate_tip; });
V12.wrap('startDialogue', orig => function(key){
  try{
    if(key === 'fin_back' && DIALOGUE.fin_back && DIALOGUE.fin_back[0]){
      const line = DIALOGUE.fin_back[0];
      if(!line._musa) line._musa = line.text;
      line.text = (MC().checkpoint === 'flip_driver' || FL().musa_tip) ? line._musa
        : FL().backgate_src === 'car' ? 'That boy with the jerrycan — nine o\'clock fuel run, and he leaves the chain hanging… There.'
        : FL().backgate_src === 'caretaker' ? 'The caretaker said the generator man leaves this back way open at nine… He was right.'
        : 'Mama Blessing said the generator boy takes this chain off at nine to buy fuel… She was right.';
    }
  }catch(e){}
  return orig.apply(this, arguments);
});

/* Musa's statement only holds if somebody kept him safe */
V12.musaHolds = ()=>V12.reply('musa_protect') !== 'advice';
V12.applyMusaConsequence = function(){
  if(V12.who.musa() !== 'flip_driver') return;
  if(V12.reply('musa_protect') === 'advice'){
    S.game.evQ = S.game.evQ || {};
    if(V12.hasEv('musa_record')) S.game.evQ.musa_record = 'weak';
    if(V12.hasEv('musa_statement')) S.game.evQ.musa_statement = 'weak';
  }
};
if(V12.WHY_NOT){
  V12.WHY_NOT.musa_record = 'Musa withdrew his statement after they beat his brother.';
  V12.WHY_NOT.musa_statement = 'Musa withdrew his statement after they beat his brother.';
  V12.WHY_NOT.tail_plate = 'It ties the Engineer to the tower contract. Not to the Voice.';
  V12.WHY_NOT.efe_statement = 'It proves the payroll moves dirty money. Not who runs it.';
}

/* a quick read of the ledger for testing and for the playtest log */
V12.memSummary = ()=>({ kc:V12.who.kc(), bisi:V12.who.bisi(), obi:V12.who.obi(), musa:V12.who.musa(), shrine:V12.who.shrine(),
  tobi:V12.who.tobi(), tower:V12.who.tower(), promised:V12.who.promised(), uche:V12.ucheTrust(), street:Object.assign({}, V12.mem().street),
  reply:Object.assign({}, V12.mem().reply), hubs:Object.keys(V12.mem().hubs) });

})();
