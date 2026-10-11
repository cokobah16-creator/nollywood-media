// pt_report_sheet (Team D): Settings › PLAYTEST › Summary › VIEW, the facilitator's sheet, at the three sizes.
//   node tools/harness/run.cjs tools/harness/scenarios/pt_report_sheet.cjs --html <build>/naceca.html --w 390 --h 844 --touch 1
//   node tools/harness/run.cjs tools/harness/scenarios/pt_report_sheet.cjs --html <build>/naceca.html --w 844 --h 390 --touch 1
//   node tools/harness/run.cjs tools/harness/scenarios/pt_report_sheet.cjs --html <build>/naceca.html --w 1280 --h 800
// The four headings word for word; ≥ 12 px gutters and no sideways scroll; 44 px buttons on touch; no gradient,
// box-shadow, filter, text-shadow or backdrop-filter; svg.ico icons; no emoji; no "AKS"; red / green stamps; the empty
// state in ink; Esc does what BACK does; desk → pause → Settings → VIEW → BACK → close → Resume returns to the desk;
// the rows are hidden without a label or ?pt=1; the sheet never shows during play without a tap.
const P = require('./pt_lib.cjs');
const Q = ['Where did they get lost?', 'Which interactions failed?', 'Did they understand why they were seen?', 'Did they use more than one approach?'];
const RED = 'rgb(179, 38, 30)', GREEN = 'rgb(11, 110, 79)', INK = 'rgb(28, 28, 26)';
module.exports = async h => {
  const D = require('./v13_d_lib.cjs').lib(h);
  const tag = await h.ev(() => innerWidth + 'x' + innerHeight);
  const shown = () => h.ev(() => [...document.querySelectorAll('.overlay.show')].map(o => o.id));
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const click = async (sel, ms = 200) => { await h.ev(sel => { const e = document.querySelector(sel); if(!e) throw new Error('no ' + sel); e.click(); }, sel); await h.step(ms); };

  // ---- 1. a player's page: no Player / Summary rows without a label or ?pt=1; nothing during a scripted M2 ----
  await P.T.start(h, 'm2', { seed:21 });
  const touch = await h.ev(() => document.body.classList.contains('touch-active'));
  await P.openSettings(h);
  let labels = await P.rowLabels(h);
  h.assert(!labels.includes('Player') && !labels.includes('Summary') && labels.includes('Playtest log') && labels.includes('Two questions'), 'no label, no ?pt=1: the Player and Summary rows are hidden ' + JSON.stringify(labels.slice(-4)));
  h.assert(await h.ev(() => document.documentElement.scrollWidth <= innerWidth), 'Settings has no sideways scroll');
  await h.ev(() => showOverlay(null));
  await P.driveM2(h, { style:'direct' });
  await h.step(500);
  h.assert(await h.ev(() => !document.querySelector('#screen-pt-report.show')), 'the sheet never shows after a scripted M2 without a tap');

  // ---- 2. the facilitator's page (?pt=1): NEW PLAYER, then the logs of two players on this device ----
  await P.reload(h, '?pt=1');
  await h.start('m2', { completed:['m0', 'm1'] });
  await D.inject();
  await P.openSettings(h);
  labels = await P.rowLabels(h);
  h.assert(labels.includes('Player') && labels.includes('Summary'), '?pt=1 shows the rows');
  const np = await P.newPlayerUI(h);
  h.assert(np.label === 'P1', 'NEW PLAYER started P1');
  // the fixtures' P1 (desktop) and P2 (phone) logs, as if both had played here
  const fxA = JSON.parse(P.fixture('deviceA-desk.json')).events, fxB = JSON.parse(P.fixture('deviceB-phone.txt')).events;
  await h.ev(evs => { const cur = V12.ptKit.events(); localStorage.setItem('naceca_pt_v1', JSON.stringify(cur.concat(evs))); }, fxA.concat(fxB));
  await P.openSettings(h);
  if(touch){
    const sz = await h.ev(() => ['#pt-new', '#pt-view', '#pt-export', '#pt-clear'].map(s => { const r = document.querySelector(s).getBoundingClientRect(); return [s, Math.round(r.width), Math.round(r.height)]; }));
    h.assert(sz.every(([, w, hh]) => w >= 44 && hh >= 44), 'the PLAYTEST buttons are 44 px on touch ' + JSON.stringify(sz));
  }
  await h.ev(() => document.getElementById('pt-view').scrollIntoView());
  await h.shot('pt_settings_' + tag);
  await click('#pt-view', 300);

  // ---- 3. the sheet ----
  const check = () => h.ev(([Q]) => {
    const ov = document.querySelector('#screen-pt-report.show'), sh = ov && ov.querySelector('.pt-sheet');
    if(!sh) return { shown:false };
    const r = sh.getBoundingClientRect(), W = document.documentElement.clientWidth, H = innerHeight;
    const btns = [...ov.querySelectorAll('button')].filter(b => b.getBoundingClientRect().width > 0).map(b => { const q = b.getBoundingClientRect(); return [b.textContent.trim().slice(0, 14), Math.round(q.width), Math.round(q.height)]; });
    const fx = [];
    for(const e of [ov, ...ov.querySelectorAll('*')]){
      for(const ps of [null, '::before', '::after']){
        const s = getComputedStyle(e, ps);
        if(/gradient/.test(s.backgroundImage)) fx.push('gradient ' + e.tagName + '.' + e.className);
        if(s.boxShadow && s.boxShadow !== 'none') fx.push('box-shadow ' + e.tagName + '.' + e.className);
        if(s.filter && s.filter !== 'none') fx.push('filter ' + e.tagName);
        if(s.textShadow && s.textShadow !== 'none') fx.push('text-shadow ' + e.tagName);
        if((s.backdropFilter && s.backdropFilter !== 'none') || (s.webkitBackdropFilter && s.webkitBackdropFilter !== 'none')) fx.push('backdrop-filter ' + e.tagName);
      }
    }
    const svgs = [...ov.querySelectorAll('svg')];
    const acts = ov.querySelector('.pt-acts').getBoundingClientRect();
    return { shown:true, W, H, l:Math.round(r.left), r:Math.round(W - r.right), heads:[...ov.querySelectorAll('.pt-sec h3')].map(x => x.textContent),
      headIcons:[...ov.querySelectorAll('.pt-sec h3')].every(x => x.querySelector('svg.ico')), btns, fx, svgOk:svgs.length >= 6 && svgs.every(s => s.classList.contains('ico')),
      emoji:/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{25A0}-\u{25FF}\u{2190}-\u{21FF}]/u.test(ov.textContent), aks:/\bAKS\b/.test(ov.textContent),
      hscroll:sh.scrollWidth > sh.clientWidth + 1 || document.documentElement.scrollWidth > W, acts:acts.top >= 0 && acts.bottom <= H + 1,
      title:ov.querySelector('.cw-title').textContent, lead:ov.querySelector('.pt-lead').textContent,
      stamp:(() => { const s = ov.querySelector('.pt-stamp'); return s ? [s.textContent, getComputedStyle(s).color, s.className] : null; })(),
      rows:[...ov.querySelectorAll('.pt-sec')].map(s => s.querySelectorAll('li').length) };
  }, [Q]);
  const audit = async (name) => {
    const r = await D.audit('#screen-pt-report', { touch });
    D.rules(r, name, { touch });
  };
  let c = await check();
  h.log(tag, JSON.stringify(Object.assign({}, c, { btns:c.btns && c.btns.length })));
  await h.shot('pt_report_' + tag);
  h.assert(c.shown && eq(c.heads.slice(0, 4), Q) && c.heads[4] === 'The two questions', 'the four headings word for word ' + JSON.stringify(c.heads));
  h.assert(c.l >= 12 && c.r >= 12 && !c.hscroll, 'gutters ≥ 12 px and no horizontal scroll ' + JSON.stringify([c.l, c.r, c.hscroll]));
  if(touch) h.assert(c.btns.every(([, w, hh]) => w >= 44 && hh >= 44), 'buttons ≥ 44 px on touch ' + JSON.stringify(c.btns));
  h.assert(c.fx.length === 0, 'no gradient, box-shadow, filter, text-shadow or backdrop-filter ' + JSON.stringify(c.fx.slice(0, 5)));
  h.assert(c.headIcons && c.svgOk, 'icons are svg.ico (one per heading, BACK and SEND LOG)');
  h.assert(!c.emoji && !c.aks, 'no emoji or glyph icons; no "AKS"');
  h.assert(c.acts, 'BACK and SEND LOG are on screen');
  h.assert(/^[A-Z0-9]{4}·P1$/.test(c.title) && c.title === np.dev + '·P1', 'the sheet is titled dev·label: ' + c.title);
  h.assert(c.stamp && c.stamp[0] === 'LIKELY UNDERSTOOD' && c.stamp[1] === GREEN, 'P1: LIKELY UNDERSTOOD stamped in --green ' + JSON.stringify(c.stamp));
  h.assert(c.rows.every(n => n <= 6), 'at most 5 rows per section (+ a "more" line) ' + JSON.stringify(c.rows));
  await audit('sheet P1');
  // the sticky bar stays on screen at the bottom of the sheet
  await h.ev(() => { const s = document.querySelector('#screen-pt-report .pt-sheet'); s.scrollTop = s.scrollHeight; });
  await h.step(100);
  c = await check();
  h.assert(c.acts, 'the action bar stays on screen when scrolled to the end');
  await h.shot('pt_report_' + tag + '_end');
  // WHOLE DEVICE: P1 + P2 → ASK THEM in --red
  await click('#screen-pt-report .pt-scope button[data-scope="device"]', 200);
  c = await check();
  h.log('device', JSON.stringify([c.title, c.stamp, c.lead]));
  h.assert(/^Whole device/.test(c.title) && c.stamp && c.stamp[0] === 'ASK THEM' && c.stamp[1] === RED, 'WHOLE DEVICE: ASK THEM stamped in --red ' + JSON.stringify(c.stamp));
  await audit('sheet whole device');
  // SEND LOG from the player scope exports that player only (desktop: .json download; touch: the share sheet)
  await click('#screen-pt-report .pt-scope button[data-scope="player"]', 200);
  await P.stubSave(h); await P.stubShare(h, 'ok');
  await click('#pt-r-send', 400);
  const sent = touch ? (await P.sharedText(h)).map(x => x[0]) : (await h.ev(() => window.__saved.map(s => s.data)));
  h.assert(sent.length === 1 && JSON.parse(sent[0]).events.every(e => e.d.p === 'P1') && JSON.parse(sent[0]).player === 'P1', 'SEND LOG from the player sheet sends that player\'s events');

  // ---- 4. Esc does what BACK does: Settings again, and closing Settings goes where it was opened from ----
  await h.ev(() => { showOverlay(null); togglePause(); });
  await h.step(150);
  await click('#btn-pause-settings', 200);
  await click('#pt-view', 300);
  h.assert(eq(await shown(), ['screen-pt-report']), 'VIEW opens the sheet');
  await h.page.keyboard.press('Escape');
  await h.step(250);
  h.assert(eq(await shown(), ['screen-settings']), 'Esc on the sheet goes back to Settings (not the pause menu over an open world) ' + JSON.stringify(await shown()));
  await click('#btn-settings-close', 200);
  h.assert(eq(await shown(), ['screen-pause']), 'closing Settings returns to the pause menu it was opened from');
  await click('#btn-resume', 200);

  // ---- 5. the v13 model: desk → pause → Settings → VIEW → BACK → close → Resume returns to the desk ----
  await D.seed({});
  await h.ev(() => { showOverlay(null); showHUD(true); ENGINE.movementEnabled = true; openDesk(); });
  await h.step(200);
  h.assert(eq(await shown(), ['screen-desk']), 'the desk is open');
  await h.ev(() => togglePause());
  await h.step(150);
  h.assert(eq(await shown(), ['screen-pause']), 'pause covers the desk');
  await click('#btn-pause-settings', 200);
  await click('#pt-view', 300);
  h.assert(eq(await shown(), ['screen-pt-report']), 'pause → Settings → VIEW');
  await click('#pt-r-back', 200);
  h.assert(eq(await shown(), ['screen-settings']), 'BACK → Settings');
  await click('#btn-settings-close', 200);
  h.assert(eq(await shown(), ['screen-pause']), 'close → the pause menu');
  await click('#btn-resume', 300);
  h.assert(eq(await shown(), ['screen-desk']), 'Resume → back to the desk ' + JSON.stringify(await shown()));
  await h.ev(() => { if(typeof closeDesk === 'function') closeDesk(); });
  await h.step(200);

  // ---- 6. a new player with nothing logged: the empty state, in ink ----
  await P.openSettings(h);
  await P.newPlayerUI(h);            // P2 (the phone fixture's player has events under that label)
  const np3 = await P.newPlayerUI(h);
  h.assert(np3.label === 'P3', 'P3');
  await click('#pt-view', 300);
  const empty = await h.ev(() => { const e = document.querySelector('#screen-pt-report .pt-empty'); return e ? [e.textContent, getComputedStyle(e).color] : null; });
  h.assert(empty && empty[0] === 'Nothing logged yet for this player.' && empty[1] === INK, 'the empty state, in ink ' + JSON.stringify(empty));
  await audit('sheet empty');
  await click('#pt-r-back', 200);
  h.assert(h.errors.length === 0, 'no page errors');
};
