// BOARD · M2's table before the van, made legible (not easier): the same 3-link bar and strike rules, with
//   1. the van's refusal saying how far the table is ("THE TABLE FIRST" · 0 / 1 / 2 of 3 links inked),
//   2. a goal line in the table's foot (LEKKI NEEDS 3 INKED · n SO FAR) and a caption on the greyed FILE,
//   3. a selection line after one tap (and a second tap on the same card puts it down: no pencil),
//   4. a neutral reason on a struck link, and what three strikes cost (the ruling and HOW IT WORKS),
//   5. table time counting as play for "Hints when stuck" and the stuck log; ~90 s there with no new ink brings
//      the help: Senior Agent a process line only, Recruit Sgt. Uche's nudge,
//   6. Recruit only: once the van has said no, Uche names one true pair still open between two visible cards,
//      ONE pair, once: after it is inked he names no other (the other two links are the player's), and never
//      on a tab where those cards aren't, nor with "Hints when stuck" off,
//   and the two log events (van_refused, table_stuck).
// Also: field progress starts the 90 s again; the help stays on top while a card is held; at six pencils the
// selection line and the pointer say to erase first; the van's toast is cleared off the opened table; after the
// case's raid (M3 done) the strike text no longer says "the raid goes without it".
// Run on both casework modes. On Senior Agent, no new string may carry a card's name or tag (checked against
// V12.OPS_NODES); the selection line names only the card the player is holding, never its tag.
//   node tools/harness/run.cjs tools/harness/scenarios/board_m2_help.cjs --html <build>/naceca.html [--w 390 --h 844 --touch 1]
const READY = S => {
  S.game.evidence = [{ id:'co_madam', name:'phone' }];
  S.game._marketTunde = true;
};
const STRUCK_WHY = 'The magistrate won\'t take these two as a direct link in the crime.';
const HELP = n => `Link two cards that are connected in the crime, not just known to each other. ${n} of 3 inked.`;
const STAKES = 'the warrant is refused and the raid goes without it';

