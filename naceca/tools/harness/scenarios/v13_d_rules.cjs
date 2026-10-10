// v13 · CASE DESK visual rules on every tab (team D; design §0, §4, A11). Run it twice:
//   node tools/harness/run.cjs tools/harness/scenarios/v13_d_rules.cjs --html <build>/naceca.html --w 390 --h 844 --touch 1 --shots <dir>/phone
//   node tools/harness/run.cjs tools/harness/scenarios/v13_d_rules.cjs --html <build>/naceca.html --w 1280 --h 800 --shots <dir>/desk
// On every tab and sub-view (Senior and Recruit): no gradients, shadows, blur or filters; no emoji or
// unicode-glyph icons; palette colours only; small text >= 4.5:1 and no red/green text on ink; no "AKS";
// no empty icon; every tappable thing >= 44x44 on touch; no horizontal overflow, 16px gutters at 390px;
// the tabs are one row that scrolls sideways when it doesn't fit; the J hint shows on desktop only;
// the desk's buttons on the pause menu, the case files screen, the ops table and the HUD follow suit.
module.exports = async h => {
  const D = require('./v13_d_lib.cjs').lib(h);
  await D.inject();
  await h.start('m2', { completed:['m0', 'm1'] });
  await D.seed({ flagged:{ kc_msg_engineer:true, kc_msg_mama:true },
    money:{ open:true, req:2, unlocked:{ n_kc:true, n_odogwu:true, n_sister:true, n_bluewater:true, n_ca:true, n_wallet:true }, traced:{ n_kc:true, n_odogwu:true, n_sister:true, n_bluewater:true } },
    warrants:{ w_cdr:{ status:'none', at:'h6' }, w_eko:{ status:'signed', route:'zonal', at:'h7' } } });
  await h.ev(() => {
    S.game.completedMissions = ['m0', 'm1', 'm2', 'm3', 'm3n', 'm4', 'm5', 'm6', 'm7'];
    I().leads.burner = 'pending';                      // a handset you hold but haven't read: a locked card
    showOverlay(null); showHUD(true); ENGINE.movementEnabled = true;
  });
  await D.calm();
  const touch = await h.ev(() => document.body.classList.contains('touch-active'));
  const narrow = await h.ev(() => innerWidth <= 600);
  h.log('touch', touch, 'narrow', narrow);
  const icons = D.iconNames();
  const missing = await h.ev(names => names.filter(n => !ICONS[n]), icons);
  h.assert(missing.length === 0, 'every icon the desk asks for exists in beta/icons.js: missing ' + missing.join(','));

  let views = 0;
  const check = async (name, f, o = {}) => {
    await h.ev(f);
    await h.ev(() => document.querySelectorAll('#screen-desk details').forEach(d => { d.open = true; }));
    await h.step(220);
    await h.shot(name);
    const r = await D.audit('#screen-desk', { touch, narrow });
    h.log(`[${name}] elements:${r.counts && r.counts.elements}`);
    if(o.logOnly){ ['effects', 'glyphs', 'palette', 'targets', 'overflow', 'contrast', 'redgreen', 'aks'].forEach(k => r[k] && r[k].length && h.log(`  (not ours) ${name} ${k}: ${r[k].slice(0, 4).join(' | ')}`)); return r; }
    D.rules(r, name, { touch });
    views++;
    return r;
  };

  // ---- the frame, the tabs, the key hint ----
  await check('01_locker', () => openDesk('locker'));
  const frame = await h.ev(() => {
    const st = document.getElementById('desk-tabs'), bs = [...st.querySelectorAll('button')];
    const fr = document.querySelector('#screen-desk .desk-frame').getBoundingClientRect();
    const k = document.querySelector('#btn-desk-close .k');
    return { rows:new Set(bs.map(b => Math.round(b.getBoundingClientRect().top))).size, scrolls:st.scrollWidth > st.clientWidth + 1, ox:getComputedStyle(st).overflowX,
      left:fr.left, right:innerWidth - fr.right, key:k ? getComputedStyle(k).display : 'none', bg:getComputedStyle(document.querySelector('#screen-desk .desk-frame')).backgroundColor,
      head:getComputedStyle(document.querySelector('#desk-title')).fontFamily, mono:getComputedStyle(document.querySelector('#desk-body .dk-ex-h .v13-mono')).fontFamily,
      sheet:getComputedStyle(document.querySelector('#desk-body .v13-sheet')).backgroundColor, radius:parseFloat(getComputedStyle(document.querySelector('#desk-body .v13-sheet')).borderTopLeftRadius) };
  });
  h.log('frame', JSON.stringify(frame));
  h.assert(frame.rows === 1, 'the tabs are one row');
  h.assert(frame.ox === 'auto' || frame.ox === 'scroll', 'the tab row scrolls sideways');
  if(narrow){ h.assert(frame.scrolls, 'at phone width the tab row is wider than the frame and scrolls'); h.assert(Math.abs(frame.left - 16) <= 1 && Math.abs(frame.right - 16) <= 1, '16px side gutters at phone width'); }
  h.assert(touch ? frame.key === 'none' : frame.key !== 'none', 'the J hint shows on desktop and hides on touch');
  h.assert(frame.bg === 'rgb(28, 28, 26)' && frame.sheet === 'rgb(233, 220, 192)', 'an ink frame holding manila sheets');
  h.assert(/Oswald/.test(frame.head) && /JetBrains Mono/.test(frame.mono), 'Oswald headings, JetBrains Mono case data');
  h.assert(frame.radius >= 2 && frame.radius <= 4, '2–4px radius on the sheets');
  const adm = await h.ev(() => ({ lbl:[...document.querySelectorAll('#desk-body .dk-adm .dk-lbl')].map(x => x.textContent), integ:/INTEGRITY/.test(document.getElementById('desk-body').textContent) }));
  h.assert(adm.lbl.length > 0 && adm.lbl.every(x => x === 'ADMISSIBILITY') && !adm.integ, 'per-exhibit score is labelled ADMISSIBILITY, never INTEGRITY');
  h.assert(await h.ev(() => !/\bAKS\b/.test(document.getElementById('desk-body').textContent) && /Anti-Kidnapping Squad/.test(document.getElementById('desk-body').textContent)), 'the Locker spells out the Anti-Kidnapping Squad');

  // ---- every tab and sub-view, Senior ----
  await check('02_phones', () => { deskDo('goto', { tab:'phones' }); deskDo('phone-back'); });
  h.assert(await h.ev(() => document.querySelectorAll('#desk-body .dk-locked').length) >= 1, 'a held-but-unread handset shows as a locked card (lock icon, dashed), not faded');
  await check('03_phone_kc', () => { deskDo('phone', { id:'kc' }); deskDo('sec', { sec:'MESSAGES' }); });
  await check('04_phone_bank', () => deskDo('sec', { sec:'BANK ALERTS' }));
  await check('05_money', () => deskDo('goto', { tab:'money' }));
  await check('06_registry', () => { deskDo('goto', { tab:'registry' }); deskDo('reg-back'); DESK.regQ = 'apex'; deskDo('reg-search'); });
  await check('07_registry_none', () => { DESK.regQ = 'zzzz'; deskDo('reg-search'); });
  await check('08_registry_card', () => deskDo('reg-open', { key:'bluewater' }));
  await check('09_registry_addr', () => deskDo('reg-addr', { addr:ZUMA }));
  await check('10_statements', () => { deskDo('goto', { tab:'statements' }); deskDo('st-back'); });
  await check('11_statement_armed', () => { deskDo('st', { id:'st_tunde' }); deskDo('verdict', { st:'st_tunde', c:'t1', v:'mistaken' }); });
  await check('12_statement_filed', () => { deskDo('verdict', { st:'st_tunde', c:'t1', v:'mistaken' }); deskDo('verdict', { st:'st_tunde', c:'t2', v:'unverified' }); deskDo('verdict', { st:'st_tunde', c:'t2', v:'unverified' }); });
  await check('13_warrants', () => deskDo('goto', { tab:'warrants' }));
  h.assert(await h.ev(() => document.querySelectorAll('#desk-body .dk-warrant').length) === 4, 'four decided warrants on file');
  await check('14_note', () => { deskDo('goto', { tab:'locker' }); toast('ADDED TO THE CASE', 'Lekki Gatehouse Log', 2400); });
  h.assert(await h.ev(() => document.getElementById('desk-note').classList.contains('on') && !document.getElementById('toast').classList.contains('show')), 'a toast fired while the desk is open becomes a status line on the desk');

  // ---- Recruit sub-views ----
  await D.recruit(true);
  await check('15_recruit_tabs', () => deskDo('goto', { tab:'locker' }));
  await check('16_recruit_phone', () => { deskDo('goto', { tab:'phones' }); deskDo('phone', { id:'kc' }); deskDo('sec', { sec:'MESSAGES' }); });
  await check('17_recruit_money', () => deskDo('goto', { tab:'money' }));
  await check('18_recruit_statement', () => { deskDo('goto', { tab:'statements' }); deskDo('st', { id:'st_musa' }); deskDo('verdict', { st:'st_musa', c:'u1', v:'corroborated' }); });
  await D.recruit(false);

  // ---- the review tab after the season (C's report inside D's frame: frame asserted, content logged) ----
  await h.ev(() => { S.game.seasonOneComplete = true; renderDesk(); });
  h.assert(await h.ev(() => !!document.querySelector('#desk-tabs [data-tab="review"]')), 'REVIEW appears after the season');
  await check('19_review', () => deskDo('goto', { tab:'review' }), { logOnly:true });
  const tabsR = await D.audit('#desk-tabs', { touch, narrow:false });
  D.rules({ ...tabsR, overflow:[] }, 'review tab strip', { touch });
  await h.ev(() => { S.game.seasonOneComplete = false; deskDo('goto', { tab:'locker' }); closeDesk(); });

  // ---- the desk's buttons elsewhere ----
  const btnAudit = async (name, sel) => { const r = await D.audit(sel, { touch, narrow:false }); D.rules({ ...r, overflow:[] }, name, { touch }); };
  await h.ev(() => { togglePause(); });
  await h.step(150); await h.shot('20_pause');
  await btnAudit('pause CASE DESK', '#btn-pause-desk');
  await h.ev(() => { togglePause(); renderMissionSelect(); showOverlay('screen-missions'); });
  await h.step(150); await h.shot('21_missions');
  await btnAudit('case files CASE DESK', '#btn-missions-desk');
  await h.ev(() => { showOverlay(null); showHUD(true); ENGINE.movementEnabled = true; V12.openOps('lagos'); });
  await h.step(300); await h.shot('22_ops');
  await btnAudit('ops CASE DESK', '#ops-desk');
  const ops = await h.ev(() => { const r = document.getElementById('ops-desk').getBoundingClientRect(), hd = document.querySelector('#screen-ops .ops-head').getBoundingClientRect();
    return { w:r.width, h:r.height, inside:r.right <= hd.right + 0.5 && r.left >= hd.left - 0.5, page:document.documentElement.scrollWidth <= innerWidth }; });
  h.assert(ops.inside && ops.page, 'the ops CASE DESK button fits the table header with no page overflow ' + JSON.stringify(ops));
  await h.ev(() => V12.closeOps());
  if(!touch){
    await h.ev(() => { showOverlay(null); showHUD(true); });
    const pill = await h.ev(() => { const p = document.getElementById('btn-desk'); return p ? { vis:getComputedStyle(p).display !== 'none', t:p.textContent } : null; });
    h.assert(pill && pill.vis && /J · CASE DESK/.test(pill.t), 'desktop HUD pill J · CASE DESK');
    await btnAudit('HUD pill', '#btn-desk');
  }
  h.log('views audited:', views);
  h.assert(h.errors.length === 0, 'no page errors: ' + h.errors.join(' | '));
};
