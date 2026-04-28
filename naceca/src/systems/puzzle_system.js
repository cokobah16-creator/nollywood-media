/* =========================================================================
   NACECA · systems/puzzle_system.js
   Auto-extracted from game.js by split_modules.py
   Edit the modules; run build.py to rebuild naceca.html.
   ========================================================================= */
/* ===================== 15. PUZZLE SYSTEM ===================== */
function openPuzzle(key, onResolve){
  const P = PUZZLES[key];
  $('#puzzle-title').textContent = P.title;
  $('#puzzle-screen').innerHTML = P.screen;
  $('#puzzle-prompt').innerHTML = P.prompt;
  const ops = $('#puzzle-options'); ops.innerHTML='';
  P.options.forEach((opt,i)=>{
    const b = document.createElement('button');
    b.className = 'puzzle-option';
    b.innerHTML = `${opt.text}<span class="hint">${opt.hint}</span>`;
    b.addEventListener('click', ()=>{
      if(b.dataset._done) return;
      b.dataset._done = '1';
      if(opt.correct){
        sfxComplete();
        b.classList.add('correct');
        applyEffect({integrity:P.onCorrect.integrity, agencyFavour:P.onCorrect.agencyFavour, intel:P.onCorrect.intel});
        toast('CORRECT MATCH','+25 INTEL · +EVIDENCE',1700);
        if(P.onCorrect.evidenceId){
          collectEvidence({id:P.onCorrect.evidenceId, name:'Phishing Template', xp:50});
        }
        setTimeout(()=>{ showOverlay(null); onResolve&&onResolve(true); }, 1300);
      } else {
        sfxFail();
        b.classList.add('wrong');
        applyEffect(P.onWrong);
        toast('NOT THE TEMPLATE','Try again — look for the bank-spoof',1500);
        // re-enable after a moment
        setTimeout(()=>{ b.classList.remove('wrong'); delete b.dataset._done; }, 1200);
      }
    });
    ops.appendChild(b);
  });
  showOverlay('screen-puzzle');
}

