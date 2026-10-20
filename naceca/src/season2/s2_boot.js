/* =========================================================================
   NACECA · v13 boot — the last pieces of Season 2 to load
   The build tag, Season 1's informants coming back the first time a Season 2
   case or office loads, and the season's state on old saves.
   ========================================================================= */
(function(){
'use strict';
const V13 = window.V13;
const TAG = 'BUILD v14 · THE CASE FILE + SEASON 2';
V13.version = 'v14';
// playtest events carry V12.version: keep the base build's name and add Season 2 to it (v13+beta → v13+beta+s2)
if(window.V12 && !/\+s2$/.test(V12.version || '')) V12.version = V12.version ? V12.version + '+s2' : 'v14';
const tag = ()=>{ const t = document.getElementById('v12-build'); if(t && t.textContent !== TAG) t.textContent = TAG; };
tag();
if(typeof bindExtraMenus === 'function') V13.wrap('bindExtraMenus', orig => function(){ const r = orig.apply(this, arguments); tag(); return r; });
setTimeout(tag, 0); window.addEventListener('load', ()=>setTimeout(tag, 50));

/* Season 1 people who trust Kelechi (KC, Tunde) are on the sources board from the start of Season 2 */
V13.wrap('loadMission', orig => function(id){
  if(V13.isS2(id) || (V13.HUBS && V13.HUBS[id])){
    const s = V13.s2();
    if(!s.s1src){ s.s1src = 1; V13._quietRecruit = true; try{ V13.s1Sources(); }catch(e){ console.warn('[v13] s1 sources', e); } V13._quietRecruit = false; }
  }
  return orig.apply(this, arguments);
});
})();
