// Shared tour + checks for the visual stream's scenarios (visual_touch.cjs, visual_desktop.cjs).
// Not a scenario itself (leading underscore). Exports tour(h, {touch}).
//
// What it checks, on every screen it opens:
//   - no visible UI element (or its ::before/::after) has a gradient background, backdrop-filter,
//     blurred box-shadow, text-shadow or drop-shadow/blur filter (in-world art is allow-listed)
//   - owned screens contain no emoji / pictograph glyphs (other streams' glyphs are only logged)
//   - on touch: keyboard hints are hidden and every visible tappable thing is >= 44x44
// plus one-off checks for the palette tokens, title lockup, boot splash, paper documents,
// typography, minimap skin and colour-blind mode.

const PAGE_LIB = String.raw`
window.__VA = (function(){
  const ALLOW = '.car-mirror,.car-mirror *,.car-wheel,canvas,#three-canvas,.mg-card.hidden-notes .ln,#car-hud .car-frame,#car-hud .car-frame *';
  const vis = el => {
    if(!el.isConnected) return false;
    const cs = getComputedStyle(el);
    if(cs.display === 'none' || cs.visibility === 'hidden') return false;
    const r = el.getBoundingClientRect();
    if(r.width < 1 || r.height < 1) return false;
    for(let p = el; p && p !== document.documentElement; p = p.parentElement){
      const c = getComputedStyle(p); if(c.display === 'none' || +c.opacity === 0) return false;
    }
    return r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth;
  };
  const desc = el => {
    const c = (el.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean).slice(0, 3).join('.');
    const t = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 24);
    return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (c ? '.' + c : '') + (t ? ' "' + t + '"' : '');
  };
  const blurOf = s => {
    if(!s || s === 'none') return 0;
    let m = 0;
    for(const p of s.split(/,(?![^(]*\))/)){
      const n = p.replace(/rgba?\([^)]*\)/g, '').trim().split(/\s+/).filter(t => /^-?[\d.]+px$/.test(t)).map(parseFloat);
      if(n.length >= 3) m = Math.max(m, n[2]);
    }
    return m;
  };
  const effects = (el, ps) => {
    const cs = getComputedStyle(el, ps), out = [];
    if(ps && (cs.content === 'none' || cs.content === 'normal')) return out;
    if(/gradient/.test(cs.backgroundImage)) out.push('gradient');
    if((cs.backdropFilter && cs.backdropFilter !== 'none') || (cs.webkitBackdropFilter && cs.webkitBackdropFilter !== 'none')) out.push('backdrop-filter');
    if(blurOf(cs.boxShadow) > 0) out.push('box-shadow ' + cs.boxShadow);
    if(cs.textShadow && cs.textShadow !== 'none') out.push('text-shadow');
    if(/drop-shadow|blur\(/.test(cs.filter)) out.push('filter ' + cs.filter);
    return out;
  };
  function audit(){
    const bad = [];
    for(const el of document.querySelectorAll('body *')){
      if(el.closest('svg') && el.tagName.toLowerCase() !== 'svg') continue;
      if(el.matches(ALLOW) || !vis(el)) continue;
      for(const ps of [null, '::before', '::after']){ const e = effects(el, ps); if(e.length) bad.push(desc(el) + (ps || '') + ' → ' + e.join(', ')); }
    }
    // body itself (scan vignette writes an inline box-shadow on it)
    const b = effects(document.body, null); if(b.length) bad.push('body → ' + b.join(', '));
    return bad;
  }
  const GLYPH = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{25A0}-\u{25FF}\u{2190}-\u{2191}\u{2193}-\u{21FF}\u{2300}-\u{23FF}]/u;
  function glyphs(sel){
    const out = [];
    for(const root of document.querySelectorAll(sel)){
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for(let n; (n = w.nextNode());){
        const m = n.nodeValue.match(GLYPH);
        if(m && n.parentElement && vis(n.parentElement)) out.push(desc(n.parentElement) + ' has ' + JSON.stringify(m[0]));
      }
    }
    return out;
  }
  const TAP = 'button, a[href], input, select, textarea, [role=button], .ops-chip, .dialogue-choice, .puzzle-option, .v12-line.live, .acc-item, .acc-card, '
    + '.mission-card:not(.locked), .skill-node:not(.locked), .ph-row, .ph-opt, .mg-seg, .mg-bin, .mg-lead, .mg-term, .mg-procs .row:not(.head), #side-chip, .pill, '
    + '.ctx-main, .ctx-small, .hud-sprint, .hud-pausebtn, .seg button, .v12-x, .ph-x, .ops-erase, .action-btn, #joystick, .sol-b, .cd-opts button';
  function targets(min){
    const out = [];
    for(const el of document.querySelectorAll(TAP)){
      if(!vis(el)) continue;
      const r = el.getBoundingClientRect();
      if(r.width < min - 0.5 || r.height < min - 0.5) out.push(desc(el) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
    }
    return out;
  }
  const KEYS = 'span.k, .kbd, span.key, .wl-key, .ck, .sol-keys, .controls-hint, .controls-grid';
  function keyHints(){ return [...document.querySelectorAll(KEYS)].filter(vis).map(desc); }
  const css = (sel, prop, ps) => { const el = document.querySelector(sel); return el ? getComputedStyle(el, ps || null)[prop] : null; };
  return { audit, glyphs, targets, keyHints, css, vis, desc };
})();`;

