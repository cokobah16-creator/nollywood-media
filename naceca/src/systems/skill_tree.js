/* =========================================================================
   NACECA · systems/skill_tree.js
   Auto-extracted from game.js by split_modules.py
   Edit the modules; run build.py to rebuild naceca.html.
   ========================================================================= */
/* ===================== 20. SKILL TREE ===================== */
function openSkillTree(){
  $('#skill-points-num').textContent = S.player.skillPoints;
  const cols = $('#skill-cols');
  const branches = [
    {key:'tactician', label:'TACTICIAN', tag:'BREACH · COMMAND · SCANNER'},
    {key:'negotiator',label:'NEGOTIATOR',tag:'CALM · PERSUASION · CRISIS'},
    {key:'forensics', label:'FORENSICS', tag:'EVIDENCE · DATA · CRYPTO'},
  ];
  cols.innerHTML = branches.map(b=>`
    <div class="skill-col ${b.key}">
      <h3>${b.label}</h3>
      <div class="branch-tag">${b.tag}</div>
      ${SKILLS[b.key].map(s=>{
        const unlocked = S.player.skills.includes(s.id);
        const locked = s.requires && !S.player.skills.includes(s.requires);
        return `<div class="skill-node ${unlocked?'unlocked':''} ${locked?'locked':''}" data-sid="${s.id}">
          <div class="name">${s.name}${unlocked?'<span class="check">✔</span>':''}</div>
          <div class="desc">${s.desc}</div>
        </div>`;
      }).join('')}
    </div>`).join('');
  $$('.skill-node').forEach(n=>{
    n.addEventListener('click', ()=>{
      const id = n.dataset.sid;
      if(n.classList.contains('unlocked')) return;
      if(n.classList.contains('locked'))   { toast('LOCKED','Unlock the prerequisite first'); return; }
      if(S.player.skillPoints<=0){ toast('NO SKILL POINTS','Earn XP to gain points'); return; }
      S.player.skillPoints -= 1;
      S.player.skills.push(id);
      toast('SKILL UNLOCKED', id.toUpperCase());
      openSkillTree();
    });
  });
  showOverlay('screen-skills');
}