module.exports = async h => {
  const touch = await h.ev(() => document.body.classList.contains('touch-active'));
  const W = await h.ev(() => [innerWidth, innerHeight]);
  h.log('size', W.join('x'), 'touch', touch);

  // ---- page helpers ----
  // a screenshot of the table, not of the toast over it
  const shot = async name => { await h.ev(() => { const t = document.getElementById('toast'); if(t) t.classList.remove('show'); }); await h.step(120); await h.shot(name); };
  const capture = () => h.ev(() => {
    window.__m2ev = [];
    if(!V12.log.__m2cap){ const o = V12.log; const f = function(t, d){ window.__m2ev.push([t, JSON.parse(JSON.stringify(d || {}))]); return o.apply(this, arguments); }; f.__m2cap = true; V12.log = f; }
  });
  const events = type => h.ev(type => (window.__m2ev || []).filter(e => e[0] === type).map(e => e[1]), type);
  const toastNow = () => h.ev(() => { const t = document.getElementById('toast'); return { big:((t.querySelector('.big') || {}).textContent || '').trim(), small:((t.querySelector('.small') || {}).textContent || '').trim(), show:t.classList.contains('show') }; });
  const van = () => h.ev(() => {
    showOverlay(null); ENGINE.movementEnabled = true;
    S.game._marketScanned = true; S.game.moralChoices.market_runner = 'caught';
    const v = ENGINE.interactables.find(i => /^Board NACECA van/.test(i.label || ''));
    v.onInteract(v);
    const t = document.getElementById('toast');
    return { big:((t.querySelector('.big') || {}).textContent || '').trim(), small:((t.querySelector('.small') || {}).textContent || '').trim(),
      done:S.game.completedMissions.includes('m2'), cur:S.game.currentMission };
  });
  const foot = () => h.ev(() => {
    const s = document.getElementById('ops-status'), f = document.getElementById('ops-file');
    return { status:s ? s.textContent.replace(/\s+/g, ' ').trim() : null, cls:s ? s.className : null,
      file:f ? f.textContent.replace(/\s+/g, ' ').trim() : null, fileOff:f ? f.disabled : null,
      pencils:V12.ops().pencils.length, inked:V12.ops().inked.length, m:S.game.currentMission, sel:[...document.querySelectorAll('.ops-chip.sel')].map(b => b.dataset.id) };
  });
  const tap = id => h.ev(id => { document.querySelector(`.ops-chip[data-id="${id}"]`).click(); }, id);
  const help = () => h.ev(() => {
    const side = document.getElementById('ops-side'), sr = side.getBoundingClientRect();
    const box = el => { if(!el) return null; const r = el.getBoundingClientRect(); return { t:Math.round(r.top - sr.top), h:Math.round(r.height), txt:el.textContent.replace(/\s+/g, ' ').trim(), a:el.dataset.a || null, b:el.dataset.b || null }; };
    return { senior:box(side.querySelector('.ops-help')), uche:box(side.querySelector('.ops-hint')), side:side.textContent.replace(/\s+/g, ' ') };
  });
  // the Senior rule, as a check: every new string is scanned for every card name and tag on the table
  const cardTerms = text => h.ev(text => {
    const norm = s => String(s).replace(/[“”"'’]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
    const terms = new Set();
    for(const n of V12.OPS_NODES){
      const nm = norm(n.name); terms.add(nm);
      const bare = norm(n.name.replace(/\([^)]*\)/g, '')); if(bare) terms.add(bare);
      if(n.kind === 'suspect') for(const w of bare.split(/[^a-z0-9.]+/)) if(w.replace(/\./g, '').length >= 3 && !['the'].includes(w)) terms.add(w.replace(/\./g, ''));
      if(n.tag) terms.add(norm(n.tag));
    }
    const t = norm(text);
    const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return [...terms].filter(x => x && new RegExp('(^|[^a-z0-9])' + esc(x) + '([^a-z0-9]|$)').test(t));
  }, text);
  const layout = name => h.ev(name => {
    const vw = innerWidth, vh = innerHeight, out = { name, hscroll:document.documentElement.scrollWidth > vw };
    const r = el => { if(!el) return null; const b = el.getBoundingClientRect(); return { l:b.left, r:b.right, t:b.top, b:b.bottom, w:b.width, h:b.height }; };
    const st = document.getElementById('ops-status'), ft = document.getElementById('ops-foot'), f = document.getElementById('ops-file'), bd = document.getElementById('ops-board');
    out.status = r(st); out.foot = r(ft); out.file = r(f); out.board = r(bd);
    out.statusFits = !st || (st.scrollWidth <= st.clientWidth + 1 && out.status.l >= out.foot.l - 1 && out.status.r <= out.foot.r + 1 && out.status.t >= out.foot.t - 1 && out.status.b <= vh);
    out.footIn = !!out.foot && out.foot.b <= vh + 1 && out.foot.r <= vw + 1;
    return out;
  }, name);
  const checkLayout = async name => {
    const L = await layout(name);
    h.assert(!L.hscroll, name + ': no horizontal page scroll');
    h.assert(L.statusFits && L.footIn, name + ': the status line sits inside the foot, on screen ' + JSON.stringify(L));
    if(touch) h.assert(L.file.h >= 44 && L.file.w >= 44, name + ': FILE is at least 44×44 on touch ' + JSON.stringify(L.file));
    h.assert(L.board && L.board.h >= 150, name + ': the board keeps room for the cards ' + JSON.stringify(L.board));
    return L;
  };

  for(const D of ['senior', 'recruit']){
    const SR = D === 'senior';
    const tag = s => `${D}: ${s}`;
    const seniorText = [];               // every new string a Senior Agent sees (the selection line is checked on its own)

    /* ================= A. the table on its own: goal, caption, selection, time, the stuck help ================= */
    await h.start('m2', { completed:['m0', 'm1'], state:new Function('S', `(${READY.toString()})(S); S.game.difficulty = '${D}';`) });
    await capture();
    // the field work is done (Tunde, the scan, the runner): the table is what's left, as at the van
    await h.ev(() => { SETTINGS.hints = 'on'; S.game._marketScanned = true; S.game.moralChoices.market_runner = 'caught'; ['o1_tunde', 'o2_scan', 'o3_runner'].forEach(id => completeObjective(id)); });
    await h.step(300);
    h.assert(await h.ev(() => { const o = S.game.objectives.find(x => !x.done); return !!o && o.id === 'o4_table'; }), tag('M2: the open table objective is the one left'));

    // 2. the foot: goal line and the greyed FILE's caption
    await h.ev(() => V12.openOps('lagos'));
    await h.step(200);
    let f = await foot();
    h.log(D, 'foot', JSON.stringify(f));
    h.assert(f.status === 'LEKKI NEEDS 3 INKED · 0 SO FAR' && /goal/.test(f.cls), tag('the foot goal line: ' + f.status));
    h.assert(f.fileOff && f.file === 'Tap two cards to pencil a link', tag('the greyed FILE reads the caption: ' + f.file));
    seniorText.push(f.status, f.file);
    let hp = await help();
    h.assert(!hp.senior && !hp.uche, tag('no help on a fresh table ' + JSON.stringify(hp)));
    await shot(`${D}-1-goal`);
    await checkLayout(tag('goal line'));

    // 3. one tap: the selection line names the card in hand; a second tap on it puts it down, and nothing is pencilled
    await tap('s_obi');
    f = await foot();
    h.log(D, 'selected', JSON.stringify(f));
    h.assert(f.sel.length === 1 && f.sel[0] === 's_obi', tag('the card is selected'));
    h.assert(f.status === '"Chief" Obi selected — tap a second card to link it, or tap it again to put it down.' && /sel/.test(f.cls), tag('the selection line: ' + f.status));
    {
      const hits = await cardTerms(f.status.replace('"Chief" Obi', ''));
      h.assert(hits.length === 0, tag('the selection line names only the card in hand, no tag: ' + hits.join(', ')));
      if(SR) h.assert(!/PRINCIPAL/i.test(f.status), 'senior: the selection line never shows the hidden role tag');
    }
    await shot(`${D}-2-selected`);
    await checkLayout(tag('selection line'));
    await tap('s_obi');
    f = await foot();
    h.assert(f.sel.length === 0 && f.pencils === 0 && f.status === 'LEKKI NEEDS 3 INKED · 0 SO FAR', tag('reading a card and tapping it again puts it down, no pencil: ' + JSON.stringify(f)));
    // two different cards still pencil a link (the mechanic is unchanged), and the line goes back to the goal
    await tap('s_kc'); await tap('l_market');
    f = await foot();
    h.assert(f.pencils === 1 && f.inked === 0 && !f.fileOff && /^FILE 1 LINK$/.test(f.file) && f.status === 'LEKKI NEEDS 3 INKED · 0 SO FAR', tag('two cards pencil one link; FILE offers it ' + JSON.stringify(f)));
    // six pencils down: the selection line says what the table will accept (FILE or erase), not "tap a second card"
    // (pencils count as tries for Uche's old five-tries nudge: put the counters back after, so the 90 s checks below hold)
    await h.ev(() => { const o = V12.ops(); window.__m2cnt = [o.tries, o.sinceInk]; o.pencils = []; [['s_obi','l_market'],['s_kc','l_lekki'],['s_mama','l_mushin'],['e_wallet','l_mushin'],['m_pos','l_mushin'],['s_obi','l_mushin']].forEach(([a, b]) => V12.pencil(a, b)); V12.closeOps(); V12.openOps('lagos'); });
    await tap('m_pos');
    f = await foot();
    h.assert(f.pencils === 6 && /selected — six pencils down: FILE or erase one first\.$/.test(f.status) && !/tap a second card/.test(f.status), tag('at six pencils the selection line says FILE or erase first: ' + f.status));
    seniorText.push(f.status.replace(/^.* selected — /, ''));
    await checkLayout(tag('six-pencil selection line'));
    await tap('m_pos');
    await h.ev(() => { const o = V12.ops(); o.pencils = []; [o.tries, o.sinceInk] = window.__m2cnt; V12.closeOps(); });

    // 5a. table time counts for "Hints when stuck": 70 s at the table, then back in the field, the 60 s hint is due
    const g = await h.ev(() => {
      const t0 = performance.now();
      GUIDE.lastSig = progressSig(); GUIDE.lastProgress = t0; GUIDE._lastRun = t0;
      V12.openOps('lagos');
      const at = V12.atTable();
      V12.opsTableTick(70000);
      V12.closeOps(); showOverlay(null); ENGINE.movementEnabled = true;
      document.getElementById('toast').classList.remove('show'); document.getElementById('toast').innerHTML = '';
      updateGuidance(0.016);
      const t = document.getElementById('toast');
      return { at, big:((t.querySelector('.big') || {}).textContent || ''), small:((t.querySelector('.small') || {}).textContent || ''), helpNow:!!document.querySelector('#ops-side .ops-help, #ops-side .ops-hint') };
    });
    h.log(D, 'field hint after table time', JSON.stringify(g));
    h.assert(g.at, tag('V12.atTable() while the table is up on o4_table'));
    h.assert(g.big === 'HINT' && /operations table/.test(g.small), tag('70 s at the table count: the field hint comes when you step out ' + JSON.stringify(g)));
    // and only table time counts: a closed table adds nothing
    const g2 = await h.ev(() => {
      const t0 = performance.now();
      GUIDE.lastSig = progressSig(); GUIDE.lastProgress = t0; GUIDE._lastRun = t0;
      const ticked = V12.opsTableTick(70000);          // not at the table: ignored
      document.getElementById('toast').innerHTML = '';
      updateGuidance(0.016);
      return { ticked, big:((document.querySelector('#toast .big') || {}).textContent || '') };
    });
    h.assert(!g2.ticked && g2.big !== 'HINT', tag('time away from the table is not table time ' + JSON.stringify(g2)));

    // 5b. ~90 s at the table with no new ink (it adds up across visits): the 70 s, the real seconds the table was
    // open above, and the rest up to 89 s: nothing yet
    const at89 = await h.ev(() => {
      V12.openOps('lagos');
      const before = V12._tableState.idle;
      V12.opsTableTick(89000 - before);
      return { before, idle:V12._tableState.idle, help:!!document.querySelector('#ops-side .ops-help, #ops-side .ops-hint'), ev:(window.__m2ev || []).filter(e => e[0] === 'table_stuck').length };
    });
    h.log(D, 'at 89 s', JSON.stringify(at89));
    h.assert(at89.before >= 70000 && at89.before < 80000, tag('the 70 s of the last visit still count on the next one ' + at89.before));
    h.assert(!at89.help && at89.ev === 0, tag('89 s at the table: no help yet, no table_stuck ' + JSON.stringify(at89)));
    await h.ev(() => V12.opsTableTick(2000));
    await h.step(150);
    hp = await help();
    const tt = await toastNow();
    h.log(D, 'stuck help', JSON.stringify(hp), JSON.stringify(tt));
    const stuckEv = await events('table_stuck');
    h.assert(stuckEv.length === 1 && stuckEv[0].secs >= 90 && stuckEv[0].secs <= 95 && stuckEv[0].inked === 0 && stuckEv[0].pencils === 0, tag('table_stuck {secs, inked, pencils} ' + JSON.stringify(stuckEv)));
    const ptStuck = (await events('stuck')).filter(e => e.at === 'table');
    h.assert(ptStuck.length >= 1 && ptStuck[0].obj === 'o4_table' && ptStuck[0].secs >= 90, tag('the stuck log counts table time: ' + JSON.stringify(ptStuck)));
    h.assert(tt.big === 'HINT', tag('the help is announced as a HINT ' + JSON.stringify(tt)));
    if(SR){
      const line = HELP(0);
      h.assert(hp.senior && hp.senior.txt === line, 'senior: the process line at the table: ' + JSON.stringify(hp.senior));
      h.assert(hp.senior.t <= 20, 'senior: the help sits at the top of the side panel ' + JSON.stringify(hp.senior));
      h.assert(tt.small === line, 'senior: the HINT toast is the same process line');
      h.assert(!hp.uche, 'senior: never Sgt. Uche\'s nudge');
      seniorText.push(hp.senior.txt, tt.small);
    } else {
      h.assert(hp.uche && /SGT\. UCHE/.test(hp.uche.txt) && /Start with what you found today/.test(hp.uche.txt) && !hp.uche.a, 'recruit: Uche\'s existing nudge comes at 90 s, not after five tries ' + JSON.stringify(hp.uche));
      h.assert(hp.uche.t <= 20, 'recruit: Uche\'s note sits at the top of the side panel ' + JSON.stringify(hp.uche));
      h.assert(!hp.senior, 'recruit: no Senior process line');
      h.assert(/Sgt\. Uche/.test(tt.small), 'recruit: the HINT points at Uche\'s note');
    }
    await h.ev(() => { document.getElementById('toast').classList.remove('show'); });
    await shot(`${D}-3-stuck-help`);
    await checkLayout(tag('stuck help'));
    // reading a dossier (a card held) does not hide the help the HINT announced: it sits on top of the dossier
    await tap('s_mama');
    hp = await help();
    h.log(D, 'help while a card is held', JSON.stringify(hp));
    if(SR) h.assert(hp.senior && hp.senior.txt === HELP(0) && hp.senior.t <= 20 && !hp.uche, 'senior: the process line stays on top while a card is held ' + JSON.stringify(hp.senior));
    else h.assert(hp.uche && /SGT\. UCHE/.test(hp.uche.txt) && hp.uche.t <= 20 && !hp.senior, 'recruit: Uche\'s note stays on top while a card is held ' + JSON.stringify(hp.uche));
    h.assert(/Mama Florence/.test(hp.side), tag('and the dossier is still there under it'));
    await shot(`${D}-3b-help-held`);
    await checkLayout(tag('help over a held card'));
    await tap('s_mama');
    // the table's help was the hint: stepping out does not fire the field's 60 s hint on top of it
    const after = await h.ev(() => { V12.closeOps(); showOverlay(null); ENGINE.movementEnabled = true; document.getElementById('toast').innerHTML = ''; updateGuidance(0.016); return { big:((document.querySelector('#toast .big') || {}).textContent || ''), since:performance.now() - GUIDE.lastProgress }; });
    h.assert(after.big !== 'HINT' && after.since < 60000, tag('no second hint straight after the table\'s help ' + JSON.stringify(after)));
    // a new ink clears the help (it is for being stuck), and the 90 s start again
    const cleared = await h.ev(() => {
      V12.openOps('lagos'); V12.pencil('s_kc', 'l_market'); V12.fileLinks();
      const m = document.getElementById('ops-modal'); m.classList.remove('show'); V12.closeOps(); V12.openOps('lagos');
      return { help:!!document.querySelector('#ops-side .ops-help, #ops-side .ops-hint'), status:document.getElementById('ops-status').textContent.replace(/\s+/g, ' ').trim() };
    });
    h.assert(!cleared.help && cleared.status === 'LEKKI NEEDS 3 INKED · 1 SO FAR', tag('a new ink clears the help; the goal line counts it ' + JSON.stringify(cleared)));
    // the real clock: a few seconds at the table are play time (and nothing when the table is closed)
    const p0 = await h.ev(() => V12._ptState.play);
    await h.step(2600);
    const p1 = await h.ev(() => V12._ptState.play);
    await h.ev(() => V12.closeOps());
    await h.step(1300);
    const p2 = await h.ev(() => V12._ptState.play);
    h.assert(p1 - p0 >= 1500 && p1 - p0 <= 4000, tag('the table clock counts real seconds as play: ' + (p1 - p0) + ' ms'));
    h.assert(p2 - p1 <= 1600, tag('and stops when the table closes: ' + (p2 - p1) + ' ms'));

    // hints off: no help comes up, but the table still logs being stuck
    await h.ev(() => { SETTINGS.hints = 'off'; V12.openOps('lagos'); V12.opsTableTick(91000); });
    hp = await help();
    h.assert(!hp.senior && !hp.uche, tag('Hints when stuck off: no help at the table ' + JSON.stringify(hp)));
    h.assert((await events('table_stuck')).length === 2, tag('table_stuck is still logged with hints off'));
    await h.ev(() => { SETTINGS.hints = 'on'; V12.closeOps(); });

    /* ================= A2. field progress starts the table's 90 s again ================= */
    await h.start('m2', { completed:['m0', 'm1'], state:new Function('S', `(${READY.toString()})(S); S.game.difficulty = '${D}';`) });
    await capture();
    const cum = await h.ev(() => {
      SETTINGS.hints = 'on';
      V12.openOps('lagos'); V12.opsTableTick(50000); V12.closeOps();
      const before = V12._tableState.idle;
      // fieldwork: Tunde, the scan, KC detained, and a new card on the table
      S.game._marketScanned = true; S.game.moralChoices.market_runner = 'caught';
      ['o1_tunde', 'o2_scan', 'o3_runner'].forEach(id => completeObjective(id));
      collectEvidence({ id:'phishing_template', name:'Phishing Template', xp:1 });
      V12.openOps('lagos');
      const idle0 = V12._tableState.idle;
      V12.opsTableTick(41000);
      const at41 = { idle:V12._tableState.idle, help:!!document.querySelector('#ops-side .ops-help, #ops-side .ops-hint'), ev:(window.__m2ev || []).filter(e => e[0] === 'table_stuck').length };
      V12.opsTableTick(50000);
      const at91 = { help:!!document.querySelector('#ops-side .ops-help, #ops-side .ops-hint'), ev:(window.__m2ev || []).filter(e => e[0] === 'table_stuck').length };
      V12.closeOps();
      return { before, idle0, at41, at91 };
    });
    h.log(D, 'progress resets the table count', JSON.stringify(cum));
    h.assert(cum.before >= 50000 && cum.idle0 === 0, tag('field progress since the last visit: the table starts its 90 s again ' + JSON.stringify(cum)));
    h.assert(!cum.at41.help && cum.at41.ev === 0, tag('41 s into the new visit: no help, no table_stuck ' + JSON.stringify(cum.at41)));
    h.assert(cum.at91.help && cum.at91.ev === 1, tag('91 s into it: the help and one table_stuck ' + JSON.stringify(cum.at91)));

    /* ================= B. the van: progress in its refusal, strikes and their stakes, Recruit's pointer ================= */
    await h.start('m2', { completed:['m0', 'm1'], state:new Function('S', `(${READY.toString()})(S); S.game.difficulty = '${D}';`) });
    await capture();
    await h.ev(() => { SETTINGS.hints = 'on'; });
    // 1. 0 of 3
    let v = await van();
    h.log(D, 'van 0', JSON.stringify(v));
    h.assert(v.big === 'THE TABLE FIRST' && v.small === '0 of 3 links inked. Open the CASE FILE, pencil three pairs and FILE them.' && !v.done && v.cur === 'm2', tag('the van at 0 inks: ' + JSON.stringify(v)));
    h.assert(!/\bTAB\b/.test(v.small), tag('the refusal carries no keyboard hint'));
    seniorText.push(v.small);
    await shot(`${D}-4-van-0`);
    // opening the CASE FILE straight from the refusal: the toast (the goal line says the same) leaves the table clear
    {
      const t = await h.ev(() => { showOverlay(null); toast('THE TABLE FIRST', V12.vanTableLine(V12.ops().inked.length), 3200); const a = document.getElementById('toast').classList.contains('show'); V12.openOps('lagos'); const b = document.getElementById('toast').classList.contains('show'); V12.closeOps(); return { a, b }; });
      h.assert(t.a && !t.b, tag('the van\'s toast is cleared when the table opens on it ' + JSON.stringify(t)));
      // any other toast is left alone
      const t2 = await h.ev(() => { showOverlay(null); toast('EVIDENCE LOGGED', 'X', 3000); V12.openOps('lagos'); const b = document.getElementById('toast').classList.contains('show'); V12.closeOps(); document.getElementById('toast').classList.remove('show'); return b; });
      h.assert(t2, tag('another toast is not cleared by opening the table'));
    }

    // 6. Recruit: once the van has said no, Uche names one true pair that is still open; Senior: nothing
    const pointer = async () => {
      await h.ev(() => { showOverlay(null); V12.openOps('lagos'); });
      const p = await help();
      if(!p.uche || !p.uche.a) return { p, ok:false };
      const chk = await h.ev(([a, b]) => {
        const k = a < b ? a + '|' + b : b + '|' + a, l = V12.OPS_LINKS.find(x => (x.a === a && x.b === b) || (x.a === b && x.b === a));
        const nm = id => V12.OPS_NODES.find(n => n.id === id).name;
        return { true:!!l, inked:V12.ops().inked.includes(k), vis:V12.opsVisible(a) && V12.opsVisible(b), nA:nm(a), nB:nm(b), hint:l ? l.hint : null };
      }, [p.uche.a, p.uche.b]);
      return { p, chk, ok:chk.true && !chk.inked && chk.vis && p.uche.txt.includes(chk.nA) && p.uche.txt.includes(chk.nB) };
    };
    let pt = await pointer();
    h.log(D, 'pointer', JSON.stringify(pt));
    if(SR){
      h.assert(!pt.p.uche && !pt.p.senior && !(await h.ev(() => !!document.querySelector('#screen-ops [data-a]'))), 'senior: the van\'s refusal brings no pointer, no Uche');
    } else {
      h.assert(pt.ok && /Start there\.$/.test(pt.p.uche.txt), 'recruit: Uche names a true link, not yet inked, between two visible cards: ' + JSON.stringify(pt));
      h.assert(pt.p.uche.t <= 20, 'recruit: the pointer is at the top of the side panel');
      h.assert(await h.ev(k => V12.ops().vanPair === k, [pt.p.uche.a, pt.p.uche.b].sort().join('|')), 'recruit: the named pair is kept with the table (vanPair)');
    }
    await shot(`${D}-5-pointer`);
    if(!SR){
      const P = [pt.p.uche.a, pt.p.uche.b];
      // another tab: no card names from a tab that isn't on screen; ALL shows both cards, so he names them there
      const tabs = await h.ev(P => {
        const read = () => { const e = document.querySelector('#ops-side .ops-hint'); return e ? { a:e.dataset.a || null, txt:e.textContent.replace(/\s+/g, ' ').trim(), on:P.every(id => !!document.querySelector(`.ops-chip[data-id="${id}"]`)) } : null; };
        const out = {};
        for(const g of ['route', 'voice', 'all']){ document.querySelector(`.ops-tab[data-g="${g}"]`).click(); out[g] = read(); }
        document.querySelector('.ops-tab[data-g="lagos"]').click();
        return out;
      }, P);
      h.log(D, 'pointer on other tabs', JSON.stringify(tabs));
      for(const g of ['route', 'voice']) h.assert(tabs[g] && !tabs[g].a && /Tap the LAGOS tab, sir\./.test(tabs[g].txt) && !tabs[g].txt.includes(pt.chk.nA) && !tabs[g].txt.includes(pt.chk.nB), `recruit: on the ${g} tab Uche sends you to LAGOS and names no card ` + JSON.stringify(tabs[g]));
      h.assert(tabs.all && tabs.all.a === P[0] && tabs.all.on, 'recruit: on ALL he names the same pair, both cards on screen ' + JSON.stringify(tabs.all));
      // holding one of his cards: the pointer stays on top of the dossier, so the second card is still named
      await tap(P[0]);
      const held = await help();
      h.assert(held.uche && held.uche.a === P[0] && held.uche.b === P[1] && held.uche.t <= 20, 'recruit: holding his first card, the pointer is still on top ' + JSON.stringify(held.uche));
      await shot(`${D}-5b-pointer-held`);
      await checkLayout(tag('pointer over a held card'));
      await tap(P[0]);
      // six wrong pencils down: he says to erase one first
      const six = await h.ev(() => { const o = V12.ops(), cnt = [o.tries, o.sinceInk]; o.pencils = []; [['s_obi','l_market'],['s_kc','l_lekki'],['s_mama','l_mushin'],['e_wallet','l_mushin'],['m_pos','l_mushin'],['s_obi','l_mushin']].forEach(([a, b]) => V12.pencil(a, b)); V12.closeOps(); V12.openOps('lagos'); const e = document.querySelector('#ops-side .ops-hint'); const r = { n:o.pencils.length, a:e && e.dataset.a, txt:e ? e.textContent.replace(/\s+/g, ' ').trim() : '' }; o.pencils = []; [o.tries, o.sinceInk] = cnt; V12.closeOps(); return r; });
      h.assert(six.n === 6 && six.a === P[0] && /Erase a pencil first, then start there\.$/.test(six.txt), 'recruit: with six pencils down the pointer says to erase one first ' + JSON.stringify(six));
      // "Hints when stuck" off: no pair is named
      const off = await h.ev(() => { SETTINGS.hints = 'off'; V12.openOps('lagos'); const e = document.querySelector('#screen-ops [data-a]'); const r = { named:!!e, txt:((document.querySelector('#ops-side .ops-hint') || {}).textContent || '') }; V12.closeOps(); SETTINGS.hints = 'on'; return r; });
      h.assert(!off.named, 'recruit: with Hints when stuck off, Uche names no pair ' + JSON.stringify(off));
    }

    // ink one: the pointer's pair on Recruit, KC and the market on Senior
    const first = SR ? ['s_kc', 'l_market'] : [pt.p.uche.a, pt.p.uche.b];
    if(!SR){
      // pencilled but not filed: Uche says to FILE it
      await h.ev(([a, b]) => { V12.pencil(a, b); V12.closeOps(); V12.openOps('lagos'); }, first);
      const pp = await help();
      h.assert(pp.uche && pp.uche.a === first[0] && pp.uche.b === first[1] && /pencilled, sir\..*FILE it\.$/.test(pp.uche.txt), 'recruit: a pencilled pointer pair is "FILE it" ' + JSON.stringify(pp.uche));
    }
    await h.ev(([a, b]) => { V12.ops().pencils = []; V12.pencil(a, b); V12.fileLinks(); }, first);
    await h.step(200);
    await h.ev(() => { document.getElementById('bd-rul-ok').click(); });
    f = await foot();
    h.assert(f.inked === 1 && f.status === 'LEKKI NEEDS 3 INKED · 1 SO FAR', tag('one inked: ' + JSON.stringify(f)));
    if(!SR){
      // one pair, once: with it inked he goes back to his nudge and names no other pair (on any tab, held card or not)
      pt = await pointer();
      h.assert(pt.p.uche && !pt.p.uche.a && /Start with what you found today/.test(pt.p.uche.txt) && !/sir\. .*Start there\.$/.test(pt.p.uche.txt), 'recruit: once his pair is inked, Uche names no second pair ' + JSON.stringify(pt.p.uche));
      const anyTab = await h.ev(() => { const out = []; for(const g of ['lagos', 'all', 'route']){ document.querySelector(`.ops-tab[data-g="${g}"]`).click(); out.push(!!document.querySelector('#screen-ops [data-a]')); } document.querySelector('.ops-tab[data-g="lagos"]').click(); document.querySelector('.ops-chip[data-id="s_kc"]').click(); out.push(!!document.querySelector('#screen-ops [data-a]')); document.querySelector('.ops-chip[data-id="s_kc"]').click(); return out; });
      h.assert(anyTab.every(x => !x), 'recruit: no pair named on any tab or over a held card ' + JSON.stringify(anyTab));
      await h.ev(() => V12.closeOps());
    }

    // 4. a wrong link: struck, with the neutral reason and the stakes
    await h.ev(() => { V12.openOps('lagos'); V12.pencil('s_obi', 'l_market'); V12.fileLinks(); });
    await h.step(250);
    const rul = await h.ev(() => {
      const m = document.querySelector('#ops-modal.show .bd-ruling'); if(!m) return null;
      const box = m.getBoundingClientRect();
      const why = [...m.querySelectorAll('li.bad .bd-why')].map(x => x.textContent.trim());
      const st = m.querySelector('.bd-stakes');
      return { why, stakes:st ? st.textContent.replace(/\s+/g, ' ').trim() : null, bad:m.querySelectorAll('li.bad').length, txt:m.textContent,
        inView:box.left >= 0 && box.right <= innerWidth + 1, refused:!!m.querySelector('.bd-refused') };
    });
    h.log(D, 'ruling', JSON.stringify(Object.assign({}, rul, { txt:undefined })));
    h.assert(rul && rul.bad === 1 && rul.why.length === 1 && rul.why[0] === STRUCK_WHY, tag('a struck link gets the neutral reason ' + JSON.stringify(rul && rul.why)));
    h.assert(/LAGOS strike 1\/3/.test(rul.txt) && /Integrity −2/.test(rul.txt), tag('the strike and its cost are still on the ruling'));
    h.assert(rul.stakes === `LAGOS STRIKES 1/3. At three strikes ${STAKES}.` && !rul.refused, tag('the ruling says what three strikes cost: ' + rul.stakes));
    h.assert(rul.inView, tag('the ruling fits the screen'));
    seniorText.push(rul.why[0], rul.stakes);
    await shot(`${D}-6-ruling-strike`);
    await h.ev(() => document.getElementById('bd-rul-ok').click());
    const how = await h.ev(() => document.getElementById('ops-side').textContent.replace(/\s+/g, ' '));
    h.assert(how.includes(`At three strikes ${STAKES}, unless you bring new evidence first.`), tag('HOW IT WORKS says what three strikes cost'));
    seniorText.push(`At three strikes ${STAKES}, unless you bring new evidence first.`);

    // 1. 1 of 3, with a strike
    v = await van();
    h.assert(v.big === 'THE TABLE FIRST' && v.small === '1 of 3 links inked. Pencil two more pairs and FILE them.' && !v.done, tag('the van at 1 ink: ' + JSON.stringify(v)));
    seniorText.push(v.small);
    // a second link that holds (one the pointer has not used), then 2 of 3
    const second = await h.ev(() => {
      const o = V12.ops(), k = (a, b) => a < b ? a + '|' + b : b + '|' + a;
      return [['s_obi', 'l_lekki'], ['s_mama', 'l_lekki'], ['e_madam', 'l_mushin']].find(([a, b]) => !o.inked.includes(k(a, b)));
    });
    await h.ev(([a, b]) => { V12.openOps('lagos'); V12.pencil(a, b); V12.fileLinks(); document.getElementById('bd-rul-ok').click(); V12.closeOps(); }, second);
    v = await van();
    h.assert(v.big === 'THE TABLE FIRST' && v.small === '2 of 3 links inked. Pencil one more pair and FILE it.' && !v.done, tag('the van at 2 inks: ' + JSON.stringify(v)));
    seniorText.push(v.small);
    const vr = await events('van_refused');
    h.log(D, 'van_refused', JSON.stringify(vr));
    h.assert(vr.length === 3 && vr.map(e => e.inked).join() === '0,1,2' && vr.map(e => e.strikes).join() === '0,1,1', tag('van_refused {inked, strikes} on every refusal ' + JSON.stringify(vr)));
    if(!SR){
      // another refusal at 2 of 3 does not buy a second pair
      pt = await pointer();
      h.assert(pt.p.uche && !pt.p.uche.a, 'recruit: at 2 of 3, after another refusal, still no second pair ' + JSON.stringify(pt.p.uche));
      await h.ev(() => V12.closeOps());
    }

    // the bar holds: the help never inks for you, and two more wrong links make three strikes, which release the van
    // without the warrant (the stakes the table now states)
    await h.ev(() => { V12.openOps('lagos'); V12.pencil('s_kc', 'l_lekki'); V12.pencil('s_mama', 'l_mushin'); V12.closeOps(); V12.openOps('lagos'); document.getElementById('ops-file').click(); });   // the real FILE button, offering both
    await h.step(250);
    const r3 = await h.ev(() => {
      const m = document.querySelector('#ops-modal.show .bd-ruling');
      return { why:[...m.querySelectorAll('li.bad .bd-why')].map(x => x.textContent.trim()), refused:(m.querySelector('.bd-refused') || {}).textContent || '', stakes:!!m.querySelector('.bd-stakes'),
        strikes:V12.caseStrikes('lagos'), inked:V12.ops().inked.length, o4:(S.game.objectives.find(o => o.id === 'o4_table') || {}).done };
    });
    h.log(D, 'three strikes', JSON.stringify(r3));
    h.assert(r3.strikes === 3 && r3.inked === 2, tag('three strikes, still two inked: the help changed nothing about the bar'));
    h.assert(r3.why.length === 2 && r3.why.every(x => x === STRUCK_WHY), tag('every struck link gets the same neutral words'));
    h.assert(/THREE STRIKES\./.test(r3.refused) && /Until then the raid goes without it\./.test(r3.refused) && !r3.stakes, tag('the refusal says the raid goes without it ' + r3.refused));
    seniorText.push('Until then the raid goes without it.');
    await h.ev(() => document.getElementById('bd-rul-ok').click());
    const g3 = await foot();
    h.assert(r3.o4 && !/LEKKI NEEDS/.test(g3.status || ''), tag('the objective closed at three strikes; the goal line goes ' + JSON.stringify(g3)));
    v = await van();
    h.assert(v.done, tag('three strikes: the van leaves without the warrant'));
    await h.step(4000);                      // let the trip to Lekki finish loading before the next start
    h.assert((await events('van_refused')).length === 3, tag('a van that leaves is not a refusal'));

    // the Senior rule over every new string it saw
    if(SR){
      const all = seniorText.join(' | ');
      const hits = await cardTerms(all);
      h.log('senior strings', JSON.stringify(seniorText));
      h.assert(hits.length === 0, 'senior: no new string names a card or a tag: ' + hits.join(', '));
    }
  }
  /* ================= C. after the case's raid: three strikes no longer "the raid goes without it" ================= */
  await h.start('m3n', { completed:['m0', 'm1', 'm2', 'm3'], state:S => { S.game.difficulty = 'senior'; S.game.evidence = [{ id:'co_madam', name:'phone' }, { id:'laptop', name:'l' }, { id:'obi_notebook', name:'n' }, { id:'cash', name:'c' }]; } });
  const after = await h.ev(() => {
    const txt = el => el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
    V12.openOps('lagos');
    const how = (txt(document.getElementById('ops-side')).match(/[^.]*[Tt]hree strikes[^.]*\./) || [''])[0].trim();
    V12.pencil('s_obi', 'l_market'); V12.fileLinks();
    const one = txt(document.querySelector('#ops-modal.show .bd-stakes'));
    document.getElementById('bd-rul-ok').click();
    V12.pencil('s_kc', 'l_lekki'); V12.pencil('e_cash', 'l_mushin'); V12.fileLinks();
    const ref = txt(document.querySelector('#ops-modal.show .bd-refused'));
    document.getElementById('bd-rul-ok').click();
    document.querySelector('.ops-tab[data-g="route"]').click();
    const howRoute = (txt(document.getElementById('ops-side')).match(/[^.]*[Tt]hree strikes[^.]*\./) || [''])[0].trim();
    V12.closeOps();
    return { m:S.game.currentMission, strikes:V12.caseStrikes('lagos'), how, one, ref, howRoute };
  });
  h.log('after the Lekki raid', JSON.stringify(after));
  h.assert(after.m === 'm3n' && after.strikes === 3, 'after the raid: three LAGOS strikes filed in m3n ' + JSON.stringify(after));
  h.assert(after.how === 'Three strikes and the warrant is refused until you bring new evidence.', 'after the raid: HOW IT WORKS has no raid clause for LAGOS: ' + after.how);
  h.assert(after.one === 'LAGOS STRIKES 1/3. At three strikes the warrant is refused until you bring new evidence.', 'after the raid: the strike\'s stakes line has no raid clause: ' + after.one);
  h.assert(/THREE STRIKES\./.test(after.ref) && !/raid/.test(after.ref), 'after the raid: the refusal does not say the raid goes without it: ' + after.ref);
  h.assert(after.howRoute.includes(`At three strikes ${STAKES}, unless you bring new evidence first.`), 'THE ROUTE\'s raid is still ahead: its HOW IT WORKS keeps the raid clause: ' + after.howRoute);

  h.assert(h.errors.length === 0, 'no page errors');
};
