// tac_hud: the eye, its why-line, the head marker and the chip (DESIGN §3.6, §7.A; foundations §5.2 tac_hud).
// Run at --w 390 --h 844 --touch 1, --w 844 --h 390 --touch 1 and --w 1280 --h 800.
// Owner: Team A.
const T = require('./tactics_lib.cjs');

// in-page: paper checks (palette colours only; no gradient, shadow or filter) and the overlap list
const HELP = `
window.__PAL = ['rgb(233, 220, 192)', 'rgb(28, 28, 26)', 'rgb(11, 110, 79)', 'rgb(179, 38, 30)', 'rgb(107, 107, 99)'];
window.__paper = (el, name) => {
  const bad = [], cs = getComputedStyle(el), pal = c => __PAL.includes(c) || c === 'rgba(0, 0, 0, 0)' || c === 'transparent' || c === 'none';
  if (cs.backgroundImage !== 'none') bad.push(name + ' background-image ' + cs.backgroundImage);
  if (cs.boxShadow !== 'none') bad.push(name + ' box-shadow ' + cs.boxShadow);
  if (cs.filter !== 'none') bad.push(name + ' filter ' + cs.filter);
  if (cs.backdropFilter && cs.backdropFilter !== 'none') bad.push(name + ' backdrop-filter');
  if (cs.textShadow !== 'none') bad.push(name + ' text-shadow');
  if (!pal(cs.backgroundColor)) bad.push(name + ' background ' + cs.backgroundColor);
  if (parseFloat(cs.borderTopWidth) > 0 && !pal(cs.borderTopColor)) bad.push(name + ' border ' + cs.borderTopColor);
  if ((el.textContent || '').trim() && !pal(cs.color)) bad.push(name + ' color ' + cs.color);
  if (el instanceof SVGElement && el.tagName !== 'svg') { const f = cs.fill.replace(/^url.*$/, 'none'); if (!pal(f)) bad.push(name + ' fill ' + cs.fill); if (!pal(cs.stroke)) bad.push(name + ' stroke ' + cs.stroke); }
  return bad;
};
window.__isIcon = (svg, name) => { if (!svg) return false; const t = document.createElement('div'); t.innerHTML = icon(name); return t.firstChild.innerHTML === svg.innerHTML && svg.classList.contains('ico'); };
window.__rect = el => { const r = el.getBoundingClientRect(); return { l:r.left, t:r.top, r:r.right, b:r.bottom, w:r.width, h:r.height }; };
window.__avoid = () => {
  const out = [];
  const add = (sel, el) => { if (!el) return; const r = __rect(el), cs = getComputedStyle(el); if (r.w < 2 || r.h < 2 || cs.visibility === 'hidden' || cs.display === 'none') return; out.push(Object.assign({ sel }, r)); };
  WAY.hudRects(true).forEach(q => { if (['#radio-sub', '#hint-chip.show', '#joystick', '#hud-sprint', '.hud-topright'].includes(q.sel)) out.push({ sel:q.sel, l:q.l, t:q.t, r:q.r, b:q.b }); });
  add('#hud-mission', document.getElementById('hud-mission'));
  add('.minimap', document.querySelector('.minimap'));
  return out;
};
window.__overlaps = () => { const e = __rect(document.getElementById('eye-ind')); return __avoid().filter(q => e.l < q.r && e.r > q.l && e.t < q.b && e.b > q.t).map(q => q.sel); };
window.__inGutter = () => { const e = __rect(document.getElementById('eye-ind')); return e.l >= 16 - 0.5 && e.t >= 16 - 0.5 && e.r <= innerWidth - 16 + 0.5 && e.b <= innerHeight - 16 + 0.5; };
`;

