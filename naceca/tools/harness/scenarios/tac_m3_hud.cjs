// tac_m3_hud: the M3 UI on paper (DESIGN §2.3 C-M12, §3.6). Run at --w 390 --h 844 --touch 1, --w 844 --h 390 --touch 1
// and --w 1280 --h 800. Obi's head marker, the UCHE button (#ctx-uche, its own 66 px button stacked above SCAN) with
// its paper job tag (#ctx-uche-tag), and the desktop Q · UCHE chip pass A.audit (no gradient, shadow, filter or glyph;
// palette; ≥ 44 px on touch); keyboard hints hidden on touch; nothing overlaps the radio strip, the mission panel, the
// minimap, the hint chip, the meters, the stick or SPRINT (WAY.hudRects), nor the centre toast (an alarm's HE SAW YOU
// can be up when COVER HIM is offered).
// Owner: Team C.
const L = require('./tac_m3_lib.cjs');
const A = require('./v13_a_lib.cjs');

const RECTS = `
window.__r = el => { if (!el) return null; const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
  if (r.width < 2 || r.height < 2 || cs.display === 'none' || cs.visibility === 'hidden') return null; return { l:r.left, t:r.top, r:r.right, b:r.bottom, w:r.width, h:r.height }; };
window.__hud = () => {
  const out = [];
  WAY.hudRects(true).forEach(q => { if (['#radio-sub', '#hint-chip.show', '#joystick', '#hud-sprint', '#hud-meters', '.hud-topright', '#hud-pausebtn', '#hud-casebar'].includes(q.sel)) out.push(q); });
  for (const sel of ['#hud-mission-objs', '.minimap', '#ctx-main', '#ctx-scan', '#ctx-crouch', '#toast.show']) { const r = __r(document.querySelector(sel)); if (r) out.push(Object.assign({ sel }, r)); }
  return out;
};
window.__hits = el => { const a = __r(el); if (!a) return null; return __hud().filter(q => a.l < q.r && a.r > q.l && a.t < q.b && a.b > q.t).map(q => q.sel); };
`;

