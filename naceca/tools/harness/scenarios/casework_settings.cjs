// Casework 2: Settings has a "Casework" row (Recruit / Senior Agent) that edits S.game.difficulty,
// and the old Difficulty row is relabelled "Action pace" with its values kept.
module.exports = async h => {
  await h.start('m1', { completed:['m0'] });
  const rows = await h.ev(() => {
    openSettings();
    const rowOf = k => document.querySelector(`#settings-body .set-row[data-key="${k}"]`);
    const cw = rowOf('casework'), ap = rowOf('difficulty');
    return {
      labels:[...document.querySelectorAll('#settings-body .set-label')].map(l => l.childNodes[0].textContent.trim()),
      cw:cw && { label:cw.querySelector('.set-label').childNodes[0].textContent.trim(), opts:[...cw.querySelectorAll('button')].map(b => [b.dataset.v, b.textContent, b.disabled, b.classList.contains('on')]) },
      ap:ap && { label:ap.querySelector('.set-label').childNodes[0].textContent.trim(), note:ap.querySelector('.set-note').textContent, opts:[...ap.querySelectorAll('button')].map(b => b.dataset.v) },
    };
  });
  h.log(rows.cw, rows.ap);
  h.assert(rows.cw && rows.cw.label === 'Casework', 'a Casework row exists');
  h.assert(JSON.stringify(rows.cw.opts.map(o => o[0])) === '["recruit","senior"]' && rows.cw.opts.map(o => o[1]).join('|') === 'Recruit|Senior Agent', 'Casework offers Recruit / Senior Agent');
  h.assert(rows.cw.opts.find(o => o[0] === 'senior')[3] === true, 'Senior Agent is on for a default save');
  h.assert(rows.cw.opts.every(o => o[2] === false), 'Casework is editable during an investigation');
  h.assert(rows.ap && rows.ap.label === 'Action pace' && JSON.stringify(rows.ap.opts) === '["story","standard","hard"]', 'the old Difficulty row is "Action pace" with its values kept');
  h.assert(/Timers, chase speed and minigames/.test(rows.ap.note), 'Action pace says what it controls');
  h.assert(!rows.labels.includes('Difficulty'), 'no second "Difficulty" row');

  // Recruit via Settings
  const pace0 = await h.ev(() => SETTINGS.difficulty);
  let st = await h.ev(() => { document.querySelector('#settings-body .set-row[data-key="casework"] button[data-v="recruit"]').click();
    return { d:S.game.difficulty, cls:document.body.classList.contains('cw-recruit'), pace:SETTINGS.difficulty, stored:JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}').casework }; });
  h.assert(st.d === 'recruit' && st.cls && st.pace === pace0, 'Casework edits S.game.difficulty only, and the body class follows');
  h.assert(st.stored === undefined, 'casework is not written into device settings');
  // Action pace edits SETTINGS only
  st = await h.ev(() => { document.querySelector('#settings-body .set-row[data-key="difficulty"] button[data-v="hard"]').click(); return { d:S.game.difficulty, pace:SETTINGS.difficulty }; });
  h.assert(st.d === 'recruit' && st.pace === 'hard', 'Action pace edits SETTINGS.difficulty only');
  // reset to defaults leaves the investigation's casework alone
  st = await h.ev(() => { document.getElementById('btn-settings-reset').click(); return { d:S.game.difficulty, pace:SETTINGS.difficulty, on:document.querySelector('#settings-body .set-row[data-key="casework"] button.on').dataset.v }; });
  h.assert(st.d === 'recruit' && st.pace === 'standard' && st.on === 'recruit', 'Reset to defaults keeps casework');
  // back to Senior
  st = await h.ev(() => { document.querySelector('#settings-body .set-row[data-key="casework"] button[data-v="senior"]').click(); return { d:S.game.difficulty, cls:document.body.classList.contains('cw-senior') }; });
  h.assert(st.d === 'senior' && st.cls, 'Senior Agent via Settings');
  await h.shot('casework_settings');
  // on the title (no investigation running) the row is shown but locked
  st = await h.ev(() => { closeSettings(); S.game.currentMission = null; openSettings();
    const r = document.querySelector('#settings-body .set-row[data-key="casework"]');
    return { dis:[...r.querySelectorAll('button')].every(b => b.disabled), note:r.querySelector('.set-note').textContent }; });
  h.assert(st.dis && /start an investigation/i.test(st.note), 'Casework is locked with a note when no investigation is running');
  h.log('PASS casework_settings');
};
