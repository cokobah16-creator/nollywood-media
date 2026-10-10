# NACECA v13 on the friends beta · integration notes · 10 Oct 2026

The vendor's v13 drop ("The Case File": Case Desk, weekly briefings, gatekeeper calls, the Abuja van and
wire, the trial and the case review) was built on main @ f7baab8 (the original v12). Main had since gained
v12.2 (hubs, phone, street, sound, car), the brand/naming fixes and the friends beta. **The drop was not
unzipped over the repo**: its build.py would have removed v12.2's modules and the whole beta layer, and its
STORY-CANON.md and prebuilt page predate the naming fixes. Its source is integrated by hand; its own notes
are kept as docs/SYNC-2026-10-07-v13.md.

## Build
- `build.py` layers: v12 → **v13** → beta (`V13_CSS = v13_shared, v13_desk, v13_brief, v13_court`;
  `V13_JS = v13_data, v13_intel, v13_desk, v13_briefing, v13_court, v13_boot`). The beta loads last and wins.
  v13 stays removable: delete src/v13 and its block and the beta runs unchanged.
- Every page carries `window.NACECA_BUILD.src`, a content hash (same source → same page); the playtest
  log records it.
- **A future drop must keep build.py's v12.2 list, the V13 block, the BETA block and `beta/icons.js` in
  LOAD_ORDER.** Send changes as source, not a prebuilt page.

## How v13 meets the beta (decisions)
- **One warrant judge: the board.** Lekki and Asaba are the beta's charge-sheet warrants
  (`V12.warrant()` = `warrantFor('lagos').signed` again). v13 adds two decisions the beta didn't have, both
  ruled by the board: the **Ugbowo production order** (h6, the Route case) and the **Ekosodin warrant** (h7,
  the Voice case; if signed, route it through Lagos HQ — the Commander hears — or straight to Benin Zonal at
  an Agency cost). `V12.warrantState(id)` reads all four; `V12.fileV13Warrant` is the only writer.
  Removed: v13's own Lekki application, the basis meter, the raid-plan APPLY button, the MAGISTRATE tier
  rename, and the leak timers (shorter wipe / tower window) — action-pace penalties.
- **Briefings run inside the hub's Commander call** (h4–h7), after Uche, the phone, the charge sheet and the
  Commander's lines, through a generic `V12.hubCallAfter(h, done)` hook in v12_hub.js. Night Shift's
  briefing still comes before "BENIN BYPASS". Same order on every entry path. Briefings are transactional
  (a reload never replays a committed plan or a lead).
- **Exhibit admissibility** (renamed from v13's "integrity"; reputation Integrity keeps its name): warrantless
  only when the raid went in on exigency, no double penalty with the beta's contested evidence, no-court-order
  only when the production order went without.
- **Senior Agent** (default) gives no answers on any v13 surface: statements file once (UNVERIFIED can be
  replaced once), no relevance markers or toasts, money nodes from flagged clues arrive at the next briefing,
  no "not in your file" in court, the plate match is the player's conclusion. Recruit keeps the vendor's hints.
- **The court and review carry the beta's outcomes:** a wrong name at the finale opens with the public arrest
  and halves the exhibits built against the wrong person; wrong method/money lines weaken their counts; a
  proven, all-right sheet can't be discharged on paperwork alone; the review reads the filed records.
- **The twist stays earned** (canon): the contact is "C." (not CONTROL), no tenure date, the gatehouse plate
  LND 590 XA is just a grey saloon until the player matches it, C.A. Consulting can't be found before Case 04,
  the Locker shows "Lagos HQ" until the reveal, the ledger's missing page shows only after it. Full list in
  STORY-CANON.md "v13 additions".
- **Paper UI:** every v13 screen is restyled on the palette (manila sheets, stamps, line icons, 44px targets,
  no gradients/glows/glyphs). Shared primitives in src/v13/v13_shared.css, scoped to the v13 overlays.
- **Old saves** (the friends' beta): exhibit records are backfilled as "certified before the Case Desk
  existed" with only beta-derived flaws; briefings already passed are marked missed; past h6/h7 the orders
  count as signed.
- **Case Desk entry points:** HUD EVIDENCE → Locker; CASE DESK on the operations table, pause menu and mission
  select; J on desktop. Esc closes to where you came from; pause over any v13 screen resumes into it.

## Playtest log (same session)
src/v12/v12_pt.js now records interaction outcomes (progress / opened / refused / noop), misses, refusals,
per-objective time (play time), walking efficiency and arrow use, stuck/away, hints, chase and wipe endings,
silent mission ends, choices, device and build, and the two questions after the slice ("What was your most
satisfying decision?" / "What happened that felt unfair?" — after the mansion by default, `?slice=m2` etc.).
Export from Settings › PLAYTEST.

## Tests
Harness: `node tools/harness/run.cjs tools/harness/scenarios/<name>.cjs [--html <abs>] [--w --h --touch 1]`.
`h.start(id, {…, briefings:true})` exercises v13 briefings (they're pre-marked done otherwise).
New: v13_a_* (model, warrants, flaws, saves, radio, nav), v13_b_* (order, resume, warrants, rules, esc),
v13_c_* (trials, review, esc/replay, rules), v13_d_* (desk nav, Senior, money gate, warrants tab, rules,
contract), v13_e_spoilers (first-time Senior playthrough through h7), v13_port_flow / _playthrough / _finale
(the drop's Python tests, ported with the integrated rules), pt_logger. The drop's tools/*.py are kept for
reference (they need Python Playwright and real three.js; header notes say they're superseded).

## Needs a human check
Igbo lines in the caretaker calls; legal references in the trial (Evidence Act s.84, Kubor v. Dickson,
ss.14–15, the court and caption); the new minor names and the radio station name; money figures; the
plate format. Base-canon clash left as is: route C says the Voice calls at nine, elsewhere at seven.
Not verified here: real 3D rendering, real fonts, real devices (three.js and Google Fonts are blocked in
this environment).