module.exports = async h => {
  const A1 = A.lib(h);
  try {
    // ---------- the UCHE control: TAKE HER OUT at the knock (civilians known), then COVER HIM, then COVERING ----------
    await L.v8(h, { state:L.state('tip') });
    await h.ev(src => { eval(src); }, RECTS);
    const env = await h.ev(() => ({ W:innerWidth, H:innerHeight, touch:document.body.classList.contains('touch-active') }));
    h.log('viewport', JSON.stringify(env));
    await L.breach(h, { entry:'knock' });
    await h.ev(() => { __m3.run(1.2); radioLine('SGT. UCHE', 'The child is in the living room, sir. I can take her.', 9000); showHint('tac_m3_hud_probe', 'A hint chip that is already up', 'A hint chip that is already up', 9000); });
    await h.step(600);
    await h.ev(() => __m3.run(0.1));
    await h.step(100);
    const s1 = await h.ev(() => { const w = document.getElementById('ctx-uche-wrap'), b = document.getElementById('ctx-uche'), tag = document.getElementById('ctx-uche-tag'), chip = document.getElementById('tac-uche');
      return { offer:TAC.m3.offer(), wrap:!!w, btn:__r(b), tag:__r(tag), tagText:tag && tag.textContent, label:b && b.textContent.trim(), ico:!!(b && b.querySelector('svg.ico')),
        chip:__r(chip), chipText:chip && chip.textContent.replace(/\s+/g, ' ').trim(), kbd:chip ? __r(chip.querySelector('.kbd')) : null,
        hitsB:__hits(b), hitsT:__hits(tag), hitsC:__hits(chip), hud:__hud().map(q => [q.sel, Math.round(q.l), Math.round(q.t), Math.round(q.r), Math.round(q.b)]),
        meter:!!document.getElementById('meter-wipe'), meterHits:(() => { const m = __r(document.getElementById('hud-meters')); if (!m) return null;
          return __hud().filter(q => q.sel !== '#hud-meters' && m.l < q.r && m.r > q.l && m.t < q.b && m.b > q.t).map(q => q.sel); })(), radio:!!document.querySelector('#radio-sub.show'), hint:!!document.querySelector('#hint-chip.show'),
        scan:__r(document.getElementById('ctx-scan')) }; });
    h.log('take her out', JSON.stringify(s1));
    h.assert(s1.offer && s1.offer.order === 'take_child' && s1.meter && s1.radio && s1.hint, 'TAKE HER OUT on offer, with the wipe meter, a radio line and a hint chip all up');
    if (env.touch) {
      h.assert(s1.btn && Math.round(s1.btn.w) === 66 && Math.round(s1.btn.h) === 66 && s1.label === 'UCHE' && s1.ico, 'touch: #ctx-uche is a 66 px button labelled UCHE with an icon() svg');
      // upright: the tag to the button's left; on its side: above it (to its left is the centre toast band, REVIEW C-8)
      if (env.H > 480) h.assert(s1.tag && s1.tagText === 'TAKE HER OUT' && s1.tag.r <= s1.btn.l + 1, 'the job sits in a paper tag to its left: ' + s1.tagText);
      else h.assert(s1.tag && s1.tagText === 'TAKE HER OUT' && s1.tag.b <= s1.btn.t + 1 && s1.tag.l >= s1.btn.l - 1, 'landscape: the job sits in a paper tag above the button, flush with its left edge: ' + JSON.stringify(s1.tag));
      h.assert(s1.scan && s1.btn.b <= s1.scan.t + 1 && s1.btn.l < s1.scan.r && s1.btn.r > s1.scan.l - 1, 'stacked above SCAN (not a third button in the row)');
      h.assert(!s1.hitsB.length && !s1.hitsT.length, 'the button and its tag overlap nothing: ' + JSON.stringify({ b:s1.hitsB, t:s1.hitsT }));
      h.assert(s1.meterHits && !s1.meterHits.length, 'the meters (moved up while the button shows on a phone held upright) overlap nothing: ' + JSON.stringify(s1.meterHits));
      h.assert(!s1.chip, 'touch: no desktop chip (keyboard hints hidden on touch)');
      await A1.audit('#ctx-uche-wrap', 'UCHE button + tag');
    } else {
      h.assert(!s1.btn, 'desktop: no touch button');
      h.assert(s1.chip && /Q · UCHE TAKE HER OUT/.test(s1.chipText) && s1.kbd, 'desktop: the chip "Q · UCHE  TAKE HER OUT": ' + s1.chipText);
      h.assert(!s1.hitsC.length, 'the chip overlaps nothing: ' + JSON.stringify(s1.hitsC));
      await A1.audit('#tac-uche', 'Q · UCHE chip');
    }
    // COVER HIM once he runs
    const s2 = await h.ev(() => { const R = TAC.m3.run(); __m3.run(2, () => R.obi.state === 'running' && R.t > 2.6);
      return { offer:TAC.m3.offer() }; });
    // an alarm toast with a two-line why, as on a quiet entry (COVER is offered 1.5 s into its 2.6 s)
    await h.ev(() => toast('HE SAW YOU', 'He saw you walking upright across the living room, 3 m away', 4000));
    await h.step(450);
    const s2b = await h.ev(() => { const b = document.getElementById('ctx-uche'), tag = document.getElementById('ctx-uche-tag'), chip = document.getElementById('tac-uche');
      return { tagText:tag && tag.textContent, hitsB:__hits(b), hitsT:__hits(tag), hitsC:__hits(chip), chipText:chip && chip.textContent.replace(/\s+/g, ' ').trim(), shield:!!(b && b.querySelector('svg.ico')),
        toast:__r(document.querySelector('#toast.show')), tag:__r(tag), btn:__r(b) }; });
    h.log('cover him', JSON.stringify(s2), JSON.stringify(s2b));
    h.assert(s2.offer && s2.offer.order === 'cover', 'COVER HIM on offer once he runs');
    h.assert(!!s2b.toast, 'the alarm toast is up for the overlap check');
    if (env.touch) {
      h.assert(s2b.tagText === 'COVER HIM' && !s2b.hitsB.length && !s2b.hitsT.length, 'touch: the tag reads COVER HIM and overlaps nothing: ' + JSON.stringify(s2b));
      // one tap gives the job
      await h.ev(() => document.getElementById('ctx-uche').click());
      await h.step(100);
      const s3 = await h.ev(() => { const b = document.getElementById('ctx-uche'); return { obi:TAC.m3.obi().state, job:TAC.m3.uche().job, disabled:b.disabled, tag:document.getElementById('ctx-uche-tag').textContent }; });
      h.log('covering', JSON.stringify(s3));
      h.assert(s3.obi === 'handsup' && s3.job === 'cover' && s3.disabled && s3.tag === 'COVERING', 'one tap: covered; the button is disabled and reads COVERING');
      const ord = (await L.ev(h, 'order')).map(e => e[1]);
      h.assert(ord.length === 1 && ord[0].src === 'button' && ord[0].ok, 'order{src:button}');
      await A1.audit('#ctx-uche-wrap', 'UCHE button (busy)');
    } else {
      h.assert(/Q · UCHE COVER HIM/.test(s2b.chipText) && !s2b.hitsC.length, 'desktop: the chip reads COVER HIM');
      // Q gives the job (a capture keydown, ignored in text fields)
      await h.page.keyboard.press('KeyQ');
      await h.step(100);
      const s3 = await h.ev(() => ({ obi:TAC.m3.obi().state, job:TAC.m3.uche().job, chip:document.getElementById('tac-uche').textContent.replace(/\s+/g, ' ').trim() }));
      h.log('Q', JSON.stringify(s3));
      h.assert(s3.obi === 'handsup' && s3.job === 'cover' && /COVERING/.test(s3.chip), 'Q gives the job; the chip reads COVERING');
      const ord = (await L.ev(h, 'order')).map(e => e[1]);
      h.assert(ord.length === 1 && ord[0].src === 'key' && ord[0].ok, 'order{src:key}');
      await A1.audit('#tac-uche', 'Q · UCHE chip (busy)');
    }
    await L.restore(h);

    // ---------- Obi's head marker (quiet entry, noticed) ----------
    await L.v8(h);
    await h.ev(src => { eval(src); }, RECTS);
    await L.breach(h, { entry:'quiet' });
    await h.ev(() => { window.__pin = { x:Math.round(innerWidth * 0.55), y:Math.round(innerHeight * 0.45) }; WAY._testProject = () => ({ x:__pin.x, y:__pin.y, behind:false });
      const R = TAC.m3.run(); __m3.walk([[0.4,4.9],[0.5,2.6],[1.3,1.6]], 1.55, { stop:() => R.w.state.level === 'notice' }); });
    await h.step(300);
    await h.ev(() => __m3.run(0.1));
    const mk = await h.ev(() => { const m = document.querySelector('.tac-mark[data-who="obi"]'); const bar = m && m.querySelector('.tac-mark-bar');
      return { mark:__r(m), bar:__r(bar), svg:!!(m && m.querySelector('svg.ico')), text:m ? m.textContent.trim() : null, eye:!!document.querySelector('#eye-ind.show'), why:(document.querySelector('#eye-ind .eye-why') || {}).textContent,
        level:TAC.m3.run().w.state.level }; });
    h.log('head marker', JSON.stringify(mk));
    h.assert(mk.mark && mk.svg && mk.text === '' && mk.bar && Math.round(mk.bar.w) === 44 && Math.round(mk.bar.h) === 6, 'the head marker over Obi: icon() svg, a 44 × 6 bar, no text glyph');
    h.assert(mk.eye && /^He can see you/.test(mk.why || ''), 'the eye and its why-line: ' + mk.why);
    await A1.audit('.tac-mark[data-who="obi"]', "Obi's head marker");
    await h.ev(() => { delete WAY._testProject; });
    h.assert(!h.errors.length, 'no page errors: ' + h.errors.join(' | '));
  } finally { await L.restore(h); }
};
