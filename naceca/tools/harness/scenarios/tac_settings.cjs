// tac_settings: the Crouch row (Auto / Hold / Toggle) after "Hints when stuck"; an old blob without crouch loads as
// 'auto'; the value persists through loadSettings; RESET TO DEFAULTS restores 'auto'; the note is worded per device.
// Owner: Team A.
module.exports = async h => {
  await h.start('m1', { completed:['m0'] });
  const r = await h.ev(() => {
    const out = {};
    // an old settings blob without crouch
    const raw = { music:40, sfx:60, ambient:50, difficulty:'standard', timed:'normal', marker:'on', hints:'on', haptics:'on' };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(raw)); loadSettings();
    out.old = SETTINGS.crouch; out.oldMusic = SETTINGS.music;
    out.default = SETTINGS_DEFAULT.crouch;
    openSettings();
    const row = document.querySelector('#settings-body .set-row[data-key="crouch"]');
    out.row = !!row;
    out.opts = row ? [...row.querySelectorAll('.seg button')].map(b => [b.dataset.v, b.textContent, b.classList.contains('on')]) : [];
    const keys = [...document.querySelectorAll('#settings-body .set-row')].map(r => r.dataset.key);
    out.after = keys[keys.indexOf('crouch') - 1];
    out.note = row && row.querySelector('.set-note') ? row.querySelector('.set-note').textContent : '';
    // choose Toggle, then reload the stored settings
    row.querySelector('.seg button[data-v="toggle"]').click();
    out.stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}').crouch;
    out.mode = TAC.crouch.mode();
    SETTINGS = Object.assign({}, SETTINGS_DEFAULT); loadSettings();
    out.reloaded = SETTINGS.crouch;
    // RESET TO DEFAULTS
    document.getElementById('btn-settings-reset').click();
    out.reset = SETTINGS.crouch;
    const row2 = document.querySelector('#settings-body .set-row[data-key="crouch"]');
    out.resetOn = row2 ? (row2.querySelector('.seg button.on') || {}).dataset.v : null;
    // the note per device
    const touch = document.body.classList.contains('touch-active');
    document.body.classList.add('touch-active'); renderSettings();
    out.noteTouch = document.querySelector('#settings-body .set-row[data-key="crouch"] .set-note').textContent;
    if (!touch) document.body.classList.remove('touch-active');
    document.body.classList.remove('touch-active'); renderSettings();
    out.noteDesk = document.querySelector('#settings-body .set-row[data-key="crouch"] .set-note').textContent;
    if (touch) document.body.classList.add('touch-active');
    closeSettings();
    return out;
  });
  h.log(JSON.stringify(r));
  h.assert(r.default === 'auto' && r.old === 'auto' && r.oldMusic === 40, 'an old settings blob without crouch loads as "auto" (and keeps its own values)');
  h.assert(r.row && JSON.stringify(r.opts.map(o => o[0])) === '["auto","hold","toggle"]' && r.opts.map(o => o[1]).join('|') === 'Auto|Hold|Toggle', 'the Crouch row has three options: Auto / Hold / Toggle');
  h.assert(r.opts.find(o => o[0] === 'auto')[2] === true, 'Auto is selected by default');
  h.assert(r.after === 'hints', 'the row sits right after "Hints when stuck"');
  h.assert(r.stored === 'toggle' && r.mode === 'toggle' && r.reloaded === 'toggle', 'the choice is stored and persists through loadSettings');
  h.assert(r.reset === 'auto' && r.resetOn === 'auto', 'RESET TO DEFAULTS restores "auto"');
  h.assert(/\bC\b/.test(r.noteDesk) && /Shift/.test(r.noteDesk), 'the desktop note names the keys');
  h.assert(/CROUCH/.test(r.noteTouch) && !/\bC\b|Shift/.test(r.noteTouch), 'the touch note names no keys');
  // the Grey Man skill now says what it does to KC and Obi
  const gm = await h.ev(() => { const s = SKILLS.fieldcraft.find(x => x.id === 'greyman'); return { desc:s.desc, where:s.where }; });
  h.log('Grey Man', JSON.stringify(gm));
  h.assert(/watching for you/.test(gm.desc) && /KC at his stand/.test(gm.where) && /Obi's study/.test(gm.where), 'Grey Man: the desc and where name every watcher it slows');
  // the watcher is the one who is slower (rate × 0.65), not the player
  h.assert(gm.desc === "When someone is watching for you, they're slower to notice you." && !/you're slower/.test(gm.desc), 'Grey Man: the desc says the watcher is slower to notice you: ' + gm.desc);
  h.assert(!h.errors.length, 'no page errors');
};
