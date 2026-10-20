// screens team: the paper-identity audit of every Season 2 screen this team owns, at this viewport
// (run it as desktop 1280x800, phone 844x390 touch and portrait 390x844 touch). For each screen:
//   0 gradients, 0 glows (box/text shadows) or blur, 0 colours off our palette, 0 glyph icons, no Georgia,
//   no radius above 4px, every control 44px or more on touch, and no control off the screen.
const { L, sc, R, checks, OFFICE, shown, setMode, courtState, c15, clearC15 } = require('./screens_lib.js');
module.exports = async function (T) {
  const C = checks(T), tag = T.mode;
  const audit = async (name, sel, opt) => {
    opt = opt || {};
    await T.wait(opt.wait || 500);
    const r = await R.look(T, 'screens_' + name, sel);
    const n = k => Array.isArray(r[k]) ? r[k].length : Object.keys(r[k]).length;
    C.ok(`R08-${name}-${tag}`, r.roots > 0 && n('gradients') === 0 && n('shadows') === 0 && n('blur') === 0,
      `roots=${r.roots} gradients=${JSON.stringify(r.gradients)} shadows=${JSON.stringify(r.shadows)} blur=${JSON.stringify(r.blur)}`);
    C.ok(`R08-palette-${name}-${tag}`, n('colours') === 0, JSON.stringify(r.colours));
    C.ok(`R08-radius-${name}-${tag}`, n('radius') === 0, JSON.stringify(r.radius));
    C.ok(`R08-fonts-${name}-${tag}`, !r.fonts.Georgia && !Object.keys(r.fonts).length, JSON.stringify(r.fonts));
    C.ok(`R16-glyphs-${name}-${tag}`, n('glyphs') === 0, JSON.stringify(r.glyphs));
    if (r.touch) C.ok(`R17-touch44-${name}-${tag}`, n('small') === 0, JSON.stringify(r.small));
    C.ok(`fit-offscreen-${name}-${tag}`, n('offscreen') === 0 && !r.docOverflowX, JSON.stringify(r.offscreen) + ' overflowX=' + r.docOverflowX);
    return r;
  };

  // ---------- the office before the trial: the case file, the sources board, the fix board ----------
  T.log('h13', await sc.s2start(T, 'h13', OFFICE));
  await T.until(() => !document.querySelector('#title-card.show'), 20000); await T.wait(1200);
  await T.ev(() => V13.openCaseFileS2());
  await audit('s2case', '#screen-s2case');
  await T.ev(() => document.querySelector('#screen-s2case .s2c-done').click());
  await T.ev(() => V13.openSources(() => {}));
  await audit('sources', '#screen-sources');
  await T.ev(() => document.querySelector('#screen-sources .src-done').click());
  // (SC2) every WHY line on the fix board is there in full at this viewport (no line clamp): on Senior, with no
  // PROTECTS, it is the only basis for choosing a fix
  const whyRead = () => T.ev(() => { const w = [...document.querySelectorAll('#screen-courtfix .cf-why')];
    return { n:w.length, cut:w.filter(e => e.scrollHeight > e.clientHeight + 1).map(e => e.textContent.slice(0, 36) + '… ' + e.scrollHeight + '/' + e.clientHeight),
      clamp:w.filter(e => { const c = getComputedStyle(e).webkitLineClamp; return c && c !== 'none'; }).length, prot:document.querySelectorAll('#screen-courtfix .cf-prot').length }; });
  const openFix = () => T.ev(() => { S.game.moralChoices.s2_original = 'handed'; V13.s2().fixes = {}; V13.court.openFixes(2, () => {}, { where:'h13', kicker:'A BORROWED DESK', note:'One thing you can put right today.' }); });
  await setMode(T, 'senior');
  await openFix(); await T.wait(400);
  const ws = await whyRead();
  C.ok(`R10-why-readable-senior-${tag}`, ws.n >= 4 && ws.cut.length === 0 && ws.clamp === 0 && ws.prot === 0, JSON.stringify(ws));
  await T.ev(() => document.querySelector('#screen-courtfix .cf-close').click());
  await setMode(T, 'recruit');                                      // Recruit: the board also shows PROTECTS and "Nothing to do for"
  await openFix();
  await audit('courtfix', '#screen-courtfix');
  const wr = await whyRead();
  C.ok(`R10-why-readable-recruit-${tag}`, wr.n >= 4 && wr.cut.length === 0 && wr.prot > 0, JSON.stringify(wr));
  // R18: at 844x390 every card can be reached (the board wraps into rows and scrolls down; nothing is cut sideways)
  const fit = await T.ev(() => { const g = document.querySelector('#screen-courtfix .cf-grid'), cards = [...g.querySelectorAll('.cf-card')], gr = g.getBoundingClientRect();
    return { n:cards.length, sideways:g.scrollWidth > g.clientWidth + 1, cut:cards.filter(c => { const r = c.getBoundingClientRect(); return r.right > gr.right + 1 || r.left < gr.left - 1; }).length, scrollY:g.scrollHeight > g.clientHeight + 1 }; });
  C.ok(`R18-fixboard-${tag}`, fit.n >= 4 && !fit.sideways && fit.cut === 0, JSON.stringify(fit));
  await T.ev(() => document.querySelector('#screen-courtfix .cf-close').click());
  await setMode(T, 'senior');

  // ---------- Court 5: the bar, a stamp, a count, the exhibits, the judgment, the interlude ----------
  await courtState(T);
  await T.ev(() => { const K = V13.court; K.bar(true); K.label('DAY 1 · EXAMINATION-IN-CHIEF', 'PW1 · 5/10'); K.credMeter(true); K.showCred(52, -5); });
  await audit('courtbar', '#court-bar', { wait:250 });
  await T.ev(() => V13.court.stamp('OBJECTION', 'obj'));
  await audit('courtstamp', '#court-stamp', { wait:250 });
  await T.ev(() => V13.court.docCard({ k:'FHC/ABJ/CR/214/2026', t:'COUNT ONE', body:(V13.COURT_DATA.charge || {}).count1 || 'That you, Lucky Edafe…' }));
  await audit('courtdoc', '#court-doc', { wait:400 });
  const dlg = await T.ev(() => { const o = document.getElementById('screen-dialogue'); return o ? getComputedStyle(o).backgroundImage : 'none'; });
  C.ok(`R08-court-dialogue-${tag}`, !/gradient/.test(dlg), dlg);
  await T.ev(() => { V13.court.docCard(null); V13.court.openExhibits(); });
  await audit('courtexh', '#court-exh');
  await T.ev(() => document.querySelector('#court-exh .ce-x').click());
  await T.ev(() => { const st = V13.court.stageOf && V13.court.stageOf(); if (st) st.cue('interlude', { label:'ABUJA · THE WEEKEND' }); });
  await audit('courtinterlude', '#court-interlude');
  await T.ev(() => { const st = V13.court.stageOf && V13.court.stageOf(); if (st) st.cue('interlude', null); V13.s2().trial = { d1:'notguilty', d2:'plea', d3:'notguilty' }; V13.court.verdictCard(); });
  await audit('courtverdict', '#screen-courtverdict');
  await T.ev(() => { const b = document.querySelector('#screen-courtverdict .cv-go'); if (b) b.click(); V13.court.end(); });

  // ---------- Case 15: the sealed envelope, the accusation, the case card ----------
  T.log('m15', await c15(T));
  await T.ev(() => V13._c15.sealScreen(() => {}));
  await audit('seal15', '#screen-seal15');
  await T.ev(() => { const b = document.querySelector('#screen-seal15 .acc-card[data-id="dg"]'); if (b) b.click(); const g = document.getElementById('s15-go'); if (g) g.click(); });
  await audit('seal15_armed', '#screen-seal15');
  await T.ev(() => { const n = document.getElementById('s15-no'); if (n) n.click(); });
  await T.ev(() => { V13.s2().seal15 = { who:'dg', before:true, t:Date.now() }; V13._c15.accuseScreen(); });
  await audit('accuse15', '#screen-accuse15');
  const blank = await T.ev(() => { document.querySelector('#screen-accuse15 .acc-card[data-id="dg"]').click();
    for (const id of ['dg_recording', 'visitor_book', 'transfer_docket']) { const b = document.querySelector(`#screen-accuse15 .acc-item[data-id="${id}"]`); if (b) b.click(); }
    const b = document.querySelector('#screen-accuse15 .a15-blank'); const cs = b && getComputedStyle(b);
    return b ? { text:b.textContent.slice(0, 60), color:cs.color, bg:cs.backgroundColor, border:cs.borderTopStyle + ' ' + cs.borderTopColor, go:!document.getElementById('a15-go').disabled } : null; });
  C.ok(`R06-blank-${tag}`, blank && /DG KOLAWOLE FASHINA/.test(blank.text) && blank.color === 'rgb(28, 28, 26)' && blank.bg === 'rgb(220, 205, 171)' && /dashed/.test(blank.border) && blank.go, JSON.stringify(blank));
  await audit('accuse15_filled', '#screen-accuse15');
  await clearC15(T);
  await T.ev(() => { const res = V13._c15.judge('dg', ['dg_recording', 'visitor_book', 'drive_image']); V13._c15.caseCard(res); });
  await audit('case15', '#screen-case15');
  const card = await T.ev(() => { const li = document.querySelector('#screen-case15 .a15-res li'), st = document.querySelector('#screen-case15 .v13-stamp');
    return { li:li && getComputedStyle(li).color, stamp:st && st.textContent + ' ' + getComputedStyle(st).color, icons:document.querySelectorAll('#screen-case15 .a15-res svg.ico').length, rows:document.querySelectorAll('#screen-case15 .a15-res li').length }; });
  C.ok(`R06-casecard-${tag}`, card.li === 'rgb(28, 28, 26)' && card.icons === card.rows && card.rows > 0, JSON.stringify(card));
  await clearC15(T);
  C.done();
};
