// tac_crouch: crouch on every rig, the desktop chip, toggle on the keyboard, hold on touch (DESIGN §5.5, §2.1 minors).
// Run it twice: --w 1280 --h 800 (desktop) and --w 390 --h 844 --touch 1 (touch); it checks what applies to each.
// Owner: Team A.
const T = require('./tactics_lib.cjs');
module.exports = async h => {
  await T.start(h, 'm2', { seed:9 });
  const touch = await h.ev(() => document.body.classList.contains('touch-active'));
  h.log('touch:', touch);

  // ---- the fallback rig (harness default): sneak 1.25 m/s with or without Shift; scale.y 0.55 ----
  const rig = await h.ev(() => {
    const P = ENGINE.player, K = ENGINE.keys;
    const speed = (crouch, shift) => {
      P.position.x = 0; P.position.z = 0; ENGINE.cameraYaw = 0; ENGINE.speedMul = 1; ENGINE._stagger = 0;
      Object.keys(K).forEach(k => { K[k] = false; });
      K.KeyW = true; K.KeyC = crouch; K.ShiftLeft = shift;
      for (let i = 0; i < 60; i++) updatePlayerLegacy(1 / 60);
      const d = Math.hypot(P.position.x, P.position.z);
      Object.keys(K).forEach(k => { K[k] = false; });
      return +d.toFixed(3);
    };
    const out = { skinned:!!P.userData._skinned, walk:speed(false, false), sprint:speed(false, true), crouch:speed(true, false), crouchShift:speed(true, true), mulAfter:ENGINE.speedMul };
    P.scale.y = 1; K.KeyC = true; for (let i = 0; i < 120; i++) updatePlayerLegacy(1 / 60);
    out.scaleY = +(+P.scale.y).toFixed(3); K.KeyC = false;
    for (let i = 0; i < 120; i++) updatePlayerLegacy(1 / 60);
    return out;
  });
  h.log('fallback rig', JSON.stringify(rig));
  h.assert(!rig.skinned, 'the harness runs the fallback rig');
  h.assert(Math.abs(rig.crouch - 1.25) < 0.02 && Math.abs(rig.crouchShift - 1.25) < 0.02, 'crouched: 1.25 m/s, with or without Shift');
  h.assert(Math.abs(rig.walk - 3.0) < 0.02 && Math.abs(rig.sprint - 5.2) < 0.02, 'upright: walk 3.0, sprint 5.2 (unchanged)');
  h.assert(rig.mulAfter === 1, 'ENGINE.speedMul is restored after each crouched step');
  h.assert(Math.abs(rig.scaleY - 0.55) < 0.01, 'the crouched silhouette scales to 0.55: ' + rig.scaleY);

  // ---- the chip: shown only while crouched on desktop, never on touch ----
  const chip = await h.ev(() => {
    const vis = () => { const c = document.getElementById('tac-crouch'); return !!(c && c.classList.contains('show') && getComputedStyle(c).display !== 'none' && getComputedStyle(document.getElementById('tac-chips')).display !== 'none'); };
    const txt = () => { const c = document.getElementById('tac-crouch'); return c ? c.textContent : ''; };
    ENGINE.keys.KeyC = false; __wf.run(0.05); const off = vis();
    SETTINGS.crouch = 'hold'; ENGINE.keys.KeyC = true; __wf.run(0.05); const onHold = vis(), tHold = txt(), svg = !!document.querySelector('#tac-crouch svg.ico');
    SETTINGS.crouch = 'toggle'; __wf.run(0.05); const tToggle = txt();
    ENGINE.keys.KeyC = false; __wf.run(0.05); const off2 = vis();
    SETTINGS.crouch = 'auto';
    return { off, onHold, tHold, tToggle, off2, svg, parent:(document.getElementById('tac-crouch') || {}).parentNode && document.getElementById('tac-crouch').parentNode.id };
  });
  h.log('chip', JSON.stringify(chip));
  h.assert(chip.parent === 'tac-chips', 'the chip lives in TAC.ui.chipRow()');
  if (!touch) {
    h.assert(!chip.off && chip.onHold && !chip.off2, 'desktop: the chip shows only while crouched');
    h.assert(/CROUCHED\s*· release C/.test(chip.tHold) && /CROUCHED\s*· C to stand/.test(chip.tToggle) && chip.svg, 'desktop: [icon] CROUCHED · release C (hold) / · C to stand (toggle)');
  } else {
    h.assert(!chip.off && !chip.onHold && !chip.off2, 'touch: the chip never shows');
  }
  const icon = await h.ev(() => typeof ICONS !== 'undefined' && !!ICONS.crouch && /<svg class="ico/.test(icon('crouch')));
  h.assert(icon, 'ICONS.crouch exists (icon("crouch"))');

  if (!touch) {
    // ---- desktop toggle: C, C up, C alternates; Shift stands you up; the pause menu can't; typing is typing ----
    await h.ev(() => { SETTINGS.crouch = 'toggle'; ENGINE.keys.KeyC = false; document.activeElement && document.activeElement.blur && document.activeElement.blur(); });
    const k = () => h.ev(() => !!ENGINE.keys.KeyC);
    await h.page.keyboard.down('c'); const a1 = await k();
    await h.page.keyboard.up('c'); const a2 = await k();
    await h.page.keyboard.down('c'); const a3 = await k();
    await h.page.keyboard.up('c'); const a4 = await k();
    await h.page.keyboard.down('c'); await h.page.keyboard.up('c'); const a5 = await k();
    h.log('toggle', JSON.stringify([a1, a2, a3, a4, a5]));
    h.assert(a1 === true && a2 === true && a3 === false && a4 === false && a5 === true, 'toggle: keydown C crouches, keyup keeps it, keydown C stands');
    // key repeat is ignored
    const rep = await h.ev(() => { const fire = (type, repeat) => window.dispatchEvent(new KeyboardEvent(type, { code:'KeyC', key:'c', repeat, bubbles:true }));
      const s0 = ENGINE.keys.KeyC; fire('keydown', true); fire('keydown', true); return [s0, ENGINE.keys.KeyC]; });
    h.assert(rep[0] === rep[1], 'held-key repeats are ignored');
    await h.page.keyboard.down('Shift'); const s1 = await k(); await h.page.keyboard.up('Shift');
    h.assert(a5 === true && s1 === false, 'Shift stands you up');
    // C in the pause overlay keeps the toggle
    await h.page.keyboard.down('c'); await h.page.keyboard.up('c');
    const p0 = await k();
    await h.ev(() => togglePause());
    await h.step(200);
    const paused = await h.ev(() => isOverlayOpen());
    await h.page.keyboard.down('c'); await h.page.keyboard.up('c');
    const p1 = await k();
    await h.ev(() => togglePause());
    await h.step(200);
    h.log('pause', JSON.stringify({ p0, paused, p1 }));
    h.assert(p0 === true && paused && p1 === true, 'C in the pause overlay keeps the toggle');
    // typing c in the survey textarea does nothing to the crouch
    await h.ev(() => V12.ptSurvey('tac_test'));
    await h.step(200);
    const before = await k();
    await h.page.keyboard.type('cc c');
    await h.step(50);
    const sv = await h.ev(() => ({ c:!!ENGINE.keys.KeyC, val:document.getElementById('pt-a1').value, focus:document.activeElement && document.activeElement.id }));
    await h.ev(() => document.getElementById('pt-skip').click());
    h.log('survey', JSON.stringify({ before, sv }));
    h.assert(sv.focus === 'pt-a1' && sv.val === 'cc c' && sv.c === before, 'typing c in the survey textarea types and leaves the crouch alone');
    // hold mode (the keyboard default): bindInput is untouched; blur clears a held crouch only
    const hold = await h.ev(() => {
      SETTINGS.crouch = 'auto'; const mode = TAC.crouch.mode();
      const fire = (type) => document.dispatchEvent(new KeyboardEvent(type, { code:'KeyC', key:'c', bubbles:true }));
      fire('keydown'); const down = ENGINE.keys.KeyC; window.dispatchEvent(new Event('blur')); const blurred = ENGINE.keys.KeyC; fire('keyup');
      SETTINGS.crouch = 'toggle'; ENGINE.keys.KeyC = true; window.dispatchEvent(new Event('blur')); const keptToggle = ENGINE.keys.KeyC;
      SETTINGS.crouch = 'auto'; ENGINE.keys.KeyC = false;
      return { mode, down, blurred, keptToggle };
    });
    h.log('hold', JSON.stringify(hold));
    h.assert(hold.mode === 'hold' && hold.down === true && hold.blurred === false && hold.keptToggle === true, 'Auto = hold on a keyboard; blur clears a held crouch, not a toggled one');
  } else {
    // ---- touch: Auto behaves as today (tap toggles); Hold sets KeyC on touchstart, clears it on touchend, and a click doesn't toggle ----
    const rect = await h.ev(() => { const r = document.getElementById('ctx-crouch').getBoundingClientRect(); return { x:r.left + r.width / 2, y:r.top + r.height / 2, w:r.width, h:r.height }; });
    h.log('#ctx-crouch', JSON.stringify(rect));
    h.assert(rect.w >= 44 && rect.h >= 44, 'CROUCH is a ≥ 44 px target');
    const k = () => h.ev(() => ({ c:!!ENGINE.keys.KeyC, on:document.getElementById('ctx-crouch').classList.contains('on') }));
    await h.ev(() => { SETTINGS.crouch = 'auto'; ENGINE.keys.KeyC = false; });
    await h.page.touchscreen.tap(rect.x, rect.y); await h.step(80); const t1 = await k();
    await h.page.touchscreen.tap(rect.x, rect.y); await h.step(80); const t2 = await k();
    h.log('auto taps', JSON.stringify([t1, t2]));
    h.assert(t1.c && t1.on && !t2.c && !t2.on, 'touch Auto: a tap crouches, a tap stands (as today)');
    const hold = await h.ev(() => {
      SETTINGS.crouch = 'hold'; ENGINE.keys.KeyC = false;
      const el = document.getElementById('ctx-crouch'), r = el.getBoundingClientRect();
      const mk = type => { try { const t = new Touch({ identifier:7, target:el, clientX:r.left + 5, clientY:r.top + 5 });
        return new TouchEvent(type, { bubbles:true, cancelable:true, touches:type === 'touchstart' ? [t] : [], targetTouches:type === 'touchstart' ? [t] : [], changedTouches:[t] }); }
        catch (e) { return new Event(type, { bubbles:true }); } };
      el.dispatchEvent(mk('touchstart')); const down = { c:ENGINE.keys.KeyC, on:el.classList.contains('on'), mode:TAC.crouch.mode() };
      el.dispatchEvent(mk('touchend')); const up = { c:ENGINE.keys.KeyC, on:el.classList.contains('on') };
      el.dispatchEvent(mk('touchstart')); el.dispatchEvent(mk('touchcancel')); const cancel = ENGINE.keys.KeyC;
      el.click(); const clicked = ENGINE.keys.KeyC;
      // the other buttons still work: SCAN's click is not blocked
      let scanned = false; const ts = window.triggerScan; window.triggerScan = function(){ scanned = true; }; document.getElementById('ctx-scan').click(); window.triggerScan = ts;
      return { down, up, cancel, clicked, scanned };
    });
    h.log('hold (dispatched)', JSON.stringify(hold));
    h.assert(hold.down.mode === 'hold' && hold.down.c && hold.down.on && !hold.up.c && !hold.up.on && !hold.cancel, 'touch Hold: touchstart sets KeyC, touchend / touchcancel clear it');
    h.assert(!hold.clicked && hold.scanned, 'touch Hold: a click on CROUCH does not toggle; SCAN still works');
    await h.page.touchscreen.tap(rect.x, rect.y); await h.step(80); const t3 = await k();
    h.assert(!t3.c, 'touch Hold: a real tap (touchstart, touchend, click) leaves you standing');
    // the mode is read when the event fires: back to Auto mid-mission, a tap toggles again
    await h.ev(() => { SETTINGS.crouch = 'auto'; });
    await h.page.touchscreen.tap(rect.x, rect.y); await h.step(80); const t4 = await k();
    await h.page.touchscreen.tap(rect.x, rect.y); await h.step(80);
    h.assert(t4.c && t4.on, 'switching back to Auto mid-mission applies at the next tap');
  }
  h.assert(!h.errors.length, 'no page errors');
};
