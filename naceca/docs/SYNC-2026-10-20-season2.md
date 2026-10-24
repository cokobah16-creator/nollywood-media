# NACECA Season 2 ("Operation Upstream") on our line · sync notes · 20 Oct 2026

Season 2 came as the vendor's **naceca-season2-kit**, built and tested against this branch at 736c79d (v12.2, The Case
File, beta, tactics). Its contract is `docs/season2/INTEGRATION.md`; the cases are `docs/season2/CASES.md`, the trial
`docs/season2/COURT.md`, the layer's API `docs/season2/AGENT_PRIMER.md`, the vendor's own runs
`docs/season2/TEST_RESULTS-kit.md`. Eight cases (m9–m15, with m13b) and six offices (h9–h14), after Season 1.

## The layer
- `src/season2/` (23 scripts, `s2.css`, `s2_court.css`; namespace `window.V13`, a historical name unrelated to our
  `src/v13/`) and `art/season2/env/` (seven baked scenes with lightmaps and anchors; the bake scripts are in
  `tools/blender/`).
- `build.py` runs `tools/season2_inject.py` as the **last** layer, after the beta and tactics: the scenes go into
  `ART_INLINE`, the stylesheets and scripts are appended in the kit's order. The build stamp now covers every layer.
  `NACECA_SEASON2=0 python3 build.py` (or deleting `src/season2`) builds Season 1 only.
- One page, ~20.9 MB (16.5 MB without Season 2). The kit's `--stream` copy (a ~3.7 MB page plus 24 packs) is not used:
  `vercel.json` serves only `naceca.html` and `assets/`. If phones need it, streaming should become our own build step.