module.exports = async h => {
  await T.deviceMarket(h, { seed:21 });
  await h.ev(src => { eval(src); }, HELP);
  const env = await h.ev(() => ({ W:innerWidth, H:innerHeight, touch:document.body.classList.contains('touch-active') }));
  h.log('viewport', JSON.stringify(env));

  // the eye is in the palette ALWAYS: the courier / car drive it with no TAC watcher
  const base = await h.ev(() => {
    setEye(0.5, 'look');
    const el = document.getElementById('eye-ind');
    const bad = [].concat(...[...el.querySelectorAll('svg > path, svg > rect, svg > circle')].map((n, i) => __paper(n, 'eye shape ' + i)));
    const tacEye = document.body.classList.contains('tac-eye');
    setEye(null);
    return { bad, tacEye };
  });
  h.log('eye without TAC', JSON.stringify(base));
  h.assert(!base.bad.length && !base.tacEye, 'the eye is in the paper palette even when TAC is not driving it: ' + base.bad.join('; '));

  // a test watcher at KC, the projection pinned on screen (the stand-in camera projects nothing)
  await T.capture(h);
  await h.ev(() => {
    window.__pin = { x:Math.round(innerWidth * 0.55), y:Math.round(innerHeight * 0.5) };
    WAY._testProject = () => ({ x:__pin.x, y:__pin.y, behind:false });
    S.game.difficulty = 'senior';
    window.__w = TAC.sight.watch({ id:'kc', enc:'m2_kc', mesh:ENGINE._marketKC, eyeH:1.5, range:{ lit:12, dark:6 }, facing:() => -Math.PI / 2, surface:'on the street' });
    const P = ENGINE.player.position; P.x = 30; P.z = 30; __wf.run(0.5);
  });
  // the desktop pills: shown with no eye
  const pills0 = await h.ev(() => { const c = document.querySelector('.hud-topleft-controls'); return c ? getComputedStyle(c).visibility + '/' + getComputedStyle(c).display : null; });
  // a radio line and a hint chip are up; then he notices you (Senior: no TAC chip)
  await h.ev(() => {
    radioLine('SGT. UCHE', 'He is on his phone again, sir. Go now.', 9000);
    showHint('tac_test_probe', 'A hint chip that is already up', 'A hint chip that is already up', 9000);
    const P = ENGINE.player.position; P.x = 2.5; P.z = 4;
    __wf.run(6, () => __w.state.level === 'notice');
  });
  await h.step(150);
  await h.ev(() => __wf.run(0.1));
  const s1 = await h.ev(() => {
    const el = document.getElementById('eye-ind'), why = el && el.querySelector('.eye-why');
    const mk = document.querySelector('.tac-mark[data-who="kc"]');
    const pills = document.querySelector('.hud-topleft-controls');
    return { show:!!(el && el.classList.contains('show')), tacEye:document.body.classList.contains('tac-eye'), why:why ? why.textContent : null, whyShown:why ? getComputedStyle(why).display : null,
      level:__w.state.level, susp:+__w.state.susp.toFixed(1), top:TAC.sight.top() && TAC.sight.top().why,
      overlaps:__overlaps(), gutter:__inGutter(), eye:__rect(el), avoid:__avoid().map(q => [q.sel, Math.round(q.l), Math.round(q.t), Math.round(q.r), Math.round(q.b)]),
      mark:!!mk, markSvg:!!(mk && __isIcon(mk.querySelector('.tac-mark-ico svg'), 'eye')), markText:mk ? mk.textContent.trim() : null, bar:mk ? __rect(mk.querySelector('.tac-mark-bar')) : null,
      markShown:mk ? getComputedStyle(mk).display : null, fill:mk ? mk.querySelector('.tac-mark-bar i').style.width : null,
      hintTac:!!(S.game._hints && S.game._hints.tac_sight), shownTac:TAC.hintsShown.slice(),
      pills:pills ? getComputedStyle(pills).visibility : null };
  });
  h.log('noticed (Senior)', JSON.stringify(s1));
  h.assert(s1.show && s1.tacEye && s1.level === 'notice', 'the eye shows, body.tac-eye is set');
  h.assert(s1.why && s1.why === s1.top && s1.whyShown === 'block' && /^He can see you/.test(s1.why), '.eye-why shows TAC.sight.top().why: ' + s1.why);
  h.assert(!s1.overlaps.length, 'the eye overlaps none of the radio strip, the mission panel, the minimap, the hint chip, the stick or SPRINT: ' + JSON.stringify(s1.overlaps) + ' eye ' + JSON.stringify(s1.eye));
  h.assert(s1.gutter, 'the eye sits inside a 16 px gutter: ' + JSON.stringify(s1.eye));
  h.assert(s1.mark && s1.markSvg && s1.markText === '' && s1.markShown !== 'none', 'the head marker is an svg.ico (no text glyph)');
  h.assert(s1.bar && Math.round(s1.bar.w) === 44 && Math.round(s1.bar.h) === 6 && parseFloat(s1.fill) > 30, 'the head marker bar is 44 × 6 px and fills with suspicion');
  h.assert(!s1.hintTac && !s1.shownTac.includes('tac_sight'), 'Senior Agent: no tac_sight chip');
  if (!env.touch) {
    h.log('pills', pills0, '→', s1.pills);
    h.assert(/^visible/.test(pills0) && s1.pills === 'hidden', 'desktop: the menu pills hide only while the eye shows');
  }

  // a radio line arriving while the eye shows: the eye moves clear of it within half a second
  await h.ev(() => { clearHint(); clearRadio(); });
  await h.step(600); await h.ev(() => __wf.run(0.1));
  await h.ev(() => radioLine('COMMANDER ADAEZE', 'Kelechi, he is looking straight at you. Hold your position.', 9000));
  await h.step(650); await h.ev(() => __wf.run(0.2));
  const s2 = await h.ev(() => ({ overlaps:__overlaps(), gutter:__inGutter(), eye:__rect(document.getElementById('eye-ind')), radio:__rect(document.getElementById('radio-sub')) }));
  h.log('radio arrives', JSON.stringify(s2));
  h.assert(!s2.overlaps.length && s2.gutter, 'a radio line arriving later: the eye is re-placed clear of it');

  // paper: the eye, the why-line, the marker and (desktop) the chip
  const paper = await h.ev(() => {
    const el = document.getElementById('eye-ind'), mk = document.querySelector('.tac-mark[data-who="kc"]');
    ENGINE.keys.KeyC = true; TAC._crouchChip && TAC._crouchChip();
    const chip = document.getElementById('tac-crouch');
    const list = [[el, 'eye'], [el.querySelector('.eye-why'), 'eye-why'], [mk, 'mark'], [mk.querySelector('.tac-mark-ico'), 'mark icon'], [mk.querySelector('.tac-mark-bar'), 'mark bar'],
      [mk.querySelector('.tac-mark-bar i'), 'mark fill'], [document.getElementById('tac-chips'), 'chip row'], [chip, 'chip']]
      .concat([...el.querySelectorAll('svg > path, svg > rect, svg > circle')].map((n, i) => [n, 'eye shape ' + i]))
      .concat([...mk.querySelectorAll('svg.ico *')].map((n, i) => [n, 'mark svg ' + i]));
    const bad = [].concat(...list.filter(x => x[0]).map(x => __paper(x[0], x[1])));
    const chipShown = chip ? getComputedStyle(chip).display !== 'none' && getComputedStyle(document.getElementById('tac-chips')).display !== 'none' : false;
    const chipRect = chip && chipShown ? __rect(chip) : null;
    ENGINE.keys.KeyC = false; TAC._crouchChip && TAC._crouchChip();
    return { bad, chipShown, chipRect };
  });
  h.log('paper', JSON.stringify(paper));
  h.assert(!paper.bad.length, 'palette colours only, no gradient, shadow or filter: ' + paper.bad.join('; '));
  if (env.touch) h.assert(!paper.chipShown, 'touch: the chip row is hidden');
  else h.assert(paper.chipShown && paper.chipRect.l >= 16 && paper.chipRect.b <= env.H - 16 && paper.chipRect.h >= 32, 'desktop: the crouch chip shows bottom left, inside the gutter');

  // the alarm: icon('alert') on red; the frozen line
  const al = await h.ev(() => { __wf.run(8, () => __w.state.level === 'alarm'); __wf.run(0.1);
    const mk = document.querySelector('.tac-mark[data-who="kc"]');
    return { level:__w.state.level, lv:mk.dataset.level, alert:__isIcon(mk.querySelector('.tac-mark-ico svg'), 'alert'), bg:getComputedStyle(mk.querySelector('.tac-mark-ico')).backgroundColor,
      why:document.querySelector('#eye-ind .eye-why').textContent, whyPast:__w.state.whyPast }; });
  h.log('alarm', JSON.stringify(al));
  h.assert(al.level === 'alarm' && al.lv === 'alarm' && al.alert && al.bg === 'rgb(179, 38, 30)', 'at alarm the marker shows icon("alert") on red');
  h.assert(al.why === al.whyPast && /^He saw you/.test(al.why), 'the why-line freezes in the past tense at alarm');

  // the marker lifts clear of the world label when KC is the action target
  const lift = await h.ev(() => { const it = ENGINE.interactables.find(i => i.label === 'Confront teen suspect'); ENGINE._nearIt = it; updateMarkers();
    const mk = document.querySelector('.tac-mark[data-who="kc"]'); const a = mk.classList.contains('lifted'), ta = mk.style.transform; ENGINE._nearIt = null; updateMarkers(); return { a, ta, b:mk.classList.contains('lifted') }; });
  h.log('lift', JSON.stringify(lift));
  h.assert(lift.a && !lift.b, 'the head marker lifts clear of the world label on the same mesh');

  // reduced motion: no blink, a static red rim
  const rm = await h.ev(() => { document.body.classList.add('reduce-motion'); const el = document.getElementById('eye-ind'); el.classList.add('watching');
    const svg = el.querySelector('svg'), path = el.querySelector('svg > path'); const r = { anim:getComputedStyle(svg).animationName, stroke:getComputedStyle(path).stroke };
    document.body.classList.remove('reduce-motion'); return r; });
  h.log('reduced motion', JSON.stringify(rm));
  h.assert(rm.anim === 'none' && rm.stroke === 'rgb(179, 38, 30)', 'reduced motion: no blink, a static red rim');

  // the eye releases when nobody is suspicious; the pills come back
  const rel = await h.ev(() => { __w.reset(0); const P = ENGINE.player.position; P.x = 30; P.z = 30; __wf.run(0.3);
    const el = document.getElementById('eye-ind'), pills = document.querySelector('.hud-topleft-controls');
    return { show:el.classList.contains('show'), tacEye:document.body.classList.contains('tac-eye'), why:el.querySelector('.eye-why').textContent, inline:el.style.left, pills:pills ? getComputedStyle(pills).visibility : null,
      mark:getComputedStyle(document.querySelector('.tac-mark[data-who="kc"]')).display }; });
  h.log('released', JSON.stringify(rel));
  h.assert(!rel.show && !rel.tacEye && rel.why === '' && rel.inline === '' && rel.mark === 'none', 'calm again: the eye, its line and the marker go; inline placement is cleared');
  if (!env.touch) h.assert(rel.pills === 'visible', 'desktop: the pills are back');

  // the eye yields to the car, the cold open and a tail
  const yl = await h.ev(() => { const P = ENGINE.player.position; P.x = 2.5; P.z = 4; document.body.classList.add('v12-car'); __wf.run(2);
    const inCar = { show:document.getElementById('eye-ind').classList.contains('show'), tacEye:document.body.classList.contains('tac-eye') };
    document.body.classList.remove('v12-car'); __wf.run(0.2);
    return { inCar, after:document.getElementById('eye-ind').classList.contains('show') }; });
  h.log('yield', JSON.stringify(yl));
  h.assert(!yl.inCar.show && !yl.inCar.tacEye && yl.after, 'in the car the eye yields; out of it TAC drives it again');

  // Recruit: the tac_sight chip, once per save, worded for the device
  const rc = await h.ev(() => {
    clearHint(); __w.reset(0); const P = ENGINE.player.position; P.x = 30; P.z = 30; __wf.run(0.5);
    S.game.difficulty = 'recruit';
    P.x = 2.5; P.z = 4; __wf.run(6, () => __w.state.level === 'notice');
    const chip = document.querySelector('#hint-chip.show .hc-text'); const t1 = chip ? chip.textContent : null;
    const whyNow = document.querySelector('#eye-ind .eye-why').textContent;
    const n1 = TAC.hintsShown.filter(k => k === 'tac_sight').length;
    clearHint(); __w.reset(0); P.x = 30; P.z = 30; __wf.run(0.5); P.x = 2.5; P.z = 4; __wf.run(6, () => __w.state.level === 'notice');
    const again = !!document.querySelector('#hint-chip.show');
    S.game.difficulty = 'senior';
    return { t1, n1, again, whyNow, saved:!!(S.game._hints && S.game._hints.tac_sight) };
  });
  h.log('Recruit', JSON.stringify(rc));
  h.assert(rc.n1 === 1 && rc.saved && !rc.again, 'Recruit: the tac_sight chip shows once per save');
  h.assert(/^He can see you/.test(rc.whyNow), 'after reset(0) a new notice reads in the present tense (the alarm line is released): ' + rc.whyNow);
  h.assert(env.touch ? /^Tap CROUCH behind something lower than you/.test(rc.t1) : /^Crouch behind something lower than you, keep people around you, or come at him from behind\.$/.test(rc.t1), 'the chip is worded for the device: ' + rc.t1);
  await h.shot('tac_hud_' + env.W + 'x' + env.H);
  await h.ev(() => { WAY._testProject = null; __w.unwatch(); });
  h.assert(!h.errors.length, 'no page errors');
};