const MANILA = 'rgb(233, 220, 192)', INK = 'rgb(28, 28, 26)', GREEN = 'rgb(11, 110, 79)', RED = 'rgb(179, 38, 30)', GREY = 'rgb(107, 107, 99)';
// screens whose text this stream owns: no pictograph glyphs allowed there
const OWNED = '#screen-title, #hud, #screen-missions, #screen-controls, #screen-skills, #screen-minigame, #screen-aftermath, #dlg-continue, #screen-records, .ops-notes .case-row .ico, #screen-pause';

module.exports.tour = async (h, opt) => {
  const touch = !!opt.touch;
  await h.page.addScriptTag({ content: PAGE_LIB });
  const isTouch = await h.ev(() => document.body.classList.contains('touch-active'));
  h.assert(isTouch === touch, `expected touch-active=${touch} (run with${touch ? '' : 'out'} --touch 1)`);
  const report = { effects: [], glyphsOwned: [], glyphsOther: [], targets: [], keys: [] };
  const TARGET_ALLOW = [
    // the joystick is a 134px disc; listed only so it is measured
  ];

  const check = async (name, wait = 450) => {
    await h.step(wait);
    await h.shot(name);
    const r = await h.ev(owned => ({
      effects: __VA.audit(),
      owned: __VA.glyphs(owned),
      all: __VA.glyphs('body'),
      targets: __VA.targets(44),
      keys: __VA.keyHints(),
    }), OWNED);
    r.effects.forEach(x => report.effects.push(name + ': ' + x));
    r.owned.forEach(x => report.glyphsOwned.push(name + ': ' + x));
    r.all.filter(x => !r.owned.includes(x)).forEach(x => report.glyphsOther.push(name + ': ' + x));
    if(touch){
      r.targets.filter(x => !TARGET_ALLOW.some(a => x.includes(a))).forEach(x => report.targets.push(name + ': ' + x));
      r.keys.forEach(x => report.keys.push(name + ': ' + x));
    }
    h.log(`[${name}] effects:${r.effects.length} glyphs(owned):${r.owned.length} glyphs(other):${r.all.length - r.owned.length}` + (touch ? ` small-targets:${r.targets.length} key-hints:${r.keys.length}` : ''));
  };

  // ---- 1. palette tokens + legacy remap ----
  const tok = await h.ev(() => {
    const cs = getComputedStyle(document.documentElement), g = k => cs.getPropertyValue(k).trim();
    return { manila:g('--manila'), ink:g('--ink'), green:g('--green'), red:g('--red'), grey:g('--grey'), radius:g('--radius'), head:g('--font-head'), mono:g('--font-mono'),
      gold:g('--naceca-gold'), goldB:g('--naceca-gold-bright'), panel:g('--hud-panel'), border:g('--hud-border'), navy:g('--naceca-navy'), danger:g('--danger'), integrity:g('--integrity') };
  });
  h.log('tokens', JSON.stringify(tok));
  h.assert(tok.manila.toUpperCase() === '#E9DCC0' && tok.ink.toUpperCase() === '#1C1C1A' && tok.green.toUpperCase() === '#0B6E4F' && tok.red.toUpperCase() === '#B3261E' && tok.grey.toUpperCase() === '#6B6B63', 'palette tokens');
  h.assert(tok.radius === '3px' && /Oswald/.test(tok.head) && /JetBrains Mono/.test(tok.mono), 'radius + font tokens');
  h.assert(tok.gold.toUpperCase() === '#E9DCC0' && tok.goldB.toUpperCase() === '#E9DCC0' && tok.navy.toUpperCase() === '#1C1C1A' && tok.danger.toUpperCase() === '#B3261E' && tok.integrity.toUpperCase() === '#0B6E4F', 'legacy tokens remapped');
  h.assert(/28,\s*28,\s*26/.test(tok.panel) && /233,\s*220,\s*192/.test(tok.border), 'hud panel/border remapped');

  // ---- 2. boot splash (real markup, re-inserted: it is removed at DOMContentLoaded) ----
  await h.ev(async () => {
    const html = await (await fetch(location.href)).text();
    const m = html.match(/<div id="boot-splash"[\s\S]*?<span><\/span><\/div><\/div>/);
    const d = document.createElement('div'); d.innerHTML = m[0]; document.body.appendChild(d.firstChild);
  });
  const splash = await h.ev(() => ({ bg: __VA.css('#boot-splash', 'backgroundImage'), bgc: __VA.css('#boot-splash', 'backgroundColor'), f: __VA.css('#boot-splash img', 'filter') }));
  h.assert(splash.bg === 'none' && splash.bgc === 'rgb(28, 28, 26)' && splash.f === 'none', 'boot splash is a flat ink screen with no glow: ' + JSON.stringify(splash));
  await check('00_splash', 200);
  await h.ev(() => document.getElementById('boot-splash').remove());

  // ---- 3. title ----
  await h.ev(() => showOverlay('screen-title'));
  await check('01_title');
  const title = await h.ev(() => ({
    wmBg: __VA.css('#screen-title h1.wordmark', 'backgroundImage'), wmFill: __VA.css('#screen-title h1.wordmark', 'webkitTextFillColor'),
    wmColor: __VA.css('#screen-title h1.wordmark', 'color'), wmFilter: __VA.css('#screen-title h1.wordmark', 'filter'), wmFont: __VA.css('#screen-title h1.wordmark', 'fontFamily'),
    ruleBg: __VA.css('#screen-title .bl-rule', 'backgroundImage'), ruleH: __VA.css('#screen-title .bl-rule', 'height'), ruleC: __VA.css('#screen-title .bl-rule', 'backgroundColor'),
    motto: __VA.css('#screen-title .bl-motto', 'color'), shieldFilter: __VA.css('.naceca-shield', 'filter'),
    primary: __VA.css('#btn-newgame', 'backgroundColor'), btnFont: __VA.css('#btn-newgame', 'fontFamily'),
  }));
  h.log('title', JSON.stringify(title));
  h.assert(title.wmBg === 'none' && title.wmFill === title.wmColor && title.wmColor === MANILA && title.wmFilter === 'none', 'wordmark is solid manila, no gradient / drop-shadow');
  h.assert(/Cinzel/.test(title.wmFont), 'brand lockup keeps its font');
  h.assert(title.ruleBg === 'none' && title.ruleH === '1px' && title.ruleC === MANILA, 'lockup rule is a flat 1px manila line');
  h.assert(/168, 159, 138|233, 220, 192/.test(title.motto), 'motto is manila / muted manila');
  h.assert(title.shieldFilter === 'none', 'HUD shield has no glow filter');
  h.assert(title.primary === GREEN && /Oswald/.test(title.btnFont), 'primary action is NACECA green, buttons are condensed sans');

  // ---- 4. menus ----
  await h.ev(() => { renderMissionSelect(); showOverlay('screen-missions'); });
  await check('02_missions');
  const cardH = await h.ev(() => { const c = document.querySelector('.mission-card .name'); return c ? __VA.vis(c) : false; });
  h.assert(cardH, 'mission cards show their names (rows no longer collapse)');
  await h.ev(() => openSettings());
  await check('03_settings');
  await h.ev(() => { if(typeof openRecords === 'function') openRecords(); });
  await check('04_records', 300);
  await h.ev(() => showOverlay('screen-pause'));
  await check('05_pause', 200);

  // ---- 5. HUD in M2 + minimap ----
  await h.start('m2', { completed: ['m0', 'm1'] });
  await h.ev(() => { showOverlay(null); showHUD(true); ENGINE.movementEnabled = true; });
  await check('06_hud_m2', 600);
  const hud = await h.ev(() => ({
    panel: __VA.css('#hud-mission', 'backgroundColor'), titleFont: __VA.css('#hud-mission-title', 'fontFamily'),
    disc: __VA.css('#minimap-svg > circle', 'fill'), arrow: __VA.css('#minimap-arrow', 'fill'),
    street: (()=>{ const r = document.querySelector('#minimap-streets rect'); return r ? getComputedStyle(r).fill : null; })(),
    suspect: (()=>{ const c = document.querySelector('#minimap-pois circle[fill="#e07d4a"]'); return c ? getComputedStyle(c).fill : null; })(),
    ring: __VA.css('.minimap', 'borderTopWidth'), ringC: __VA.css('.minimap', 'borderTopColor'),
    evNum: __VA.css('.hud-casebar b, .evidence-count .num', 'fontFamily'),
  }));
  h.log('hud', JSON.stringify(hud));
  h.assert(/28, 28, 26/.test(hud.panel), 'HUD mission panel is a dark ink panel');
  h.assert(/Oswald/.test(hud.titleFont), 'HUD heading in condensed sans');
  h.assert(hud.disc === INK && hud.arrow === MANILA && hud.ring === '1px' && hud.ringC === MANILA, 'minimap disc ink, player manila, 1px rule');
  h.assert(hud.street === 'rgb(168, 159, 138)', 'minimap streets manila');
  h.assert(hud.suspect === RED, 'minimap suspect pin stamp red');
  h.assert(/JetBrains Mono/.test(hud.evNum), 'evidence count in monospace');

  await h.ev(() => startDialogue('market_intro', () => {}));
  await check('07_dialogue', 1600);
  const dlg = await h.ev(() => ({ bg: __VA.css('.dialogue-box', 'backgroundColor'), bgi: __VA.css('.dialogue-box', 'backgroundImage'), clip: __VA.css('.dialogue-box', 'clipPath') }));
  h.assert(dlg.bg === INK && dlg.bgi === 'none' && dlg.clip === 'none', 'dialogue box is a flat ink panel');
  await h.ev(() => showOverlay(null));

  // ---- 6. operations table + case notes: paper ----
  await h.ev(() => V12.openOps('lagos'));
  await check('08_ops', 700);
  const ops = await h.ev(() => ({
    frame: __VA.css('.ops-frame', 'backgroundColor'), board: __VA.css('.ops-board', 'backgroundColor'), boardImg: __VA.css('.ops-board', 'backgroundImage'),
    chip: __VA.css('.ops-chip', 'backgroundColor'), chipInk: __VA.css('.ops-chip .n', 'color'), chipMeta: __VA.css('.ops-chip .m', 'fontFamily'),
    side: __VA.css('.ops-side', 'backgroundColor'), head: __VA.css('.ops-title b', 'fontFamily'), stampless: true,
  }));
  h.log('ops', JSON.stringify(ops));
  h.assert(ops.frame === MANILA && ops.side === MANILA && ops.chip === MANILA && ops.boardImg === 'none', 'operations table is manila paper with index cards');
  h.assert(ops.chipInk === INK && /JetBrains Mono/.test(ops.chipMeta) && /Oswald/.test(ops.head), 'ink type, mono card data, condensed headings');
  // the INKED stamp: stamp red, uppercase condensed, 2-4px border, no glow
  await h.ev(() => { const s = document.createElement('div'); s.className = 'ops-stamp'; s.id = 'va-stamp'; s.textContent = 'INKED'; document.getElementById('ops-board').appendChild(s); });
  const stamp = await h.ev(() => ({ c: __VA.css('#va-stamp', 'color'), b: __VA.css('#va-stamp', 'borderTopColor'), ts: __VA.css('#va-stamp', 'textShadow') }));
  h.assert(stamp.c === RED && stamp.b === RED && stamp.ts === 'none', 'rubber stamp in stamp red, no glow');
  await h.ev(() => document.getElementById('va-stamp').remove());
  await h.ev(() => document.getElementById('ops-notes').click());
  await check('09_ops_notes', 500);
  const notes = await h.ev(() => ({ n: document.querySelectorAll('.ops-notes .case-row').length, svg: document.querySelectorAll('.ops-notes .case-row > .ico > svg.ico').length,
    nm: __VA.css('.ops-notes .case-row .nm', 'color'), ds: __VA.css('.ops-notes .case-row .ds', 'fontFamily') }));
  h.log('notes', JSON.stringify(notes));
  h.assert(notes.svg >= 7 && notes.nm === INK && /JetBrains Mono/.test(notes.ds), 'case file notes: line icons, ink headings, mono case data');
  await h.ev(() => V12.closeOps());

  // ---- 7. a document check: paper, right/wrong marks ----
  await h.ev(() => openPuzzle('market_phone_scan', () => {}));
  await check('10_document', 700);
  const doc = await h.ev(() => ({ bg: __VA.css('.puzzle-frame.v12-doc', 'backgroundColor'), line: __VA.css('.v12-line', 'fontFamily'), lineC: __VA.css('.v12-line', 'color') }));
  h.assert(doc.bg === MANILA && /JetBrains Mono/.test(doc.line) && doc.lineC === INK, 'document check is a manila sheet with mono ink lines');
  await h.ev(() => { const l = document.querySelector('.v12-line.live'); l.classList.add('ok'); });
  const okMark = await h.ev(() => { const s = getComputedStyle(document.querySelector('.v12-line.ok'), '::after'); return s.webkitMaskImage || s.maskImage; });
  h.assert(/svg/.test(okMark), 'a proven line carries a check mark, not just green');
  await h.ev(() => { document.querySelector('.v12-line.ok').classList.remove('ok'); document.getElementById('v12-doc-x').click(); });

  // ---- 8. aftermath report, plan, accusation, skills, controls, minigame ----
  await h.ev(() => { S.game.currentMission = 'm2'; showAftermath(); });
  await h.step(300);
  await h.ev(() => { const t = document.getElementById('toast'); if(t) t.classList.remove('show'); });
  await check('11_aftermath', 700);
  const aft = await h.ev(() => ({ bg: __VA.css('.aftermath-block', 'backgroundColor'), up: (()=>{ const e = document.querySelector('.stat-row .val.up'); return e ? getComputedStyle(e, '::after').borderBottomStyle : 'none'; })() }));
  h.assert(aft.bg === MANILA, 'aftermath report blocks are manila sheets');
  h.assert(aft.up === 'solid', 'good readings carry a shape as well as green');
  await h.ev(() => V12.planM3(() => {}));
  await check('12_plan', 500);
  h.assert(await h.ev(() => __VA.css('.plan-frame', 'backgroundColor')) === MANILA, 'raid plan is paper');
  h.assert(/JetBrains Mono/.test(await h.ev(() => __VA.css('.plan-row .pv', 'fontFamily'))), 'plan rows in monospace');
  await h.ev(() => { S.game.evidence = [{ id:'ev_a', name:'Burner phone' }, { id:'ev_b', name:'POS receipts' }]; V12.accuse(() => {}); });
  await check('13_accuse', 500);
  h.assert(await h.ev(() => __VA.css(document.querySelector('.cw-sheet') ? '.cw-sheet' : '.acc-frame', 'backgroundColor')) === MANILA, 'accusation is a charge sheet');
  h.assert(/JetBrains Mono/.test(await h.ev(() => __VA.css(document.querySelector('.cw-ol') ? '.cw-ol' : '.acc-item', 'fontFamily'))), 'accusation items in monospace');
  await h.ev(() => openSkillTree());
  await check('14_skills', 400);
  await h.ev(() => showStartMission('m3'));
  await check('15_controls', 400);
  await h.ev(() => { showOverlay(null); miniPlay(MG_CFG.m2_alert(), () => {}); });
  await check('16_minigame', 600);
  await h.ev(() => { try { miniClose({ ok:false }); } catch(e) {} showOverlay(null); });
  await h.ev(() => { showOverlay(null); miniPlay(MG_CFG.m3_cash(), () => {}); });
  await h.step(300);
  await h.ev(() => { const b = document.querySelector('#mg-actions .btn.primary'); if(b) b.click(); });
  await check('17_minigame_sort', 500);
  h.assert(await h.ev(() => !!document.querySelector('.mg-sort-item .ic svg.ico')), 'sort-game items use line icons');
  await h.ev(() => { try { miniClose({ ok:false }); } catch(e) {} showOverlay(null); });

  // ---- 9. office phone + news board + daily ----
  await h.ev(() => { if(V12.openPhone) V12.openPhone(() => {}); });
  await check('18_phone', 400);
  await h.ev(() => { showOverlay(null); if(V12.openNews) V12.openNews(() => {}); });
  await check('19_news', 400);
  await h.ev(() => { showOverlay(null); if(V12.openDaily) V12.openDaily(true); });
  await check('20_daily', 400);
  await h.ev(() => { const x = document.getElementById('sol-x'); if(x) x.click(); showOverlay(null); });

  // ---- 10. colour-blind mode ----
  await h.ev(() => document.body.classList.add('cb'));
  const cb = await h.ev(() => {
    const host = document.createElement('div'); host.className = 'puzzle-frame'; host.id = 'va-cb';
    host.innerHTML = '<div class="puzzle-option correct">yes</div><div class="puzzle-option wrong">no</div><div class="pmeter" data-tone="good"><div class="pm-fill" style="width:50%"></div></div>';
    document.body.appendChild(host);
    const ok = host.querySelector('.correct'), bad = host.querySelector('.wrong');
    const r = { okBg: getComputedStyle(ok).backgroundColor, badBg: getComputedStyle(bad).backgroundColor, badDeco: getComputedStyle(bad).textDecorationLine,
      okMark: getComputedStyle(ok, '::after').webkitMaskImage, badMark: getComputedStyle(bad, '::after').webkitMaskImage,
      good: getComputedStyle(host.querySelector('.pm-fill')).backgroundColor, rep: getComputedStyle(document.getElementById('rep-integrity')).backgroundColor };
    host.remove(); return r;
  });
  await h.ev(() => document.body.classList.remove('cb'));
  h.log('cb', JSON.stringify({ ...cb, okMark: !!cb.okMark, badMark: !!cb.badMark }));
  h.assert(cb.okBg === MANILA && cb.badBg === RED && /line-through/.test(cb.badDeco), 'colour-blind: right is light, wrong is red + struck');
  h.assert(/svg/.test(cb.okMark) && /svg/.test(cb.badMark) && cb.okMark !== cb.badMark, 'right / wrong carry different marks');
  h.assert(cb.good === MANILA && cb.rep === MANILA, 'colour-blind remap of good meters / integrity bar');

  // ---- report ----
  const show = (k, list) => { if(list.length){ h.log(`${k} (${list.length}):`); [...new Set(list)].slice(0, 40).forEach(x => h.log('   ' + x)); } };
  show('EFFECTS', report.effects);
  show('GLYPHS in owned screens', report.glyphsOwned);
  show('glyphs in other streams\' markup (not asserted)', report.glyphsOther);
  if(touch){ show('TOUCH TARGETS < 44px', report.targets); show('KEY HINTS visible on touch', report.keys); }
  h.assert(report.effects.length === 0, 'no gradients / glows / blur on visible UI');
  h.assert(report.glyphsOwned.length === 0, 'no emoji or pictograph glyphs in owned screens');
  if(touch){
    h.assert(report.keys.length === 0, 'keyboard hints hidden on touch');
    h.assert(report.targets.length === 0, 'every visible tappable element is at least 44x44 on touch');
  }
  return report;
};
