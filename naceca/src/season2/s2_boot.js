/* =========================================================================
   NACECA · v13 boot — the last pieces of Season 2 to load
   The build tag, Season 1's informants coming back the first time a Season 2
   case or office loads, and the season's state on old saves.
   ========================================================================= */
(function(){
'use strict';
const V13 = window.V13;
// the build is v13 (The Case File) with Season 2 on top; the playtest log's V12.version says the same (v13+beta+s2)
const TAG = 'BUILD v13 · THE CASE FILE + SEASON 2';
V13.version = 'v13';
// playtest events carry V12.version: keep the base build's name and add Season 2 to it (v13+beta → v13+beta+s2)
if(window.V12 && !/\+s2$/.test(V12.version || '')) V12.version = V12.version ? V12.version + '+s2' : 'v13+s2';
const tag = ()=>{ const t = document.getElementById('v12-build'); if(t && t.textContent !== TAG) t.textContent = TAG; };
tag();
if(typeof bindExtraMenus === 'function') V13.wrap('bindExtraMenus', orig => function(){ const r = orig.apply(this, arguments); tag(); return r; });
setTimeout(tag, 0); window.addEventListener('load', ()=>setTimeout(tag, 50));

/* Season 1 people who trust Kelechi (KC, Tunde) are on the sources board from the start of Season 2 */
V13.wrap('loadMission', orig => function(id){
  if(V13.isS2(id) || (V13.HUBS && V13.HUBS[id])){
    // Season 1 as it stood when Season 2 began, before anything reads it (the Season 1 sources below, KC's fairness)
    try{ if(V13.s1snapTake) V13.s1snapTake(); }catch(e){ console.warn('[v13] s1 snapshot', e); }
    const s = V13.s2();
    if(!s.s1src){ s.s1src = 1; V13._quietRecruit = true; try{ V13.s1Sources(); }catch(e){ console.warn('[v13] s1 sources', e); } V13._quietRecruit = false; }
  }
  return orig.apply(this, arguments);
});

/* the dialogue-line fields (s2_core.js V13.lineFields) once more, outermost: the case and court hooks wrapped
   after s2_core (s2_court, s2_case11, s2_case13, s2_case13b) then see the line that will really play */
V13.wrap('renderDialogueLine', orig => function(){
  try{ if(V13.lineFields) V13.lineFields(); }catch(e){ console.warn('[v13] line fields', e); }
  return orig.apply(this, arguments);
});
})();
