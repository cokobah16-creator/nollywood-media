/* =========================================================================
   NACECA · systems/state_save.js
   Auto-extracted from game.js by split_modules.py
   Edit the modules; run build.py to rebuild naceca.html.
   ========================================================================= */
/* ===================== 8. SAVE / LOAD ===================== */
function saveGame(){
  try{
    localStorage.setItem(SAVE_KEY, JSON.stringify(S));
    toast('SAVED', 'progress committed to local storage');
  }catch(e){ toast('SAVE FAILED', e.message); }
}
function loadGame(){
  try{
    const raw = localStorage.getItem(SAVE_KEY);
    if(!raw) return false;
    const data = JSON.parse(raw);
    S = Object.assign(defaultState(), data);
    refreshHUD();
    return true;
  }catch(e){ return false; }
}
function eraseSave(){ localStorage.removeItem(SAVE_KEY); toast('SAVE ERASED'); }
function hasSave(){ return !!localStorage.getItem(SAVE_KEY); }