- `src/v12/v12_hub.js` exports `V12.PHONEBOOK` and `V12.HUB_ORDER`, and the phone header reads Season 2's offices
  (the kit's recommended change).

## How Season 1 changes when Season 2 is in the page (by design)
- After the trial, the epilogue and the case review, FINISH plays "SEASON 2 · OPERATION UPSTREAM · Six weeks later"
  and starts Case 09 (the first time; once Season 2 has begun the end of the epilogue goes to the title as before).
  A reloaded save then CONTINUEs into Case 09 rather than "CAMPAIGN UP TO DATE".
- In Season 2 (m9–m15, h9–h14) every Case Desk entry — J, TAB, the HUD's CASE FILE/EVIDENCE, the pause menu, the
  operations table, the mission select — opens the **Season 2 case file**; BACK returns to where it was opened.
- Season 2 never rewrites Season 1's verdict: it reads a snapshot (`V13.s1snap()`, `V13.s1fate()`), so Season 1's
  epilogue, review and trial tell her verdict as Season 1 left it.
- Our Season 1 scenarios that finish the season accept that hand-off when the layer is present
  (`tools/harness/scenarios/_s2_handoff.cjs`) and check the title as before on the Season-1-only page.

## What we changed in the kit (all listed in the PR)
A review against our rules, canon and layers found 87 issues (5 blockers, 36 majors, 46 minors); four teams fixed them,
each with a regression probe or scenario; 15 items wait for the product owner, a native speaker, a lawyer or a real
device (below).
- **Paper identity:** `s2.css` and `s2_court.css` rewritten on our tokens (no navy/gold, gradients, glows, blur or
  Georgia); glyph icons replaced with `icon()`; the court's buttons are 44 px; the Case 13 docket chip no longer pushes
  the close button off a 390 px screen; the global `#hud-meters` rule that moved Season 1's meters onto the joystick
  is gone.
- **Senior Agent:** the sources board's EXPOSURE and "fed lies", the fix board's PROTECTS, tier tooltips, and the
  radio/toast/dialogue lines in Cases 10–15 that gave the next step or the answer are Recruit-only (Senior gets a
  neutral line); Case 10 no longer names the changer before you identify him; documents read the casework mode, not
  Action pace; Season 2's timers follow Action pace and the Case 13 docket clock stops while the document is open.
- **Canon** (binding decisions in `docs/STORY-CANON.md` "Season 2 — Operation Upstream" and `docs/season2/CASES.md`
  §6): the agency's name on the painted flag and in headlines; the awards tab no longer spoils M8 on a fresh save;
  Season 2's calendar moves after Season 1; Tobi stays Season 1's accountant (Mr. Igbinosa runs the forensics and is
  PW2) and follows the alive/testifies rule; Count One without "kidnapping for ransom"; "C.A." is a second paymaster
  beside Season 1's retainer; Musa, KC and Tunde follow their Season 1 branches; the seized barge stays seized; names
  that collided with Season 1 or with real people are renamed (Commander Osagie → **Commander Okundaye**,
  Coker-Odusote SAN → **Olaniran-Cole SAN**, Hauwa → **Zainab Danladi**, the full list is in CASES.md §6).
- **Defects:** the Case 12 double press (one seizure), Case 13½ without the vehicle library, Case 15's Monday when the
  office scene never settles (a timeout), Esc and the pause menu over Season 2 screens, a trial left part-way, the
  logger's doubled mission events, the stale "Season 2 is outlined" aftermath line, the build tag.
- **Guards in our layers** (no-ops without Season 2): `v13_desk.js` routes J / pause / HUD through `window.openDesk`;
  `mission_select.js` never marks a teaser card COMPLETED; `v12_ops.js` NOTES skip Season 2 exhibits; `v13_boot.js`
  keeps Season 2 operations out of Season 1's intel record; `v13_intel.js` doesn't reset open flows on a LOAD that
  finds no save.

## Tests
- Season 2 probes: `NACECA_PAGE=<folder> THREE_JS=<three.min.js r128> node tests/t_s2.js probe:<name> [desktop|phone]`
  (`tests/package.json` makes the probes CommonJS; the repo root is an ES module). They need real three.js r128;
  this environment can't download it (cdnjs and the npm registry are blocked), so here they ran on a vector-maths
  stand-in with `ART.failed` (logic only: scenes, people and vehicles use the game's fallbacks).
- Season 1: the harness suite as before (`tools/harness/run.cjs`), on the page with Season 2 and on the
  Season-1-only page. New: `s2_core_*`, `s2_guards_*`, `s2_text_lint`, `s2_text_probes`.

## Waiting for a decision or a check
- **Product owner:** a mid-trial save for Court 5 (it can't be saved part-way; the start card says so); Season 2
  telemetry beyond `V12.log`'s basics (no `seen`/`chase_end` from its eyes and chases yet); streaming for phones; the
  evidence register's `custody_unsigned` objection that can never fire; tone tags and the court's fixed answer order
  on Senior; Season 1's pause→RESUME dropping an open conversation (pre-existing, Season 1 only).
- **Human checks:** real-world name echoes (Edafe, Douglas-Akpan, Kuti, Riverstone and the painted signs), the legal
  and regulatory references (ACJA, Evidence Act s.84, case law, CBN and MLPPA limits, sentences), the Hausa, Urhobo
  and Pidgin lines and proverbs.
- **Real rendering / devices:** the 3D scenes, lighting and painted textures; Tobi's Season 2 model against Season 1's;
  the shield texture (still the vendor's painted crest); frame rate and memory with a 20.9 MB page on mid-range phones;
  whether an environment load can hang on hardware (the timeout path is tested).

## Also in this PR: the Case 02 operations table is legible (21 Oct)
The product owner got stuck at the market van with 2 of 3 links inked and nothing telling them so. Same bar (three
inked links, or three strikes), clearer table (src/v12/v12_ops.js, v12_core.js, guidance.js, v12_pt.js):
- the van's THE TABLE FIRST says "n of 3 links inked" and what to do next;
- in M2 the table's foot reads "LEKKI NEEDS 3 INKED · n SO FAR"; a greyed FILE says "Tap two cards to pencil a
  link"; a held card says how to link it or put it down (reading no longer pencils by surprise);
- a struck link says "The magistrate won't take these two as a direct link in the crime."; the stakes of three
  strikes are stated while that case's raid is still ahead;
- time at the table counts for "Hints when stuck": after 90 s with no new ink, Senior gets a process line with no
  card names ("Link two cards that are connected in the crime, not just known to each other. n of 3 inked."),
  Recruit gets Uche's note, and after a van refusal Uche names one true un-inked pair, once (off when hints are off);
  (24 Oct: a Senior Agent start now sets "Hints when stuck" Off; the Senior process line comes either way, its HINT
  toast and Recruit's note and pair only with it On — DESIGN-tactics.md §11.8);
- the playtest log adds `van_refused {inked, strikes}` and `table_stuck {secs, inked, pencils}`.
Test: `board_m2_help` (both casework modes, 390x844 / 844x390 touch, 1280x800).
